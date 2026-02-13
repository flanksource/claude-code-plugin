---
name: write-canary-transformations
description: Read this when creating canaries with transformation.
---

# Write Canary Transformations

## Goal

Generate correct, production-ready Canary `transform` blocks from user intent.

---

## Quick Decision Tree

Use this to pick the right transform pattern:

1. **Need one check result per item in response?**
   - Use **fan-out transform** (return JSON array of objects, each with `name`).
2. **Need to modify only the current check result?**
   - Use **inline transform** (return one JSON object **without** `name`).
3. **Need to generate new canary/canaries from discovered resources?**
   - Use **canary transform** (return object/array with top-level `spec`).

---

## Golden Rules

1. Prefer `transform.expr` (CEL) by default over `transform.javascript` and `transform.template`.
   - This is a convention for consistency and easier review, not a strict requirement.
   - If JS/template is a better fit for the case, use it.
2. End CEL transforms with `.toJSON()`.
3. For fan-out transforms, always set deterministic `name`.
4. Set `pass` explicitly in transformed checks (do not rely on defaults).
5. Use `deletedAt` when events can resolve/disappear.
6. Use `markFailOnEmpty: true` when empty output should fail the check.
7. Keep check names stable across runs to avoid churn.

---

## Output Contracts

### A) Fan-out transformed checks

Return a JSON array (or object) of transformed check entries.

| Field                     | Required    | Description                                                    | Example                                     |
| ------------------------- | ----------- | -------------------------------------------------------------- | ------------------------------------------- |
| `name`                    | **Yes**     | Check name. Keep deterministic across runs.                    | `db/instance-1`                             |
| `pass`                    | Recommended | Explicit pass/fail status.                                     | `true`                                      |
| `message`                 | No          | User-facing summary.                                           | `Replication lag within threshold`          |
| `description`             | No          | Longer explanation/context.                                    | `Replica is healthy`                        |
| `labels`                  | No          | Labels for filtering/relationships.                            | `{ 'env': 'prod', 'team': 'platform' }`     |
| `namespace`               | No          | Override check namespace.                                      | `production`                                |
| `icon`                    | No          | UI icon override.                                              | `alert`                                     |
| `duration`                | No          | Duration in milliseconds.                                      | `1200`                                      |
| `start`                   | No          | Start time.                                                    | `2026-02-13T12:00:00Z`                      |
| `detail`                  | No          | Structured detail payload.                                     | `{ 'raw': r }`                              |
| `data`                    | No          | Additional arbitrary data.                                     | `{ 'source': 'prometheus' }`                |
| `metrics`                 | No          | Emitted metrics from transform.                                | `[{ 'name': 'lag', 'type': 'gauge', ... }]` |
| `deletedAt`               | No          | Mark transformed check as resolved/deleted at a time.          | `r.endsAt`                                  |
| `transformDeleteStrategy` | No          | Behavior when transformed check disappears (`Mark*`,`Ignore`). | `MarkHealthy`                               |

### B) Inline transformed result

Return a **single JSON object** and **omit `name`**.

| Field         | Required  | Description                             | Example                                               |
| ------------- | --------- | --------------------------------------- | ----------------------------------------------------- |
| `name`        | Must omit | If set, this becomes fan-out behavior.  | _omit_                                                |
| `pass`        | No        | Override pass/fail status.              | `json.status == 'ok'`                                 |
| `message`     | No        | Override message.                       | `'status=' + string(json.status)`                     |
| `description` | No        | Override description.                   | `'Health summary'`                                    |
| `error`       | No        | Override error text.                    | `'response missing key'`                              |
| `detail`      | No        | Replace detail payload.                 | `{ 'status': json.status }`                           |
| `data`        | No        | Merge additional data into result data. | `{ 'apiVersion': json.version }`                      |
| `duration`    | No        | Override duration (milliseconds).       | `1200`                                                |
| `metrics`     | No        | Add metrics emitted from transform.     | `[{ 'name': 'items', 'type': 'gauge', 'value': 10 }]` |

### C) Transform into canary/canaries

Return **either** one canary object or an array of canary objects.

| Field       | Required | Description             | Example                                      |
| ----------- | -------- | ----------------------- | -------------------------------------------- |
| `name`      | **Yes**  | Child canary name.      | `generated-http-canary`                      |
| `namespace` | No       | Child canary namespace. | `default`                                    |
| `spec`      | **Yes**  | Full child canary spec. | `{ 'schedule': '@every 5m', 'http': [...] }` |

---

## Canonical Snippets

### 1) Fan-out alerts into checks

```yaml
transform:
  expr: |
    results.alerts.map(r, {
      'name': r.name + r.fingerprint,
      'labels': r.labels,
      'icon': 'alert',
      'pass': false,
      'message': r.message,
      'description': r.message,
      'deletedAt': has(r.endsAt) ? r.endsAt : null
    }).toJSON()
```

### 2) Prometheus series to checks

```yaml
transform:
  expr: |
    dyn(results).map(r, {
      'name': r.job,
      'namespace': 'namespace' in r ? r.namespace : '',
      'labels': r.omit(['value', '__name__']),
      'pass': r.value > 0,
      'message': 'job=' + r.job
    }).toJSON()
```

### 3) Inline transform (no new checks)

```yaml
transform:
  expr: |
    {
      'pass': json.status == 'ok',
      'message': 'status=' + string(json.status),
      'detail': {
        'status': json.status,
        'checkedAt': string(time.Now())
      }
    }.toJSON()
```

### 4) Generate child canary from discovery

```yaml
transform:
  expr: |
    {
      'name': 'generated-http-canary',
      'namespace': canary.namespace,
      'spec': {
        'schedule': '@every 5m',
        'http': dyn(results).map(r, {
          'name': r.Object.metadata.namespace + '/' + r.Object.metadata.name,
          'url': 'https://' + r.Object.spec.rules[0].host
        })
      }
    }.toJSON()
```

### 5) Generate multiple child canaries (array output)

```yaml
transform:
  expr: |
    dyn(results).map(r, {
      'name': 'http-' + r.Object.metadata.name,
      'namespace': r.Object.metadata.namespace,
      'spec': {
        'schedule': '@every 5m',
        'http': [{
          'name': r.Object.metadata.name,
          'url': 'https://' + r.Object.spec.rules[0].host
        }]
      }
    }).toJSON()
```

### 6) Empty output should fail

```yaml
markFailOnEmpty: true
transform:
  expr: |
    dyn(results.rows).map(r, {
      'name': r.id,
      'pass': true
    }).toJSON()
```

---

## Deletion / Lifecycle Controls

Use `transformDeleteStrategy` on the parent check when transformed checks may disappear.

Recommended values:

- `MarkHealthy`
- `MarkUnhealthy`
- `Ignore`

Example:

```yaml
transformDeleteStrategy: MarkHealthy
```

---

## Stateful Transform Patterns

### Use prior run state

- `last_result()` gives previous result context.
- Useful for cursors/time windows.

Pattern:

```yaml
transform:
  expr: |
    {
      'detail': {
        'max': string(results.?newest.modified.orValue(last_result().results.?max.orValue('now-60d')))
      }
    }.toJSON()
```

### Use outputs from dependency checks

If checks use `dependsOn`, you can use `outputs.<checkName>...` in expressions/tests.

---

## Common Mistakes to Avoid

1. Returning multiple transformed entries without `name`.
2. Forgetting `.toJSON()` in CEL expressions.
3. Non-deterministic names (e.g., random UUID every run).
4. Forgetting to set `pass` for fan-out checks.
5. Returning empty list unintentionally without `markFailOnEmpty`.
6. Mixing canary-transform output (`spec`) with check-transform output in same object.

---

## Authoring Workflow

When user asks for a transformation:

1. Identify source payload shape (`results`, `json`, rows, messages).
2. Pick transform mode (fan-out / inline / canary).
3. Build minimal output contract.
4. Add `pass`, `message`, stable `name`.
5. Add lifecycle fields (`deletedAt`, `transformDeleteStrategy`) if needed.
6. Return full YAML block ready to paste.

If user provides sample payload, always base transform logic directly on that payload.

---

## References

- Canary spec reference (use this when transform output generates canary `spec`):
  https://flanksource.com/docs/reference/canary-checker/llms.txt
