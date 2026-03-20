## Claude Code

You can register this repository as a Claude Code Plugin marketplace by running the following command in Claude Code:

```
/plugin marketplace add flanksource/claude-code-plugin
```

Then, to install the skills:

1. Select `Browse and install plugins`
2. Select `flanksource-mission-control`
3. Select `mission-control-skills`
4. Select `Install now`

Alternatively, directly install the Plugin via:

```
/plugin install mission-control-skills@flanksource-mission-control
```

After installing the plugin, you can use the skills by just mentioning them. The `mission-control-skills` plugin includes:

- `mission-control-overview` - High-level guide to Mission Control features, CRDs, and quick-start actions
- `create-config-scraper` - Generate ScrapeConfig YAML from natural language
- `write-playbook` - Generate Playbook YAML from natural language
- `write-canary-tests` - Write canary `test` expressions and assertions
- `write-canary-transformations` - Write canary `transform` blocks (fan-out, inline, generated canaries)
- `troubleshooting-health-checks` - Diagnose and fix failing health checks
- `troubleshooting-config-item` - Diagnose unhealthy infrastructure and application configs
- `troubleshooting-notifications` - Investigate and troubleshoot notification alerts
- `promotion-eval-mission-control` - Evaluate Mission Control environment health for release/promotion readiness
- `promotion-eval-create` - Create custom promotion evaluation templates for any system

To uninstall

```sh
/plugin marketplace remove flanksource-mission-control
```

## References

- [Skill naming guide](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices#naming-conventions)
- [Skill description guide](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices#writing-effective-descriptions)
- [Claude code agent](https://code.claude.com/docs/en/skills)
