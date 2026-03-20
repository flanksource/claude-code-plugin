---
name: promotion-eval-create
description: >
  Create a promotion evaluation template for any system by gathering requirements
  through structured questions and generating a reusable evaluation skill.
  Use when users ask to create a promotion check, release readiness evaluation,
  environment health template, or want to build a custom evaluation workflow
  for systems beyond Mission Control.
disable-model-invocation: true
---

# Create Promotion Evaluation Template

## Core Purpose

Guide the user through a structured interview to build a custom promotion evaluation skill for their system. The output is a complete SKILL.md file they can use to evaluate environment health and release readiness.

Use @skills/promotion-eval-mission-control/SKILL.md as the reference implementation — it demonstrates the structure, phased evaluation approach, verdict logic, and report format that this skill generates for other systems.

## Workflow

### Step 1: Identify the System

Ask the user:

1. **What system or platform** are you evaluating? (e.g., Kubernetes cluster, AWS environment, SaaS application, database cluster, CI/CD pipeline)
2. **What is the evaluation for?** (e.g., release promotion, environment readiness, disaster recovery validation, compliance check)
3. **What environment(s)** will be evaluated? (e.g., staging, production, specific cluster names)

### Step 2: Define Components

Ask the user to list the **health components** they want to evaluate. Suggest categories based on their system type:

**For Kubernetes-based systems:**
- Deployments/StatefulSets health
- Pod status and restarts
- Node health and capacity
- Ingress/networking
- PersistentVolume status
- CronJob success rates

**For cloud infrastructure (AWS/GCP/Azure):**
- Compute instance health
- Database connectivity and replication
- Load balancer targets
- Certificate expiry
- Storage utilization
- Network connectivity

**For SaaS/application systems:**
- API endpoint health
- Database query performance
- Queue depth and processing rates
- Error rates and latency
- Authentication/SSO status
- Third-party dependency health

**For CI/CD pipelines:**
- Build success rates
- Test pass rates
- Deployment success rates
- Artifact availability
- Environment provisioning

For each component, ask:
- **What tool or API** provides the health data? (MCP tool, HTTP endpoint, CLI command, database query)
- **What metrics** matter? (counts, rates, durations, thresholds)
- **What are the PASS/WARN/FAIL thresholds?**

### Step 3: Define Parameters

Ask about configurable parameters:
- **time_window**: What lookback period? (default: 24h)
- **target**: How is the environment identified?
- Any **custom parameters** specific to their system?

### Step 4: Define Verdict Logic

Confirm the overall verdict mapping:
- **READY**: Which components must PASS?
- **CAUTION**: Which components can WARN without blocking?
- **NOT_READY**: Which component failures are blocking?
- Are any components optional (can SKIP without affecting verdict)?

### Step 5: Generate the Skill

Using the gathered information, generate a complete SKILL.md following this structure:

```markdown
---
name: promotion-eval-<system-name>
description: >
  Evaluates <system> health for <purpose>.
  Checks <component list summary>.
  Use for <trigger scenarios>.
allowed-tools: <list of MCP tools or other tools needed>
---

# <System> Promotion Evaluation Skill

## Core Purpose
<One paragraph describing what this evaluation does>

## Parameters
- **time_window**: Lookback period (default: <default>)
- **target**: <how environment is identified>
<any custom parameters>

## Evaluation Procedure
Execute these phases sequentially. After each phase, record component status and findings.

Initialize a running JSON result conforming to the schema:
<JSON template with verdict, components, findings, recommendations>

---

### Phase N: <Component Name>
**Goal**: <what this phase checks>

1. <Step-by-step tool calls or queries>

**Metrics to record**:
- <metric>: <description>

**Verdict logic**:
- PASS: <criteria>
- WARN: <criteria>
- FAIL: <criteria>

---
<repeat for each component>

## Report Generation
<Markdown report template>
<JSON output template>

## Overall Verdict Logic
<Component-to-verdict mapping>

## Error Handling
- If a tool call fails, record the component as SKIP with a note
- Do not let one phase failure block subsequent phases
- Reuse data across phases when possible
```

### Step 6: Review and Refine

Present the generated skill to the user and ask:
- Does the component list look complete?
- Are the thresholds appropriate?
- Should any phases be added or removed?
- Are the tool references correct?

Iterate until the user is satisfied.

## Output

Write the final SKILL.md to the user's chosen location (default: current project's `.claude/skills/` directory).

If the evaluation uses MCP tools, also note which MCP servers need to be configured.
