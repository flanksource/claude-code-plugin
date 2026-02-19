---
name: mission-control-overview
description: High-level guide to Flanksource Mission Control — an Internal Developer Platform for Kubernetes. Use when users ask what Mission Control is, what it offers after installation, available CRDs, and quick-start actions (scrapers, scrape plugins, health checks, notifications, silences, playbooks, views, and connections).
---

# Flanksource Mission Control — Overview Skill

> **MANDATORY FIRST STEP — DO THIS BEFORE ANYTHING ELSE**
>
> Fetch and read **<https://flanksource.com/docs/llms.txt>** right now.
> This is a sitemap of every concept, feature, and reference page in Mission Control.
> Reading it gives you a complete picture of what is available so you can answer accurately.
> **Do not skip this step. Do not answer before reading it.**

## What Is Mission Control?

Flanksource Mission Control is an Internal Developer Platform that helps teams improve developer productivity and operational resilience.

With Mission Control you can:

- [Catalog](https://flanksource.com/docs/guide/config-db) and track changes on infrastructure, applications and configuration.
- [Empower Developers](https://flanksource.com/docs/guide/playbooks) with self-service playbooks for Day 0-2 operations.
- [Run Health Checks](https://flanksource.com/docs/guide/canary-checker) across both cloud-native and legacy infrastructure and applications.
- [Incrementally Adopt GitOps](https://flanksource.com/docs/guide/playbooks/actions/gitops) with playbooks that perform Git commits in the background.
- Aggregate Alerts from [Prometheus](https://flanksource.com/docs/guide/canary-checker/reference/alert-manager), [Cloudwatch](https://flanksource.com/docs/guide/canary-checker/reference/aws-cloudwatch), etc.
- [Build Event Driven Control Planes](https://flanksource.com/docs/guide/playbooks/actions/gitops) with a combination of webhooks, events and GitOps.
- [Notify People and Systems](https://flanksource.com/docs/guide/notifications) about changes in health and configuration.

Mission Control itself adds orchestration, automation, and a web UI on top of these engines via its own CRDs:

| CRD                   | Purpose                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------- |
| `Playbook`            | Multi-step runbook automation (exec, gitops, http, github, notification, SQL, logs, AI) |
| `Notification`        | Alert routing to Slack, email, Teams, webhooks, playbooks, and more                     |
| `NotificationSilence` | Suppress notifications by resource selector, time window, and CEL filter                |
| `Connection`          | Centralized credential & endpoint management (AWS, GCP, Azure, Git, Slack, SMTP, etc.)  |
| `View`                | Custom dashboards with SQL/catalog/config queries, panels, and table layouts            |
| `Application`         | Logical grouping of resources with environments, roles, and access reviews              |
| `Scope`               | Resource-scoped access control boundaries                                               |
| `Permission`          | Fine-grained access control (RBAC + ABAC)                                               |
| `Team`                | User groups for access control and notification routing                                 |

## Documentation

All official documentation is available via structured `llms.txt` files:

| Topic                    | URL                                                                    |
| ------------------------ | ---------------------------------------------------------------------- |
| **Top-level index**      | <https://flanksource.com/llms.txt>                                     |
| Full docs                | <https://flanksource.com/docs/llms.txt>                                |
| User guide               | <https://flanksource.com/docs/guide/llms.txt>                          |
| Config DB guide          | <https://flanksource.com/docs/guide/config-db/llms.txt>                |
| Notifications guide      | <https://flanksource.com/docs/guide/notifications/llms.txt>            |
| Playbooks guide          | <https://flanksource.com/docs/guide/playbooks/llms.txt>                |
| Views guide              | <https://flanksource.com/docs/guide/views/llms.txt>                    |
| Permissions guide        | <https://flanksource.com/docs/guide/permissions/llms.txt>              |
| MCP guide                | <https://flanksource.com/docs/guide/mcp/llms.txt>                      |
| Health checks reference  | <https://flanksource.com/docs/reference/canary-checker/llms.txt>       |
| Config DB reference      | <https://flanksource.com/docs/reference/config-db/llms.txt>            |
| Notifications reference  | <https://flanksource.com/docs/reference/notifications/llms.txt>        |
| Playbooks reference      | <https://flanksource.com/docs/reference/playbooks/llms.txt>            |
| Connections reference    | <https://flanksource.com/docs/reference/connections/llms.txt>          |
| Permissions reference    | <https://flanksource.com/docs/reference/permissions/llms.txt>          |
| CEL expression reference | <https://flanksource.com/docs/reference/scripting/cel/llms.txt>        |
| Go template reference    | <https://flanksource.com/docs/reference/scripting/gotemplate/llms.txt> |
| Installation             | <https://flanksource.com/docs/installation/llms.txt>                   |
| Integrations             | <https://flanksource.com/docs/integrations/llms.txt>                   |
| Helm values reference    | <https://flanksource.com/docs/reference/helm/mission-control>          |

When you need specifics on any subsystem, fetch the relevant `llms.txt` URL above.

## Mission Control Registry

The **[mission-control-registry](https://github.com/flanksource/mission-control-registry)** provides ready-made Helm charts for common integrations:

| Chart                  | What it sets up                                                             |
| ---------------------- | --------------------------------------------------------------------------- |
| `mission-control`      | Core Mission Control deployment (PostgreSQL, Redis)                         |
| `kubernetes`           | Kubernetes cluster scraping                                                 |
| `kubernetes-view`      | Pre-built Kubernetes dashboard views                                        |
| `aws`                  | AWS resource scraping                                                       |
| `azure`                | Azure resource scraping                                                     |
| `gcp`                  | Google Cloud resource scraping                                              |
| `flux`                 | Flux GitOps integration                                                     |
| `argocd`               | ArgoCD integration                                                          |
| `prometheus`           | Prometheus integration                                                      |
| `playbooks-kubernetes` | Kubernetes automation playbooks (scale, restart, drain, logs, delete, etc.) |
| `playbooks-flux`       | Flux GitOps playbooks (reconcile, suspend/resume)                           |
| `playbooks-ai`         | AI-powered troubleshooting playbooks                                        |
| `mongo-atlas`          | MongoDB Atlas monitoring                                                    |
| `postgres`             | PostgreSQL monitoring                                                       |
| `mssql`                | SQL Server monitoring                                                       |
| `helm`                 | Helm release monitoring                                                     |

Use these registry charts to understand and enable integrations in an existing Mission Control setup.

For install/deployment specifics, use the installation docs at:
<https://flanksource.com/docs/installation/llms.txt>

## Core Features

### 1. Catalog (config-db)

A JSON-based CMDB that scrapes and tracks configuration from multiple sources.

**Scraper types (high level):** Kubernetes, Kubernetes File, AWS, Azure, GCP, GitHub, Azure DevOps, HTTP, File, Exec, SQL (Postgres/MSSQL/ClickHouse), Logs, PubSub, Slack, Trivy, Terraform

**Key capabilities:**

- Full config JSON stored and searchable
- Change tracking with JSON patches and diff
- Health status derivation from config state
- Parent/child relationships and dependency graphs
- Cost tracking per resource
- Insights ingestion (security, cost, reliability, compliance)
- Access log/audit ingestion for external users
- Labels and tags for filtering

**CRDs:** `ScrapeConfig`, `ScrapePlugin` (`configs.flanksource.com/v1`)

**ScrapePlugin capabilities:**

- Global change exclusion and change-type mapping
- Global retention policies for config items and changes
- Relationship and property enrichment shared across scrapers

### 2. Health Checks (canary-checker)

Kubernetes-native health monitoring with 35+ built-in check types.

**Check categories:**

- **Protocol:** HTTP, DNS, ICMP, TCP
- **Data sources:** PostgreSQL, MySQL, MSSQL, MongoDB, Redis, Elasticsearch, LDAP, Prometheus
- **Alerts:** Prometheus AlertManager, AWS CloudWatch, Dynatrace
- **Integration testing:** JUnit, JMeter, K6, Newman, Playwright
- **File systems:** Local, S3, GCS, SFTP, SMB
- **Infrastructure:** EC2, Kubernetes Pod/Ingress, S3 protocol
- **Config:** AWS Config, AWS Config Rule, Catalog query, Kubernetes resources
- **Backups:** GCP databases, Restic

**Key capabilities:**

- Scriptable with CEL, JavaScript, Go templates
- Transform responses into multiple sub-checks (fan-out)
- Custom Prometheus metrics export
- JUnit import/export for CI/CD
- Secret management via K8s secrets

**CRD:** `Canary` (`canaries.flanksource.com/v1`)

### 3. Playbooks

Multi-step automation runbooks triggered manually, on events, on webhooks, or on schedule.

**Action types:**

- `exec` — run shell commands (on agent or in pods)
- `http` — make HTTP requests
- `sql` — execute SQL queries
- `gitops` — create commits, branches, PRs (GitHub, GitLab, Azure DevOps)
- `github` — trigger GitHub Actions workflows
- `azureDevopsPipeline` — trigger Azure DevOps pipelines
- `notification` — send notifications
- `pod` — create and manage pods
- `logs` — query logs (Loki, CloudWatch, OpenSearch, Kubernetes)
- `ai` — invoke LLM analysis

**Key capabilities:**

- Parameters with types (text, checkbox, code, config, people, team, duration, list, etc.)
- Approval workflows
- Event-driven triggers (config changes, health failures, etc.)
- Webhook triggers
- Resource selectors to scope which configs/checks can trigger
- Step chaining with templated context

**CRD:** `Playbook` (`mission-control.flanksource.com/v1`)

### 4. Notifications

Event-driven alerting with templated messages.

**Recipients:** email, Slack, Teams, Discord, Telegram, ntfy, Pushover, Pushbullet, webhooks, playbooks

**Key capabilities:**

- Event filtering (config changes, health check failures, etc.)
- CEL-based filters for fine-grained control
- Go template-based title/body
- Repeat intervals and grouping
- Fallback recipients with delay
- Rate limiting

**CRD:** `Notification` (`mission-control.flanksource.com/v1`)

### 5. Notification Silences

Suppress notifications by resource, time window, or condition.

**Key capabilities:**

- Resource selectors (by type, name, labels, tags)
- Time windows (from/until)
- Recursive silencing (parent + children)
- CEL filter expressions

**CRD:** `NotificationSilence` (`mission-control.flanksource.com/v1`)

### 6. Connections

Centralized credential and endpoint management.

**Supported types:** AWS, Azure, GCP, Kubernetes, Git, GitHub, GitLab, HTTP, Slack, SMTP, Telegram, Discord, ntfy, Pushover, Pushbullet, SFTP, SMB, PostgreSQL, OpenSearch, Anthropic, OpenAI, Ollama, Azure DevOps

**CRD:** `Connection` (`mission-control.flanksource.com/v1`)

### 7. Views

Custom dashboards with SQL, catalog, and config-based queries.

**Key capabilities:**

- Multi-query data aggregation with merge/join
- Column definitions with types
- Panel-based visualizations (cards, tables)
- Template variables for dynamic filtering
- Section composition (embed other views)
- Plugin system to attach views as tabs on config pages
- Caching with configurable max/min age

**CRD:** `View` (`mission-control.flanksource.com/v1`)

### 8. Access Control

Fine-grained access control with scopes and teams.

**CRDs:** `Permission`, `PermissionGroup`, `Scope`, `Team`

## Quick-Start Actions

Common first actions in Mission Control:

1. Create a **Canary** health check
2. Create a **ScrapeConfig** to ingest infrastructure configs
3. Add a **ScrapePlugin** for global change filtering/mapping/retention
4. Create **Notification** routing for key events
5. Create **NotificationSilence** windows for maintenance
6. Create **Playbooks** for self-service automation
7. Create **Connections** for credentials and endpoints
8. Create **Views** for Grafana like dashboards
9. Explore integration bundles from the **mission-control-registry**

References:

- [references/schemas.md](references/schemas.md) — OpenAPI schemas for all CRDs across canary-checker, config-db, and mission-control
