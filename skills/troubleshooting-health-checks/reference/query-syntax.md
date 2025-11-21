### Query Syntax for search_health_checks

**Fields**: id, name, namespace, canary_id, type, status, agent_id, created_at, updated_at, deleted_at, labels._, spec._

**Operators**: =, :, !=, <, >, <=, >=

**Wildcards**:

- `value*`: prefix match
- `*value`: suffix match
- `*value*`: contains match

**Date Math**:

- Absolute: `YYYY-MM-DD`
- Relative: `now±N{s|m|h|d|w|mo|y}` (e.g., `now-24h`, `now-7d`)

**Examples**:

- `name=api* status=unhealthy` - Find unhealthy API checks
- `status=healthy labels.app=web` - Healthy checks with web label
- `created_at>now-24h` - Checks created in last 24 hours
- `updated_at>2025-01-01 updated_at<2025-01-31` - Checks updated in January
