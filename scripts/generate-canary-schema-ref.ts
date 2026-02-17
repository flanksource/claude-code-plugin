/**
 * Generates skills/mission-control-overview/references/canary-schema.md
 * with OpenAPI schema links for all CRDs across three repos:
 *   - canary-checker  (health checks)
 *   - config-db       (scrapers & plugins)
 *   - mission-control (playbooks, notifications, connections, etc.)
 */

const OUTPUT = "skills/mission-control-overview/references/schemas.md";

interface GithubContent {
  name: string;
  type: string;
}

interface RepoConfig {
  repo: string;
  branch: string;
  path: string;
  heading: string;
  /** Only include files matching this prefix (if set) */
  prefix?: string;
  /** Strip this prefix when deriving the display name */
  stripPrefix?: string;
}

const REPOS: RepoConfig[] = [
  {
    repo: "flanksource/canary-checker",
    branch: "master",
    path: "config/schemas",
    heading: "Health Checks (canary-checker)",
    prefix: "health_",
    stripPrefix: "health_",
  },
  {
    repo: "flanksource/config-db",
    branch: "main",
    path: "config/schemas",
    heading: "Config DB (config-db)",
  },
  {
    repo: "flanksource/mission-control",
    branch: "main",
    path: "config/schemas",
    heading: "Mission Control",
  },
];

function formatName(filename: string, stripPrefix?: string): string {
  let raw = filename.replace(/\.schema\.json$/, "");
  if (stripPrefix) {
    raw = raw.replace(new RegExp(`^${stripPrefix}`), "");
  }
  // Also strip common prefixes for config-db files
  raw = raw.replace(/^config_/, "");

  return raw
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function fetchSchemas(cfg: RepoConfig): Promise<string[]> {
  const url = `https://api.github.com/repos/${cfg.repo}/contents/${cfg.path}?ref=${cfg.branch}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
  });

  if (!res.ok) {
    throw new Error(
      `GitHub API ${cfg.repo} returned ${res.status}: ${await res.text()}`
    );
  }

  const files: GithubContent[] = await res.json();
  const rawBase = `https://raw.githubusercontent.com/${cfg.repo}/refs/heads/${cfg.branch}/${cfg.path}`;

  const schemas = files
    .filter(
      (f) =>
        f.type === "file" &&
        f.name.endsWith(".schema.json") &&
        (!cfg.prefix || f.name.startsWith(cfg.prefix))
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const rows = schemas.map((f) => {
    const name = formatName(f.name, cfg.stripPrefix);
    const schemaUrl = `${rawBase}/${f.name}`;
    return `| ${name} | [${f.name}](${schemaUrl}) |`;
  });

  const ghTreeUrl = `https://github.com/${cfg.repo}/tree/${cfg.branch}/${cfg.path}`;

  return [
    `## ${cfg.heading}`,
    "",
    `> Source: [\`${cfg.repo}/${cfg.path}\`](${ghTreeUrl})`,
    "",
    "| Type | Schema |",
    "| --- | --- |",
    ...rows,
    "",
  ];
}

async function main() {
  const sections: string[][] = [];
  let total = 0;

  for (const cfg of REPOS) {
    const lines = await fetchSchemas(cfg);
    // Count data rows (exclude header lines)
    const dataRows = lines.filter((l) => l.startsWith("| ") && !l.startsWith("| Type") && !l.startsWith("| ---"));
    total += dataRows.length;
    sections.push(lines);
  }

  const md = [
    "# Mission Control — OpenAPI Schemas",
    "",
    "OpenAPI JSON schemas for all Mission Control CRDs.",
    "",
    ...sections.flat(),
  ].join("\n");

  await Bun.write(OUTPUT, md);
  console.log(`Wrote ${total} schemas across ${REPOS.length} repos to ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
