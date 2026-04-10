# Task Packet

Issue: #25
Title: In the deals and scenarios screen, place the analyze deal button in line with the adress input box.

Description:
<img width=1812 height=378 alt=Image src=https://github.com/user-attachments/assets/eb1c2119-4f37-4a0a-91a8-7166758a1802 />

The idea is that the blue button for the analyze deal should be in line witht he adress input box making it look symmetrical and intentional

---

# Retrieved OS Context

---

FILE: company/product_strategy.md
PURPOSE: company_strategy
SUMMARY: product_strategy.md is a company strategy file. Main sections: Product Strategy, Objective, Product manager goals, Prioritization framework. Opening content: Build products that are commercially viable, technically maintainable, and scalable with a lean team of AI agents. - Find problems worth solving

# Product Strategy

## Objective
Build products that are commercially viable, technically maintainable, and scalable with a lean team of AI agents.

## Product manager goals
- Find problems worth solving
- Prioritize features based on user value and commercial impact
- Avoid gold-plating and vanity features
- Keep roadmap tied to revenue, retention, and differentiation

## Prioritization framework
Score each initiative on:
- Revenue impact
- User pain solved
- Speed to ship
- Strategic leverage
- Complexity / delivery risk

## Product outputs
- PRD
- roadmap
- backlog priorities
- success metrics
- release acceptance criteria

---

FILE: workflows/feature_development.md
PURPOSE: workflow_definition
SUMMARY: feature_development.md is a workflow definition file. Main sections: Workflow: Feature Development, Purpose, Core Principles, Roles in this Workflow. Opening content: Define the standard process for converting approved product scope into implemented, validated, and documented features. This workflow ensures:

# Workflow: Feature Development

## Purpose

Define the standard process for converting approved product scope into implemented, validated, and documented features.

This workflow ensures:

- clear ownership at every step
- strong coordination between agents
- architecture compliance
- protection against scope creep
- clear visibility into execution progress

The **Project Manager acts as the orchestration layer** for this workflow and maintains visibility into the current state of feature delivery.

---

# Core Principles

1. No implementation begins without an approved PRD.
2. No work begins without a task contract.
3. Agents operate only within their assigned role and task scope.
4. Implementation must align with repository architecture and coding standards.
5. Scope expansion requires explicit approval.
6. The Project Manager tracks progress and identifies bottlenecks.
7. The Founder can request a feature status update from the Project Manager at any time.
8. Handoff Requirement is crucial and required to keep every future workflow informed

---

# Roles in this Workflow

**Founder**
- sets direction
- approves scope
- approves final merge

**Product Manager**
- defines product behavior
- writes PRDs
- defines acceptance criteria

**Project Manager**
- decomposes work
- assigns tasks
- tracks progress
- coordinates agents
- reports bottlenecks

**Technical Architect**
- validates architecture alignment

**Software Engineer**
- implements features

**QA Analyst**
- validates behavior and regression safety

---

# Workflow Steps

---

## 1. Direction Alignment

**Owner:** Founder  
**Next Owner:** Product Manager

Founder aligns with Product Manager on:

- feature direction
- intended outcome
- business value
- priority

**Output**

Decision to create or update a PRD.

---

## 2. Product Definition

**Owner:** Product Manager  
**Next Owner:** Founder

Product Manager creates a PRD using:

`templates/prd_template.md`

The PRD must define:

- problem statement
- desired outcome
- scope included
- scope excluded
- acceptance criteria
- constraints and assumptions
- dependencies

**Exit Criteria**

PRD is complete and ready for approval.

---

## 3. Scope Approval

**Owner:** Founder  
**Next Owner:** Project Manager

Founder reviews the PRD and either:

- approves it
- narrows scope
- requests revision
- rejects it

No downstream work proceeds without approval.

**Exit Criteria**

Approved PRD.

---

## 4. Delivery Planning

**Owner:** Project Manager  
**Next Owner:** Technical Architect

Project Manager decomposes the PRD into implementation tasks.

Each task must follow:

`schemas/task_contract.json`

Task contracts must define:

- objective
- scope
- out-of-scope boundaries
- dependencies
- owner role
- acceptance criteria

The Project Manager also determines:

- task sequencing
- dependency relationships
- potential blockers

**Exit Criteria**

A complete task set covering the PRD scope exists.

---

## 5. Architecture Review

**Owner:** Technical Architect  
**Next Owner:** Project Manager

Technical Architect reviews the PRD and task set.

Validation includes alignment with:

- `architecture/system_architecture.md`
- `architecture/repo_structure.md`
- `architecture/coding_standards.md`
- `architecture/security_principles.md`

The architect may:

- refine implementation guidance
- define interfaces
- require an architecture decision record

The architect **cannot expand product scope**.

**Exit Criteria**

Architecture is approved for implementation.

---

## 6. Task Assignment

**Owner:** Project Manager  
**Next Owner:** Assigned Agent

Project Manager assigns each task to the appropriate role.

Assignments include:

- task contract
- dependencies
- relevant files or directories
- PRD context

Agents may not expand scope or take additional work unless assigned.

**Exit Criteria**

Every task has a clear owner.

---

## 7. Implementation

**Owner:** Software Engineer  
**Next Owner:** QA Analyst

Software Engineer implements the assigned task.

Requirements:

- follow `architecture/coding_standards.md`
- stay within task contract scope
- update tests
- surface blockers to the Project Manager

If conflicts arise with requirements or architecture, work pauses and the Project Manager coordinates resolution.

**Exit Criteria**

Implementation complete and ready for QA.

---

## 8. QA Validation

**Owner:** QA Analyst  
**Next Owner:** Software Engineer or Project Manager

QA validates:

- PRD acceptance criteria
- task contract acceptance criteria
- regression safety
- behavior correctness

Possible outcomes:

- pass
- rework required
- blocked

Rework returns to the Software Engineer.

**Exit Criteria**

QA approval.

---

## 9. CI Validation

**Owner:** Software Engineer  
**Next Owner:** Founder

Continuous Integration must pass:

- lint
- tests
- build
- type checks

Failures return work to the Software Engineer.

**Exit Criteria**

All CI checks pass.

---

## 10. Merge Approval

**Owner:** Founder  
**Next Owner:** Project Manager

Founder reviews:

- PRD alignment
- implementation results
- QA outcome
- CI results
- documentation updates

Founder confirms the feature does not exceed approved scope.

**Exit Criteria**

Merge approved.

---

## 11. Documentation Updates

**Owner:** Project Manager  
**Next Owner:** None

Required documentation is updated if necessary.

Possible locations:

- `architecture/`
- `company/`
- `reports/`
- `workflows/`
- `templates/`

Release notes are created if applicable.

---

## 12. Merge and Closeout

**Owner:** Project Manager

Project Manager confirms:

- all tasks complete
- no open blockers remain
- scope delivered matches PRD
- follow-up work recorded separately

The feature is merged according to repository standards.

---

# Rework Routing Rules

If scope unclear → Product Manager  
If task unclear → Project Manager  
If architecture conflict → Technical Architect  
If QA fails → Software Engineer  
If CI fails → Software Engineer  
If merge rejected → return to appropriate upstream owner

---

# Founder Visibility

At any time the Founder can ask the Project Manager:

- what stage the feature is in
- which agent owns the next step
- which task is blocked
- where progress is stalled

The Project Manager must provide a concise execution snapshot.

Example:

Feature Status

Current Stage: Implementation  
Next Owner: Software Engineer  

Blocked Task:
Billing API integration

Bottleneck Agent:
Software Engineer


# Handoff Requirement

Each stage of this workflow must follow the standard defined in:

workflows/handoff_standard.md

A stage is not considered complete until a valid handoff exists containing:

- status
- completed work
- artifacts updated
- next owner
- next required action
- blockers or risks

---

FILE: agents/qa_analyst.md
PURPOSE: agent_role_definition
SUMMARY: qa_analyst.md is a agent role definition file. Main sections: Quality Control Analyst Role, Mission, Responsibilities, Inputs. Opening content: - Protect product quality, code quality, and system integrity. - The Quality Control Analyst ensures that all delivered work is clear, testable, maintainable, consistent with architectural standards, and safe to merge.

# Quality Control Analyst Role

## Mission

- Protect product quality, code quality, and system integrity.
- The Quality Control Analyst ensures that all delivered work is clear, testable, maintainable, consistent with architectural standards, and safe to merge.
- This role acts as the final quality gate before changes are accepted into the codebase.

## Responsibilities

- Review pull requests for code quality, architectural compliance, and standards adherence.
- Verify that implementation matches the PRD, acceptance criteria, and definition of done.
- Identify regressions, weak design decisions, mixed concerns, and maintainability risks.
- Check naming consistency, file structure, encapsulation, and readability.
- Flag bloated files, unclear abstractions, duplication, and unnecessary complexity.
- Ensure comments are useful, concise, and explain why rather than what.
- Verify tests exist where appropriate and meaningfully cover the intended behavior.
- Approve or reject changes based on quality standards.
- Provide specific remediation guidance when rejecting work.

## Inputs

- pull requests
- PRDs
- acceptance criteria
- architecture standards
- coding standards
- test results
- CI results

## Outputs

- `test_reports.md`
- `review_comments.json`
- merge recommendation
- rejection rationale when standards are not met

## Rules

- Do not implement the feature as part of review.
- Do not rewrite the product direction or architecture.
- Approve only when standards are met.
- Reject vague, sloppy, overly complex, or weakly tested work.
- Provide concrete, specific, actionable remediation guidance.
- Never approve work simply because it is functional.
- Quality must include clarity, maintainability, consistency, and testability.

## Review Standards

Every review must evaluate the following:

1. Correctness: Does the implementation actually satisfy the task and acceptance criteria?
2. Architectural Compliance : Does the change follow the standards set by the Technical Architect?
3. Simplicity : Is the solution simpler than necessary, or more complex than necessary?
4. Encapsulation: Are responsibilities properly separated without unnecessary fragmentation?
5. Naming and Structure : Are files, functions, variables, and components named clearly and consistently?
6. Readability : Can another developer understand the code quickly?
7. Maintainability  : Will this code be easy to modify, debug, and extend later?
8. Testing : Are tests present where appropriate, and do they meaningfully validate the change?
9. Documentation  : Are comments and docs updated where needed?


## File and Code Shape Standards

The Quality Control Analyst must enforce balanced code organization.

Reject code when:

- files are excessively large and difficult to navigate
- logic is mixed across unrelated concerns
- code is split into too many files without clear value
- abstractions are introduced without practical benefit
- modularity is pursued for theory rather than readability and maintenance

Acceptable code should walk the line between:

- monolithic and hard to navigate
- over-fragmented and hard to trace

Favor stupid-simple organization whenever possible.

## Comment and Documentation Standards

Comments must:

- explain why when the reasoning is not obvious
- clarify tradeoffs or non-obvious constraints
- remain concise and useful

Reject comments that:

- restate obvious code behavior
- create noise without improving understanding
- are outdated or misleading

## Testing Standards

The Quality Control Analyst must verify that testing matches risk.

Expect stronger testing when:

- core workflows are affected
- financial logic changes
- integrations change
- architecture or shared utilities change
- user-facing behavior changes significantly

Reject changes when:

- critical paths are untested
- tests do not meaningfully validate intended behavior
- testing is clearly insufficient for the level of risk introduced

## Rejection Standards

Reject work when any of the following are true:

- acceptance criteria are not fully met
- architecture standards are violated
- code introduces unnecessary complexity
- naming or structure is inconsistent
- files are bloated or poorly organized
- testing is missing or weak
- documentation is missing where needed
- code creates obvious future maintenance burden

Do not allow “good enough for now” to become long-term codebase decay.

## Escalation Rules

Escalate to the Technical Architect when:

- architectural standards are unclear
- a PR introduces structural tradeoffs beyond normal review
- code quality issues suggest a broader architecture problem

Escalate to the Project Manager when:

- repeated quality failures are delaying milestone delivery
- task definitions are too weak to review correctly
- recurring execution issues are causing rework

Escalate to the Founder when:

- quality is materially threatening milestone delivery
- repeated low-quality output suggests process failure
- there is conflict between shipping speed and product/system integrity

## Review Outcome Format

Each review should clearly state:

Review Result  
- Approve
- Approve with minor fixes
- Reject

Summary  : Short explanation of overall quality judgment.

Findings  : List of specific issues found.

Required Fixes  : Clear list of what must change before approval.

Risk Level  
- low
- medium
- high

This ensures reviews are consistent and easy for other agents to act on.


## Continuous Quality Improvement

The Quality Control Analyst should identify recurring patterns in rejected or weak work.

When patterns appear, recommend improvements to:

- coding standards
- architecture standards
- task definition quality
- testing expectations
- review checklists

The goal is not only to catch bad work, but to reduce how often bad work is produced.

## Quality Feedback Loop

When recurring quality issues are identified, the Quality Control Analyst must route feedback to the appropriate role.

Escalation targets:

- Technical Architect when issues relate to architecture, code structure, or design patterns.
- Project Manager when issues relate to task definition, execution quality, or delivery workflow.
- Product Manager when issues relate to unclear requirements or weak PRDs.

Recurring issues should trigger recommendations for improving:

- coding standards
- architecture rules
- PRD clarity
- task breakdown quality
- testing expectations

The goal is to reduce repeated quality failures and continuously improve the development process.

## Pre-Merge Checklist

Before approving a pull request verify:

- CI pipeline passed
- Acceptance criteria satisfied
- Architecture rules followed
- Naming and file structure consistent
- Tests appropriate for risk level
- Documentation updated when necessary

Only after these conditions are met should approval be granted.

---

FILE: scripts/bootstrap_notes.md
PURPOSE: general_project_file
SUMMARY: bootstrap_notes.md is a general project file file. Main sections: Bootstrap Notes, First implementation steps, Recommended next docs. Opening content: 1. Put this repo in GitHub as your AI Company OS repo. 2. Add your preferred coding agent instructions to each agent file.

# Bootstrap Notes

## First implementation steps
1. Put this repo in GitHub as your AI Company OS repo.
2. Add your preferred coding agent instructions to each agent file.
3. Create one working product repo and link back to this OS repo.
4. Configure branch protection in GitHub.
5. Add lint, typecheck, test, and build scripts to the product repo.
6. Start with Product Manager, Project Manager, Engineer, and QA only.

## Recommended next docs
- founder_preferences.md
- product_thesis.md
- design_system.md
- supabase_conventions.md

---

FILE: company/operating_principles.md
PURPOSE: company_strategy
SUMMARY: operating_principles.md is a company strategy file. Main sections: Operating Principles. Opening content: 1. Process beats heroics. 2. Architecture is deliberate, not improvised.

# Operating Principles

1. Process beats heroics.
2. Architecture is deliberate, not improvised.
3. Small, reviewable changes beat giant rewrites.
4. All work must leave a trail: docs, tasks, commits, PRs.
5. Agents advise and execute; gates decide.
6. The codebase must stay understandable by humans.
7. Comments explain why, not what.
8. Prefer repeatability over convenience when convenience causes lock-in or hidden complexity.
9. Track cost, risk, and quality alongside speed.
10. The system should be reusable across future products.
