---
name: write-canary-tests
description: Read this when creating canaries with test expressions.
---

# Write Canary Tests

## Goal

Write correct `test` blocks for canary checks.

---

## Golden Rules

- The test result must be boolean (`true` / `false`).
- Use null-safe access for optional fields (`.?` + `orValue(...)`).
- Tests add assertions; they do not bypass built-in check failures.

---

## Test Fields

| Field        | Description                                             | Example                              |
| ------------ | ------------------------------------------------------- | ------------------------------------ |
| `expr`       | CEL expression that evaluates to boolean                | `code == 200 && json.status == 'ok'` |
| `javascript` | JavaScript expression/script returning `true` / `false` | `code === 200`                       |
| `template`   | Go template rendering `true` / `false`                  | `{{ eq .code 200 }}`                 |

---

## Common Test Context

> Exact fields vary by check type.

| Variable              | Description                                     | Example                            |
| --------------------- | ----------------------------------------------- | ---------------------------------- |
| `results`             | Primary result payload for many check types     | `size(results) > 0`                |
| `code`                | HTTP status code (HTTP checks)                  | `code in [200, 201, 301]`          |
| `json`                | Parsed JSON response body (HTTP checks)         | `json.headers['User-Agent'] != ''` |
| `headers`             | HTTP response headers                           | `'Content-Type' in headers.keys()` |
| `sslAge`              | SSL validity duration (HTTP TLS checks)         | `sslAge > Duration('7d')`          |
| `outputs.<checkName>` | Previous named check outputs (with `dependsOn`) | `outputs.getUuid.json.uuid != ''`  |
| `check`               | Current check metadata                          | `check.name != ''`                 |
| `canary`              | Current canary metadata                         | `canary.namespace == 'prod'`       |

---

## Canonical Snippets

### 1) HTTP status + JSON assertion

```yaml
test:
  expr: "code == 200 && json.uuid != ''"
```

### 2) HTTP header assertion

```yaml
test:
  expr: "! ('Authorization' in json.headers.keys())"
```

### 3) Exec stdout assertion

```yaml
test:
  expr: 'results.stdout == "hello"'
```

### 4) Kubernetes health assertion

```yaml
test:
  expr: dyn(results).all(x, k8s.isHealthy(x))
```

### 5) JUnit summary assertion

```yaml
test:
  expr: results.failed == 0 && results.passed > 0
```

### 6) dependsOn output assertion

```yaml
test:
  expr: "code == 200 && outputs.getUuid.json.uuid != ''"
```

### 7) Nil-safe list check

```yaml
test:
  expr: results.?files.orValue([]).size() > 0
```

---

## References

- Canary Checker spec reference:
  https://flanksource.com/docs/reference/canary-checker/llms.txt
