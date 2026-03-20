---
name: promotion-eval-mission-control
description: >
  Evaluates a Mission Control environment's platform health for release or promotion readiness.
  Checks health check pipelines, config scrapers, background jobs, notifications,
  event queues, and MC infrastructure. Use for pre-release checks, environment promotion,
  or environment status. Triggers: "check environment health", "is it ready for release",
  "pre-release health check", "evaluate environment", "promotion readiness", "environment status"
allowed-tools: mcp__mission-control__view_failing-health-checks_mission-control, mcp__mission-control__list_all_checks, mcp__mission-control__get_check_status, mcp__mission-control__search_catalog, mcp__mission-control__search_catalog_changes, mcp__mission-control__view_mission-control-system_mission-control, mcp__mission-control__view_jobhistory_mission-control, mcp__mission-control__get_playbook_failed_runs, mcp__mission-control__get_playbook_recent_runs, mcp__mission-control__get_playbook_run_steps, mcp__mission-control__view_notification-send-history_mission-control, mcp__mission-control__get_notifications_for_resource, mcp__mission-control__view_mission-control-database_mission-control, mcp__mission-control__list_connections, mcp__mission-control__view_mission-control-pods_mission-control, mcp__mission-control__describe_catalog, mcp__mission-control__get_related_configs
---

# Mission Control Promotion Evaluation Skill

## Core Purpose

Systematically evaluate the health of a Mission Control environment **as a platform** (not demo workloads) to support release and promotion readiness decisions. This skill queries the live environment using MCP tools and produces a structured diagnostic report.

## Important Distinction

This evaluation focuses on **Mission Control platform health** — the components that make MC work (canary-checker, config-db, mission-control deployments, core health checks, scrapers, jobs). It does NOT evaluate demo workloads or user-created resources unless they indicate a platform problem.

**Known expected-fail checks**: Some health checks have the label `Expected-Fail=true`. These are intentional test checks and should be excluded from failure counts and findings.

## Parameters

When invoked, check if the user specified:
- **time_window**: Lookback period (default: `24h`)
- **target**: Environment to evaluate (ask user if not specified)

## Evaluation Procedure

Execute these phases sequentially. After each phase, record component status and findings.

Initialize a running JSON result conforming to @skills/promotion-eval-mission-control/schema.json with:
```json
{
  "verdict": "READY",
  "evaluated_at": "<current ISO timestamp>",
  "time_window": "<window>",
  "target": "<target environment>",
  "components": {},
  "findings": [],
  "recommendations": []
}
```

## Catalog Type Reference

These are the confirmed MissionControl catalog types:
- `MissionControl::ScrapeConfig` — config scrapers
- `MissionControl::Playbook` — playbook definitions
- `MissionControl::Notification` — notification rules
- `MissionControl::Job` — background jobs
- `MissionControl::Canary` — canary check definitions
- `MissionControl::Connection` — external connections
- `MissionControl::Topology` — topology definitions

---

### Phase 1: Health Check Pipelines

**Goal**: Determine if health checks are running and passing.

1. **Get failing checks directly**: `view_failing-health-checks_mission-control` with `withRows=true` and `select=["id","name","type","status","severity","last_transition_time","description"]`
2. **Get total check count**: `list_all_checks` for baseline metrics
3. **Filter out expected failures**: Exclude checks with label `Expected-Fail=true` from failure counts
4. **Drill into real failures**: For each genuinely unhealthy check (not expected-fail), call `get_check_status(id, limit=10)` to retrieve recent execution history. Classify as:
   - **Transient**: Occasional failures mixed with passes
   - **Persistent**: Consistently failing across recent executions
5. **Assess staleness**: From the check list, identify checks where `updated_at` is older than the time window

**Metrics to record**:
- `total_checks`: Total number of health checks
- `healthy_count`: Number currently healthy
- `unhealthy_count`: Number currently unhealthy (excluding expected-fail)
- `expected_fail_count`: Checks labeled Expected-Fail
- `persistent_failures`: Number failing consistently
- `stale_count`: Number not updated within time window
- `health_rate`: Percentage healthy (excluding expected-fail from denominator)

**Verdict logic**:
- PASS: No persistent failures, stale_count == 0, health_rate > 95%
- WARN: Some transient failures OR 1-2 stale checks OR health_rate 80-95%
- FAIL: Any persistent failures OR stale_count > 2 OR health_rate < 80%

---

### Phase 2: Config Scrapers

**Goal**: Verify config scrapers are active and producing fresh data.

1. **Find scraper configs**: `search_catalog` with `type=MissionControl::ScrapeConfig` and `select=["id","name","health","status","updated_at"]`
2. **Check freshness**: For each scraper, check `updated_at` timestamp. Flag any not updated within expected schedule (typically 1h)
3. **Check scraper errors**: `view_mission-control-system_mission-control` with `withPanels=true` — this returns scraper error counts and a list of scrapers with errors
4. **Review recent changes**: `search_catalog_changes` with `type=MissionControl::ScrapeConfig created_at>now-{window}` for config changes

**Metrics to record**:
- `total_scrapers`: Number of scraper configs found
- `active_count`: Scrapers updated within expected window
- `stale_count`: Scrapers not recently updated
- `error_count`: From system view scraper errors panel

**Verdict logic**:
- PASS: All scrapers active, no errors
- WARN: 1-2 scrapers slightly stale OR minor errors
- FAIL: Any scraper missing updates for > 2h OR significant errors

---

### Phase 3: Background Jobs & Playbooks

**Goal**: Check for failed playbook runs and job errors.

1. **Get failed job history**: `view_jobhistory_mission-control` with `withRows=true` and `select=["name","status","duration","error","timestamp"]` limit=20
2. **Get failed playbook runs**: `get_playbook_failed_runs(limit=10)` for recent failures
3. **Get recent playbook runs**: `get_playbook_recent_runs(limit=20)` to calculate success rate
4. **Drill into failures**: For any failed playbook runs, call `get_playbook_run_steps(run_id)` to understand the failure cause
5. **Check playbook catalog health**: `search_catalog` with `type=MissionControl::Playbook health=unhealthy` to find unhealthy playbook definitions

**Metrics to record**:
- `total_recent_runs`: Total playbook runs in window
- `failed_runs`: Number of failed runs
- `success_rate`: Percentage of successful runs
- `job_errors`: Count of job errors from job history view

**Verdict logic**:
- PASS: success_rate > 95%, no recurring job errors
- WARN: success_rate 80-95% OR some job errors
- FAIL: success_rate < 80% OR critical/recurring job failures

---

### Phase 4: Notification Delivery

**Goal**: Verify the notification pipeline is functioning.

1. **Get notification send history**: `view_notification-send-history_mission-control` with `withRows=true` and `select=["id","age","resource_name","resource_current_health","title","notification"]` limit=20
2. **Get notification stats from system view**: The `view_mission-control-system_mission-control` panel (already fetched in Phase 2) includes notification counts by status (SENT, SILENCED, REPEAT-INTERVAL, etc.)
3. **Find notification configs**: `search_catalog` with `type=MissionControl::Notification` and `select=["id","name","health","status"]`
4. **Check for error notifications**: For each notification config, call `get_notifications_for_resource(resource_id, status=error, since=now-{window})`

**Metrics to record**:
- `total_notification_configs`: Number of notification rules
- `sent_count`: From system view
- `silenced_count`: From system view
- `error_count`: Notifications with error status
- `delivery_rate`: sent / (sent + error) percentage

**Verdict logic**:
- PASS: No delivery errors, system view shows sends happening
- WARN: Some errors but delivery_rate > 95%
- FAIL: delivery_rate < 95% or notification system appears down

---

### Phase 5: System & Event Queue

**Goal**: Check overall system health indicators, database, and event queue.

1. **System overview**: `view_mission-control-system_mission-control` with `withPanels=true` (reuse from Phase 2 if already fetched)
   - Check scraper errors, notification stats, agent resource counts
2. **Database health**: `view_mission-control-database_mission-control` with `withPanels=true`
   - Check DB size, active users, DB connections
3. **Connection health**: `list_connections` to verify external integrations are configured

**Metrics to record**:
- `db_size_bytes`: Database size
- `db_connections`: Active connections
- `active_users`: User count
- `total_connections`: Number of configured connections

**Verdict logic**:
- PASS: DB healthy, connections configured, no concerning metrics
- WARN: High DB connections or large DB size growth
- FAIL: Database unreachable or critical system errors

---

### Phase 6: MC Infrastructure Health

**Goal**: Verify Mission Control's own Kubernetes resources are healthy.

1. **Get MC pods directly**: `view_mission-control-pods_mission-control` with `withRows=true` and `select=["name","namespace","status","health","updated"]` — this returns all MC-related pods
2. **Find MC deployments**: `search_catalog` with `type=Kubernetes::Deployment` and name patterns:
   - `name=mission-control*`
   - `name=canary-checker*`
   - `name=config-db*`
   Use `select=["id","name","health","status","updated_at"]` for each.
3. **Describe unhealthy resources**: For any unhealthy MC deployment or pod, call `describe_catalog(id)` to get full details including error messages
4. **Check recent changes**: `search_catalog_changes` with `type=Kubernetes::Deployment name=mission-control* created_at>now-{window}` (and similar for canary-checker, config-db)
5. **Check related configs**: For unhealthy resources, use `get_related_configs` to trace Deployment → ReplicaSet → Pod

**Metrics to record**:
- `total_mc_pods`: MC pods found
- `healthy_pods`: Healthy MC pods
- `unhealthy_pods`: Unhealthy MC pods
- `total_mc_deployments`: MC deployments found
- `healthy_deployments`: Healthy MC deployments
- `recent_changes`: Changes to MC components in time window

**Verdict logic**:
- PASS: All MC resources healthy, no concerning recent changes
- WARN: Recent deployments/changes but all healthy, OR minor pod restarts
- FAIL: Any unhealthy MC deployment or persistent pod failures

---

## Report Generation

After all phases complete, produce the final report in two parts:

### Part 1: Markdown Report

```
# Promotion Evaluation Report

**Target**: <target environment>
**Evaluated at**: <timestamp>
**Time window**: <window>
**Verdict**: **<READY|CAUTION|NOT_READY>**

## Summary

| Component | Status | Key Metrics |
|-----------|--------|-------------|
| Health Checks | <PASS/WARN/FAIL> | <health_rate>% healthy, <persistent_failures> persistent failures |
| Config Scrapers | <PASS/WARN/FAIL> | <active_count>/<total_scrapers> active, <error_count> errors |
| Jobs & Playbooks | <PASS/WARN/FAIL> | <success_rate>% success rate, <failed_runs> failures |
| Notifications | <PASS/WARN/FAIL/SKIP> | <sent_count> sent, <error_count> errors |
| System & DB | <PASS/WARN/FAIL> | DB <db_size>MB, <db_connections> connections |
| MC Infrastructure | <PASS/WARN/FAIL> | <healthy_pods>/<total_mc_pods> pods healthy |

## Findings

<For each finding, sorted by severity (critical first)>
### [severity] [component]: [message]
- **Resource**: [name] ([type], ID: [id])
- **Evidence**: [evidence]

## Recent Changes (Risk Factors)

<List recent changes to MC infrastructure that could affect stability>

## Recommendations

<Numbered list of actionable recommendations>
```

### Part 2: Structured JSON

Output the completed JSON object conforming to the schema. Wrap in a code block with language `json`.

## Overall Verdict Logic

Derive the top-level verdict from component statuses:
- **READY**: All components PASS (or SKIP for non-critical ones)
- **CAUTION**: Any component is WARN, but none are FAIL
- **NOT_READY**: Any component is FAIL

Components that must not FAIL for READY: `health_checks`, `config_scrapers`, `mc_infrastructure`
Components that may SKIP without affecting verdict: `notifications`

## Error Handling

- If an MCP tool call fails or returns unexpected data, record the component as SKIP with a note
- Do not let one phase failure block subsequent phases — evaluate all phases independently
- Reuse data across phases when the same tool was already called (e.g., system view data)
