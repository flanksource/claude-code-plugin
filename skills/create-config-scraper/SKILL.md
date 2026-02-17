---
name: create-config-scraper
description: Generate Mission Control ScrapeConfig YAML from natural language. Use when users ask to build a scraper, create a config scraper, or want YAML to scrape Kubernetes/AWS/GCP/Azure/SQL/HTTP/File/Exec/Logs/Slack/GitHub Actions/Trivy/Terraform sources.
---

# Config Scraper YAML Skill

## Goal

Turn a user request into a valid ScrapeConfig YAML that can be applied in Mission Control.

## How to Use

1. Identify the scraper type(s) the user needs (kubernetes, exec, http, file, sql, logs, aws, gcp, azure, githubActions, slack, trivy, terraform).
2. Ask only the minimum clarifying questions required to produce correct YAML (cluster/region, credentials source, namespace, schedule, filters, and output mapping).
3. Produce a single ScrapeConfig YAML in a fenced code block. Keep it minimal and runnable.
4. If the user mentions secrets, always use secret references (do not inline sensitive values).
5. If a request cannot be expressed in a scraper type, explain the limitation and provide the closest working YAML (often via exec).

## Inputs Checklist

- Target system and scraper type
- Credentials source (secret name + key, or connection name)
- Schedule (optional; omit if not specified)

## Output Rules

- Output YAML only, in a single code block.
- Use `apiVersion: configs.flanksource.com/v1` and `kind: ScrapeConfig`.
- Set `metadata.name` to a short, unique slug.

## Reference

# Scraper Schema Map (Bundled)

Use the bundled per-scraper schemas below. Only open the schema for the requested scraper type(s).

- Kubernetes: `@skills/create-config-scraper/references/schemas/config_kubernetes.schema.json`
- Kubernetes file: `@skills/create-config-scraper/references/schemas/config_kubernetesfile.schema.json`
- Exec: `@skills/create-config-scraper/references/schemas/config_exec.schema.json`
- HTTP: `@skills/create-config-scraper/references/schemas/config_http.schema.json`
- File: `@skills/create-config-scraper/references/schemas/config_file.schema.json`
- SQL: `@skills/create-config-scraper/references/schemas/config_sql.schema.json`
- Logs: `@skills/create-config-scraper/references/schemas/config_logs.schema.json`
- AWS: `@skills/create-config-scraper/references/schemas/config_aws.schema.json`
- GCP: `@skills/create-config-scraper/references/schemas/config_gcp.schema.json`
- Azure: `@skills/create-config-scraper/references/schemas/config_azure.schema.json`
- Azure DevOps: `@skills/create-config-scraper/references/schemas/config_azuredevops.schema.json`
- GitHub Actions: `@skills/create-config-scraper/references/schemas/config_githubactions.schema.json`
- Slack: `@skills/create-config-scraper/references/schemas/config_slack.schema.json`
- Trivy: `@skills/create-config-scraper/references/schemas/config_trivy.schema.json`
- Terraform: `@skills/create-config-scraper/references/schemas/config_terraform.schema.json`

# Config Scraper

Read: https://flanksource.com/docs/guide/config-db/llms.txt
