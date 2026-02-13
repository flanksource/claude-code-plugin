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

- `health` - Skills for diagnosing and fixing health issues with mission control
- `notifications` - Skills for managing and troubleshooting mission control notifications
- `config` - Skills for diagnosing and fixing config items with mission control
- `write-canary-transformations` - Skills for writing canary `transform` blocks in manifests (fan-out checks, inline transforms, and generated canaries)

To uninstall

```sh
/plugin marketplace remove flanksource-mission-control
```

## References

- [Skill naming guide](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices#naming-conventions)
- [Skill description guide](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices#writing-effective-descriptions)
- [Claude code agent](https://code.claude.com/docs/en/skills)
