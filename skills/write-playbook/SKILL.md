---
name: write-playbook
description: Generate Mission Control Playbook YAML from natural language. Use when users ask to create, write, modify, or explain playbooks, or want to convert manual workflows into automated playbook YAML.
---

# Write Playbook

## Goal

Turn a user request into a valid Playbook YAML that can be applied in Mission Control.

## How to Use

1. Identify the action type(s) the user needs (exec, http, sql, gitops, github, azureDevopsPipeline, notification, pod, logs, ai).
2. Ask only the minimum clarifying questions required to produce correct YAML (target config types, credentials, parameters, trigger mode).
3. Produce a single Playbook YAML in a fenced code block. Keep it minimal and runnable.
4. If the user mentions secrets, always use connection references or secret refs (do not inline sensitive values).
5. If a request cannot be expressed in a single action type, chain multiple actions in the `actions` list.

## Inputs Checklist

- What the playbook should do (action type)
- Target config types (for `configs:` selector)
- Credentials source (connection name or secret ref)
- Parameters the user should provide at run time
- Trigger mode: manual (default), event-driven (`on:`), or webhook

## Output Rules

- Output YAML only, in a single code block.
- Use `apiVersion: mission-control.flanksource.com/v1` and `kind: Playbook`.
- Set `metadata.name` to a short, unique slug.
- Always include the schema comment: `# yaml-language-server: $schema=https://raw.githubusercontent.com/flanksource/mission-control/main/schema/openapi/playbook.schema.json`

## Quick Decision Tree

Use this to pick the right action type:

1. **Run a shell command (kubectl, helm, scripts)?** → `exec`
2. **Call an external HTTP API?** → `http`
3. **Run a SQL query?** → `sql`
4. **Create a git commit / PR?** → `gitops`
5. **Trigger a GitHub Actions workflow?** → `github`
6. **Trigger an Azure DevOps pipeline?** → `azureDevopsPipeline`
7. **Send a notification (Slack, email, Teams)?** → `notification`
8. **Run a container / pod?** → `pod`
9. **Query logs (Loki, CloudWatch, OpenSearch, K8s)?** → `logs`
10. **AI-powered diagnosis or analysis?** → `ai`

## Golden Rules

1. Every action must have a unique `name` field.
2. Use `$()` delimiters for Go templates (NOT `{{ }}`).
3. For shell scripts that use `$()` for subshells, switch delimiters:
   ```bash
   # gotemplate: left-delim=$[[ right-delim=]]
   ```
4. Use `connections.fromConfigItem: '$(.config.id)'` for exec actions that need the config item's cluster context.
5. Reference parameters with `$(.params.<name>)` and config with `$(.config.name)`, `$(.config.tags.namespace)`, etc.
6. For multi-agent setups, use dynamic `runsOn`:
   ```yaml
   runsOn:
     - "$(if .agent)$(.agent.id)$(else)local$(end)"
   ```
7. Chain multiple actions in order; use `if: success()` to gate on previous step success.
8. Set `timeout` on long-running actions (default is 30s).

## Template Context Variables

| Variable | Description | Example |
| --- | --- | --- |
| `.config.id` | Config item UUID | `$(.config.id)` |
| `.config.name` | Config item name | `$(.config.name)` |
| `.config.type` | Full type (e.g. `Kubernetes::Deployment`) | `$(.config.type)` |
| `.config.config_class` | Short class (e.g. `Deployment`) | `$(.config.config_class)` |
| `.config.tags.namespace` | Kubernetes namespace from tags | `$(.config.tags.namespace)` |
| `.config.config` | Raw JSON config object | `$(.config.config.spec.replicas)` |
| `.config.config \| jq "..."` | JQ query on config JSON | `$(.config.config \| jq ".spec.template.spec.containers[0].name")` |
| `.config.config \| toJSON \| neat \| json \| toYAML` | Clean YAML of config | Used in code editor defaults |
| `.params.<name>` | User-supplied parameter value | `$(.params.replicas)` |
| `.user.name` | Current user display name | `$(.user.name)` |
| `.user.email` | Current user email | `$(.user.email)` |
| `.agent.id` | Agent identifier | `$(.agent.id)` |
| `.run.id` | Current playbook run UUID | `$(.run.id)` |
| `.git.git.url` | Git repo URL from Flux origin | `$(.git.git.url)` |
| `.git.git.file` | File path from Flux origin | `$(.git.git.file)` |
| `getLastAction.result` | Previous action result | `$(getLastAction.result.stdout)` |
| `getLastAction.result.slack` | Slack-formatted result from AI action | `$(getLastAction.result.slack)` |
| `random.Alpha 8` | Random alphanumeric string | `$(random.Alpha 8)` |
| `time.Now.Format "..."` | Current time formatted | `$(time.Now.Format "2006-01-02")` |
| `strings.ToLower` | Lowercase string | `$(.config.config_class \| strings.ToLower)` |

## Parameter Types

| Type | Description | Example |
| --- | --- | --- |
| `text` | Single-line text input | Replicas count, names |
| `code` | Multi-line code editor | YAML input, scripts |
| `checkbox` | Boolean toggle | Enable/disable options |
| `list` | Dropdown with options | Time durations, roles |
| `config` | Config item picker | Select a ClusterRole, Namespace |
| `people` | People picker | Select users |
| `team` | Team picker | Select teams |
| `millicores` | CPU input (millicores) | CPU requests/limits |
| `bytes` | Memory input (bytes) | Memory requests/limits |

### Parameter Properties

| Property | Description |
| --- | --- |
| `properties.multiline: 'true'` | Enable multiline for text |
| `properties.size: large` | Large editor for code params |
| `properties.colSpan: 4` | Grid column span (1-12) |
| `properties.options` | Array of `{label, value}` for `list` type |
| `properties.filter` | Resource filter for `config` type |

## Canonical Snippets

### 1) exec — kubectl command

```yaml
apiVersion: mission-control.flanksource.com/v1
kind: Playbook
metadata:
  name: scale-deployment
spec:
  title: Scale
  icon: scale-out
  category: Kubernetes
  description: Scales a deployment using kubectl
  configs:
    - agent: all
      types:
        - Kubernetes::Deployment
        - Kubernetes::StatefulSet
  parameters:
    - name: replicas
      label: Replicas
      type: text
      default: "$(.config.config.spec.replicas)"
  runsOn:
    - "$(if .agent)$(.agent.id)$(else)local$(end)"
  actions:
    - name: kubectl scale
      exec:
        connections:
          fromConfigItem: '$(.config.id)'
        script: |
          kubectl scale $(.config.config_class | strings.ToLower) -n $(.config.tags.namespace) $(.config.name) --replicas=$(.params.replicas)
```

### 2) http — call an external API

```yaml
actions:
  - name: call webhook
    http:
      url: 'https://api.example.com/deploy'
      method: POST
      headers:
        - name: Authorization
          valueFrom:
            secretKeyRef:
              name: api-credentials
              key: token
      body: |
        {"name": "$(.config.name)", "namespace": "$(.config.tags.namespace)"}
      templateBody: true
```

### 3) sql — run a database query

```yaml
actions:
  - name: query database
    sql:
      connection: postgres-connection
      query: |
        SELECT count(*) as total FROM orders WHERE status = 'pending' AND created_at > now() - interval '1 hour'
```

### 4) gitops — create a PR with changes

```yaml
actions:
  - name: create PR
    gitops:
      repo:
        url: '$(.git.git.url)'
        connection: github
        branch: update-$(random.Alpha 8)
      commit:
        author: '$(.user.name)'
        email: '$(.user.email)'
        message: 'chore: update $(.config.name)'
      pr:
        title: 'chore: update $(.config.name)'
      patches:
        - path: '$(.git.git.file)'
          yq: |
            select(.metadata.name=="$(.config.config | jq ".metadata.name")").spec.replicas = $(.params.replicas)
```

### 5) github — trigger a workflow

```yaml
actions:
  - name: trigger deploy workflow
    github:
      repo: org/my-repo
      username: deploy-bot
      token:
        valueFrom:
          secretKeyRef:
            name: github-token
            key: token
      workflows:
        - id: deploy.yml
          ref: main
          input: '{"environment": "$(.params.environment)"}'
```

### 6) azureDevopsPipeline — trigger a pipeline

```yaml
actions:
  - name: trigger build
    azureDevopsPipeline:
      org: my-org
      project: my-project
      token:
        valueFrom:
          secretKeyRef:
            name: azdo-token
            key: token
      pipeline:
        id: "42"
      parameters:
        templateParameters:
          environment: production
```

### 7) notification — send to Slack/email

```yaml
actions:
  - name: notify slack
    notification:
      connection: slack-connection
      title: 'Deployment Update'
      message: '$(.config.name) was scaled to $(.params.replicas) replicas by $(.user.name)'
```

### 8) pod — run a container

```yaml
actions:
  - name: run migration
    pod:
      name: 'db-migrate-$(.run.id)'
      spec:
        containers:
          - name: migrate
            image: myapp/migrate:latest
            command: ["./migrate", "up"]
        restartPolicy: Never
      artifacts:
        - path: '/tmp/output/*'
```

### 9) logs — query Kubernetes logs

```yaml
actions:
  - name: fetch logs
    logs:
      kubernetes:
        kind: Pod
        apiVersion: v1
        namespace: '$(.config.tags.namespace)'
        name: '$(.config.name)'
        start: '-1h'
        limit: '1000'
```

### 10) ai — LLM diagnosis

```yaml
actions:
  - name: diagnose
    timeout: 10m
    ai:
      connection: llm-connection
      systemPrompt: 'You are a Kubernetes troubleshooting expert.'
      prompt: '$(.params.prompt)'
      changes:
        since: 7d
      relationships:
        - depth: 5
          direction: all
```

## Advanced Features

### Approval Workflows

Require approval before actions execute:

```yaml
spec:
  approval:
    type: any
    approvers:
      people:
        - admin@example.com
      teams:
        - platform-team
  actions:
    - name: dangerous operation
      exec:
        script: kubectl delete pod $(.config.name) -n $(.config.tags.namespace)
```

### Event-Driven Triggers

Auto-trigger on config/component/canary events:

```yaml
spec:
  on:
    config:
      - event: created
        filter: config.type == 'Kubernetes::Deployment'
      - event: updated
        filter: config.type == 'Kubernetes::Deployment' && change.change_type == 'diff'
      - event: unhealthy
      - event: deleted
    component:
      - event: unhealthy
    canary:
      - event: failed
        filter: check.type == 'http'
  actions:
    - name: auto-remediate
      exec:
        script: echo "Event triggered for $(.config.name)"
```

### Webhook Triggers

Expose an HTTP endpoint that triggers the playbook:

```yaml
spec:
  on:
    webhook:
      path: /deploy
      authentication:
        github:
          token:
            valueFrom:
              secretKeyRef:
                name: webhook-secret
                key: token
  actions:
    - name: handle webhook
      exec:
        script: echo "Webhook received"
```

Authentication options: `basic`, `github`, `svix`, `jwt`.

### Step Delays

Delay a step (useful for cleanup after a timeout):

```yaml
actions:
  - name: grant access
    exec:
      script: kubectl create rolebinding temp-access --user=$(.params.user) --role=edit -n $(.config.name)
  - name: revoke access
    if: 'success() && params.expiry != "0"'
    delay: "params.expiry"
    exec:
      script: kubectl delete rolebinding temp-access -n $(.config.name)
```

### Step Conditions

Use CEL expressions to conditionally run steps:

```yaml
actions:
  - name: diagnose
    ai:
      connection: llm
      systemPrompt: 'Diagnose this resource'
      prompt: '$(.params.prompt)'
      formats:
        - slack
  - name: send to slack
    if: success() && bool(params.notify_slack)
    notification:
      connection: slack
      title: Diagnosis Report
      message: "$(getLastAction.result.slack)"
```

### Retry

Retry a failing action:

```yaml
actions:
  - name: flaky operation
    retry:
      limit: 3
      duration: 10s
      exponent:
        multiplier: 2
    exec:
      script: curl -f https://api.example.com/health
```

### Artifacts

Capture files produced by exec or pod actions:

```yaml
actions:
  - name: collect diagnostics
    exec:
      script: |
        mkdir -p /tmp/diag
        kubectl logs $(.config.name) -n $(.config.tags.namespace) > /tmp/diag/logs.txt
        kubectl describe pod $(.config.name) -n $(.config.tags.namespace) > /tmp/diag/describe.txt
      artifacts:
        - path: '/tmp/diag/*'
```

### Shell Script Delimiter Switching

When your bash script uses `$()` for command substitution, switch Go template delimiters:

```yaml
actions:
  - name: complex script
    exec:
      script: |
        # gotemplate: left-delim=$[[ right-delim=]]
        ns=$[[.config.tags.namespace]]
        name=$[[.config.name]]
        pods=$(kubectl get pods -n $ns -l app=$name -o name)
        echo "$pods"
```

## Common Mistakes to Avoid

1. Using `{{ }}` delimiters instead of `$()` for Go templates.
2. Forgetting `connections.fromConfigItem` on exec actions that need cluster context.
3. Missing `timeout` on long-running actions (AI, complex scripts).
4. Hardcoding credentials instead of using connections or secret refs.
5. Missing `runsOn` for multi-agent setups (playbook runs on server by default).
6. Using `$()` in shell scripts without switching delimiters.
7. Forgetting `templateBody: true` on HTTP actions with templated body.
8. Missing `name` on action steps.

## Authoring Workflow

When user asks for a playbook:

1. Identify the action type(s) from the Quick Decision Tree.
2. Determine target config types for the `configs:` selector.
3. Identify parameters the user should provide at run time.
4. Determine trigger mode (manual, event, webhook).
5. Pick the right snippets and adapt to the user's use case.
6. Add advanced features if needed (approval, delay, retry, artifacts).
7. Return full YAML block ready to apply.

## Reference

### Schema (Bundled)

`@skills/write-playbook/references/schemas/playbook-spec.schema.json`

Remote: [playbook-spec.schema.json](https://raw.githubusercontent.com/flanksource/mission-control/refs/heads/main/config/schemas/playbook-spec.schema.json)

### Documentation

- Playbooks guide: https://flanksource.com/docs/guide/playbooks/llms.txt
- Playbooks reference: https://flanksource.com/docs/reference/playbooks/llms.txt
- Go template reference: https://flanksource.com/docs/reference/scripting/gotemplate/llms.txt
- CEL expression reference: https://flanksource.com/docs/reference/scripting/cel/llms.txt
- Connections reference: https://flanksource.com/docs/reference/connections/llms.txt
