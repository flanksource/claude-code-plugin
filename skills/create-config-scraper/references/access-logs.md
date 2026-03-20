# Access Logs & RBAC

## Overview

Mission Control tracks who can access what through four entities:

| Entity | Description |
|---|---|
| `config_access` | Links a user/role/group to a specific config item (e.g. "alice has admin on server-1") |
| `external_users` | Users discovered by scrapers (DB logins, IAM users, K8s service accounts) |
| `external_roles` | Roles discovered by scrapers (DB roles, IAM roles, ClusterRoles) |
| `external_groups` | Groups discovered by scrapers (AD groups, IAM groups) |

Entities are matched by **aliases** — string arrays that let different scrapers refer to the same identity. For example a user with aliases `["alice", "alice@example.com"]` will match any `config_access` entry whose `external_user_aliases` contains either value.

## Automatic Extraction

Some scrapers extract RBAC data automatically with no extra config:

### Kubernetes

When a `kubernetes` scraper watches RBAC resources (`ClusterRole`, `ClusterRoleBinding`, `Role`, `RoleBinding`, `ServiceAccount`), the scraper automatically:

- Creates `external_roles` from Role and ClusterRole objects
- Creates `external_users` from ServiceAccount and User subjects in bindings
- Creates `external_groups` from Group subjects in bindings
- Creates `config_access` entries linking each subject to the resources governed by the binding's role rules

No transform is needed — just include the RBAC kinds in `watch`.

### GCP

- **IAM policies** are auto-extracted when the GCP scraper runs (uses Cloud Asset API)
- **Audit logs** are extracted when `auditLogs` is configured with a BigQuery dataset

## Custom Extraction with `full: true`

For scrapers that return arbitrary JSON (sql, exec, http, file), set `full: true` on the ScrapeConfig spec. Each result row's JSON can then include these top-level keys:

```json
{
  "id": "row-id",
  "config": { ... },
  "changes": [ ... ],
  "config_access": [ ... ],
  "external_users": [ ... ],
  "external_roles": [ ... ],
  "external_groups": [ ... ],
  "external_user_groups": [ ... ]
}
```

The scraper parses each key into the corresponding model. `config` becomes the config item; the rest populate the access/RBAC tables.

## `config_access` JSON Structure

Each entry in the `config_access` array:

```json
{
  "id": "access-001",
  "external_config_id": {
    "config_type": "MSSQL::Server",
    "external_id": "my-server"
  },
  "external_user_aliases": ["alice", "alice@example.com"],
  "external_role_aliases": ["admin", "owner"],
  "external_group_aliases": ["admins", "super-users"]
}
```

| Field | Required | Description |
|---|---|---|
| `id` | no | Stable identifier for this access entry (auto-generated if omitted) |
| `external_config_id` | yes | Target config item: `config_type` + `external_id` |
| `external_user_aliases` | no | Aliases matching `external_users` entries |
| `external_role_aliases` | no | Aliases matching `external_roles` entries |
| `external_group_aliases` | no | Aliases matching `external_groups` entries |

At least one of `external_user_aliases`, `external_role_aliases`, or `external_group_aliases` should be present.

## `external_users` JSON Structure

```json
{
  "name": "alice",
  "user_type": "SQL_LOGIN",
  "aliases": ["server1/alice"]
}
```

## `external_roles` JSON Structure

```json
{
  "name": "sysadmin",
  "type": "Fixed Server Role",
  "aliases": ["sysadmin"]
}
```

## `external_groups` JSON Structure

```json
{
  "name": "dba-team",
  "group_type": "AD Group",
  "aliases": ["dba-team"]
}
```

## Canonical Example: MSSQL Permissions

This real-world scraper (from `mission-control-registry/charts/mssql`) queries SQL Server logins and uses a CEL transform to emit `external_users`, `external_roles`, and `config_access` in a single pass.

```yaml
apiVersion: configs.flanksource.com/v1
kind: ScrapeConfig
metadata:
  name: mssql-scraper
spec:
  schedule: "@every 4h"
  full: true
  sql:
    - type: MSSQL::Logon
      connection: connection://mssql/credentials
      id: $.id
      name: $.name
      transform:
        expr: |
          [{
            'id': config.id,
            'name': config.name,
            'config': {
              'default_database': config.default_database_name,
              'type': config.type,
              'is_disabled': config.is_disabled,
              'server_roles': has(config.server_roles) && config.server_roles != null
                ? config.server_roles.JSONArray() : [],
              'database_roles': has(config.database_roles) && config.database_roles != null
                ? config.database_roles.JSONArray() : [],
            },
            'external_roles': (
              (has(config.server_roles) && config.server_roles != null ?
                config.server_roles.JSONArray().map(r, {
                  'name': r.role,
                  'type': r.membership_type,
                  'aliases': [r.role],
                }) : []) +
              (has(config.database_roles) && config.database_roles != null ?
                config.database_roles.JSONArray().map(dr, {
                  'name': dr.role_name,
                  'database': dr.database_name,
                  'aliases': [dr.role_name],
                }) : [])
            ),
            'external_users': [{
              'name': config.name,
              'user_type': config.type,
              'aliases': [config.id],
            }],
            'config_access': (
              (has(config.server_roles) && config.server_roles != null ?
                config.server_roles.JSONArray().map(r, {
                  'external_config_id': {
                    'config_type': 'MSSQL::Server',
                    'external_id': 'my-server',
                  },
                  'external_user_aliases': [config.id],
                  'external_role_aliases': [r.role],
                }) : []) +
              (has(config.database_roles) && config.database_roles != null ?
                config.database_roles.JSONArray().map(dr, {
                  'external_config_id': {
                    'config_type': 'MSSQL::Database',
                    'external_id': 'my-server/' + dr.database_name,
                  },
                  'external_user_aliases': [config.id],
                  'external_role_aliases': [dr.role_name],
                }) : [])
            ),
          }].toJSON()
      query: |
        SELECT
          @configId + '/' + sp.name AS [id],
          sp.name AS [name],
          sp.type_desc AS [type],
          sp.is_disabled,
          sp.default_database_name,
          (SELECT sr.name AS [role], sr.type_desc AS [membership_type]
           FROM sys.server_role_members srm
           JOIN sys.server_principals sr ON srm.role_principal_id = sr.principal_id
           WHERE srm.member_principal_id = sp.principal_id
           FOR JSON PATH) AS [server_roles],
          (SELECT dr.DB AS [database_name], dr.role AS [role_name]
           FROM @database_roles dr
           WHERE dr.login_name = sp.name OR dr.principal_sid = sp.sid
           FOR JSON PATH) AS [database_roles]
        FROM sys.server_principals sp
        WHERE sp.type IN ('S', 'U', 'G')
          AND sp.name NOT LIKE '##%'
          AND sp.is_disabled = 0
```

Key patterns in this example:

1. **`full: true`** on the ScrapeConfig spec enables extraction of access data
2. **`external_users`** is a single-element array per row (one user per login)
3. **`external_roles`** concatenates server roles + database roles
4. **`config_access`** maps each role assignment to its target config item using `external_config_id`
5. **CEL `has()` guards** prevent null-reference errors on optional JSON columns
6. **`.JSONArray()`** converts SQL `FOR JSON PATH` strings into CEL arrays
