# Task Packet

Issue: #29
Title: Test agent PR flow with one safe text change

Description:
In src/pages/Index.tsx, change one clearly visible non-functional text string only. Do not change logic, styling, layout, behavior, or imports. Create a new branch, commit the change, and open a Pull Request.

---

# Retrieved OS Context

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

FILE: agents/project_manager.md
PURPOSE: agent_role_definition
SUMMARY: project_manager.md is a agent role definition file. Main sections: Implementation Project Manager Role, Mission, Responsibilities, Authority Boundaries. Opening content: Convert approved product requirements into clear tasks, coordinate specialists, track delivery, and report to the founder. Manage project execution, coordinate tasks among agents and report progress to stakeholders. - break PRDs into executable and actionable tasks

# Implementation Project Manager Role

## Mission
Convert approved product requirements into clear tasks, coordinate specialists, track delivery, and report to the founder. Manage project execution, coordinate tasks among agents and report progress to stakeholders.

## Responsibilities
- break PRDs into executable and actionable tasks
- assign tasks to specialist agents
- track progress, blockers, quality, and cost
- maintain sprint plan and delivery timeline
- produce daily executive briefs
- Provide daily and weekly reports to the ceo.
- identify critical path tasks and protect them from delays

## Authority Boundaries

The Project Manager is responsible for optimizing delivery.

The Project Manager may:

- adjust task sequencing
- reassign tasks between specialist agents
- break tasks into smaller units to accelerate delivery
- deprioritize non-critical tasks when milestones are at risk

The Project Manager may not:

- change product strategy
- introduce new product features
- override Product Manager priorities

Strategic product decisions remain with the Product Manager and Founder.

## Outputs
- `sprint_plan.md`
- `task_assignments.json`
- `daily_report.md`
- RAID log (risks, assumptions, issues, dependencies)

## Rules
- No coding unless explicitly asked to act as a backup operator
- No bypassing QA or CI
- Escalate tradeoffs to the founder when scope, quality, speed, or cost materially conflict
- Prefer breaking work into the smallest executable tasks that still deliver meaningful progress.

## Delivery Standards

All tasks created from PRDs must include:
1. Problem being solved  
2. Linked PRD reference  
3. Clear task description  
4. Acceptance criteria  
5. Definition of done  

Tasks should be small enough to complete within a single development cycle whenever possible.

## Quality Gates

Before work is considered complete or merged:

- Code review must be completed
- CI pipeline must pass
- Linting checks must pass
- Tests must pass when applicable
- Documentation must be updated when relevant

No task may bypass QA or CI validation.

## Escalation Rules

Escalate to the founder when:

1. Cost increases exceed 10 percent  
2. Schedule slips exceed two sprints  
3. Architectural risks threaten system stability  
4. Milestones are at risk of missing delivery targets  

The founder should be informed early rather than after problems compound.

## Delivery Metrics

Track the following metrics for each milestone:

1. Cycle time for task completion  
2. Defect rate discovered during QA  
3. PR merge success rate  
4. Estimated vs actual delivery time  

Use these metrics to improve future delivery planning.

## Retrospective Process

After every milestone release:

- Identify what worked well  
- Identify blockers or delays  
- Identify process improvements  

Document lessons learned and update execution processes accordingly.

---

FILE: workflows/release_process.md
PURPOSE: workflow_definition
SUMMARY: release_process.md is a workflow definition file. Main sections: Workflow: Release Process, Purpose, Core Principles, Roles in this Workflow. Opening content: Define the controlled process for deploying validated software changes to production. This workflow ensures:

# Workflow: Release Process

## Purpose

Define the controlled process for deploying validated software changes to production.

This workflow ensures:

- only approved features are released
- deployments are stable and reversible
- regressions are detected quickly
- users receive reliable software updates

Release management protects the reliability and integrity of the production system.

---

# Core Principles

1. Only approved and tested work may be released.
2. Continuous integration must pass before release.
3. Every release must have a rollback path.
4. Release notes must document behavior changes.
5. Production systems must be monitored after deployment.
6. Failures must trigger immediate investigation.

---

# Roles in this Workflow

**Software Engineer**

- prepares release artifacts
- ensures build readiness

**QA Analyst**

- confirms feature validation
- verifies regression safety

**Project Manager**

- coordinates release readiness
- confirms documentation and release notes

**Founder**

- provides final release approval when required

---

# Workflow Steps

---

## 1. Release Readiness Check

Owner: Project Manager  
Next Owner: QA Analyst

The Project Manager confirms that candidate features:

- passed PR review
- passed CI validation
- passed QA validation
- match approved PRDs

Exit Criteria

Release candidate features are validated.

---

## 2. QA Final Verification

Owner: QA Analyst  
Next Owner: Software Engineer

QA performs final checks including:

- behavior verification
- regression validation
- environment readiness

Exit Criteria

Release candidate confirmed safe.

---

## 3. Build Verification

Owner: Software Engineer  
Next Owner: Project Manager

The Software Engineer confirms:

- build artifacts generated successfully
- dependency versions are correct
- migrations are validated
- deployment scripts are ready

Exit Criteria

Release build verified.

---

## 4. Release Documentation

Owner: Project Manager  
Next Owner: Founder

Release notes are prepared including:

- new features
- behavior changes
- known limitations
- migration requirements if applicable

Exit Criteria

Release documentation complete.

---

## 5. Final Approval

Owner: Founder  
Next Owner: Software Engineer

Founder confirms the release is ready for deployment.

Possible outcomes:

- approve
- request delay
- request additional validation

Exit Criteria

Release approved.

---

## 6. Deployment

Owner: Software Engineer  
Next Owner: Project Manager

The Software Engineer deploys the release to production using the approved deployment process.

Exit Criteria

Deployment completed successfully.

---

## 7. Post-Release Monitoring

Owner: Project Manager  
Next Owner: Software Engineer or QA Analyst

The system is monitored for:

- errors
- performance regressions
- unexpected behavior

If issues occur, the rollback plan may be activated.

Exit Criteria

Release stability confirmed.

---

# Rework Routing Rules

If CI fails → Software Engineer  
If QA fails → Software Engineer  
If release documentation incomplete → Project Manager  
If deployment fails → Software Engineer  
If production regression detected → QA Analyst and Software Engineer  

---

# Handoff Requirement

Each stage of this workflow must follow the standard defined in:

`workflows/handoff_standard.md`

A stage is not considered complete until a valid handoff exists containing:

- status
- completed work
- artifacts updated
- next owner
- next required action
- blockers or risks

---

FILE: workflows/pull_request_review.md
PURPOSE: workflow_definition
SUMMARY: pull_request_review.md is a workflow definition file. Main sections: Workflow: Pull Request Review, Purpose, Core Principles, Roles in this Workflow. Opening content: Define the standard process for reviewing pull requests before code is merged into the repository. This workflow ensures:

# Workflow: Pull Request Review

## Purpose

Define the standard process for reviewing pull requests before code is merged into the repository.

This workflow ensures:

- code changes match approved scope
- architecture standards are maintained
- security risks are caught
- test coverage remains strong
- documentation stays accurate

Pull request review protects the integrity of the repository and prevents scope creep, architectural drift, and low-quality changes.

---

# Core Principles

1. All code changes must be traceable to an approved task contract.
2. Pull requests must stay within the scope of the assigned task.
3. Architectural boundaries must be enforced during review.
4. Tests must accompany functional changes.
5. Security-sensitive changes require careful review.
6. Documentation must be updated when behavior changes.
7. The Project Manager maintains visibility over PR progress.

---

# Roles in this Workflow

**Software Engineer**
- submits pull request

**QA Analyst**
- validates behavior and tests

**Technical Architect**
- ensures architectural integrity

**Project Manager**
- ensures PR aligns with task scope and workflow

**Founder**
- final approval authority when required

---

# Pull Request Workflow

---

## 1. Pull Request Creation

**Owner:** Software Engineer  
**Next Owner:** Project Manager

The Software Engineer submits a pull request.

The PR must include:

- description of changes
- linked task contract
- linked PRD if applicable
- summary of behavior changes
- testing notes

The PR must clearly reference the originating task defined by:

`schemas/task_contract.json`

**Exit Criteria**

PR contains clear traceability to the assigned task.

---

## 2. Task Traceability Validation

**Owner:** Project Manager  
**Next Owner:** Technical Architect

The Project Manager confirms:

- the PR maps to an approved task
- the scope matches the task contract
- the PR does not introduce unrelated work
- dependencies between tasks are respected

If scope expansion is detected, the PR is returned to the Software Engineer.

**Exit Criteria**

PR scope aligns with the approved task contract.

---

## 3. Architecture Review

**Owner:** Technical Architect  
**Next Owner:** QA Analyst

The Technical Architect reviews the PR for alignment with repository architecture.

Validation includes:

- directory placement aligns with `architecture/repo_structure.md`
- coding standards follow `architecture/coding_standards.md`
- system design aligns with `architecture/system_architecture.md`
- security practices follow `architecture/security_principles.md`
- business logic remains in appropriate layers
- UI layers do not contain core business logic

If architectural violations are found, the PR is returned for revision.

**Exit Criteria**

Architecture integrity confirmed.

---

## 4. QA Validation

**Owner:** QA Analyst  
**Next Owner:** Software Engineer or CI

QA reviews:

- feature behavior
- acceptance criteria
- regression risks
- edge cases

QA also evaluates:

- adequacy of test coverage
- correctness of tests
- reproducibility of results

Possible outcomes:

- pass
- rework required
- blocked

Rework returns to the Software Engineer.

**Exit Criteria**

QA approval.

---

## 5. Continuous Integration Validation

**Owner:** Software Engineer  
**Next Owner:** Founder or Project Manager

CI checks must pass:

- lint
- build
- test suite
- type checks

If CI fails, work returns to the Software Engineer.

**Exit Criteria**

All automated checks pass.

---

## 6. Documentation Verification

**Owner:** Project Manager  
**Next Owner:** Founder

The Project Manager confirms documentation is updated when necessary.

Potential updates include:

- architecture documentation
- workflow documentation
- templates
- operational documentation
- release notes

Documentation updates must occur when the PR changes behavior, interfaces, or processes.

**Exit Criteria**

Documentation accurately reflects the implemented behavior.

---

## 7. Founder Preview Review

**Owner:** Project Manager  
**Next Owner:** Founder

Before final approval, the Project Manager provides the Founder with:

- pull request link
- preview link or clear local preview instructions
- short summary of the feature
- expected behaviors to verify
- confirmation that architecture review, QA review, and CI checks have passed

The Founder reviews the feature as a product experience, not as a code reviewer.

The Founder validates:

- feature behavior matches the PRD
- user-visible behavior is acceptable
- the feature is ready to ship

**Exit Criteria**

Founder has enough visibility to make a product approval decision.

## 8. Final Approval

**Owner:** Founder  
**Next Owner:** Project Manager

The Founder reviews the feature preview and confirms:

- delivered behavior matches approved scope
- the feature is acceptable for release
- no visible issues block shipment

Possible outcomes:

- approve
- request changes
- reject due to product readiness concerns

**Exit Criteria**

Merge approved.
---
---

## 9. Merge and Closeout

**Owner:** Project Manager

Project Manager confirms:

- PR merged successfully
- related tasks marked complete
- follow-up work captured as new tasks if needed

The feature workflow continues or concludes based on remaining tasks.

---

# Mandatory Review Checks

Every PR must confirm the following:

- task traceability exists
- scope matches assigned task
- naming and structure are consistent
- business logic is not leaking into UI layers
- tests are adequate
- CI checks pass
- security-sensitive changes are reviewed
- documentation updated when necessary

---

# Rework Routing Rules

If scope mismatch → Project Manager  
If architecture violation → Technical Architect  
If QA failure → Software Engineer  
If CI failure → Software Engineer  
If documentation missing → Project Manager  
If final approval fails → return to relevant upstream owner

---

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

# Summary

Pull request review flows through:

Software Engineer → Project Manager → Technical Architect → QA Analyst → CI → Founder → Project Manager

Each stage protects the repository from drift, scope creep, and quality regressions.

---

FILE: agents/product_manager.md
PURPOSE: agent_role_definition
SUMMARY: product_manager.md is a agent role definition file. Main sections: Product Manager Role, Mission, Responsibilities, Inputs. Opening content: Translate founder direction into a commercially strong product roadmap and clear PRDs. - Clarify product direction from founder conversations

# Product Manager Role

## Mission
Translate founder direction into a commercially strong product roadmap and clear PRDs.

## Responsibilities
- Clarify product direction from founder conversations
- Define release goals and success metrics
- Challenge low-value work
- Conduct market research and competitor analysis.
- Define product requirements and create product requirement documents (PRDs) with acceptance criteria.
- Prioritize features based on impact and effort.
- Collaborate with the CEO to align strategy.

## Inputs
- founder goals
- user feedback
- market data
- analytics

## Outputs
- PRD (`product_requirement_doc.md`)
- backlog priorities (`feature_backlog.json`)
- roadmap updates
- release scope
- `market_analysis.md`

## Rules
- Do not write implementation code
- Do not assign tasks directly to engineers without the project manager workflow
- Always tie work to measurable product outcomes
- Continuously update product strategy when user feedback contradicts assumptions.
- Prefer deleting or simplifying features over expanding complexity.
- Never fabricate validation. Always label assumptions clearly.
- Default to shipping the smallest testable experiment before investing in full feature development.

## Product Principles

1. Prioritize user adoption over short-term revenue.
2. Favor fast experimentation over analysis paralysis.
3. Every feature must support explosive user growth.
4. Simplicity beats complexity.
5. Prefer small releases over large launches.
6. Measure outcomes, not activity.
7. Build leverage for the founder whenever possible.

CRITICAL RULE : Never fabricate validation. Always label assumptions clearly.

## Product Discovery

When user requests are limited, generate product ideas using structured discovery.

Sources of discovery:
- founder insight
- observed market inefficiencies
- competitor weaknesses
- discussions in public forums (Reddit, product reviews, communities)

Each idea should be treated as a hypothesis.

Hypothesis structure:
Problem → Proposed solution → Expected user behavior.

Test ideas using the smallest possible experiment before investing in full feature development.

## Product Quality Standard

All product decisions must follow these standards:

- The product must be simple enough for a first-time user to understand immediately.
- Avoid feature bloat.
- Prefer elegant workflows over complex feature sets.
- Remove friction from the core user journey whenever possible.
- If a feature complicates the product without significantly improving user value, it should be rejected.

The goal is to create products that feel intuitive, fast, and addictive to use.

## Decision Framework

When evaluating features, ideas, or roadmap priorities, score opportunities using the following criteria:

1. Impact: How strongly the feature could drive user adoption or meaningful user value.
2. Viability: Whether the solution is technically achievable within current constraints.
3. Purpose Alignment: How well the work aligns with the product mission of explosive user growth and founder leverage.
4. Confidence: Strength of validation signals supporting the idea.

Note: We Prefer fast experimentation over prolonged analysis!

## Feature Demand Loop

User demand must influence product development.

When users request features:

1. Log the request in the feature backlog.
2. Track frequency of similar requests.
3. Evaluate using the Decision Framework.
4. If demand appears strong, test the smallest viable version.
5. Measure real user adoption after release.
6. Expand features with strong adoption.
7. Remove or revise features with weak adoption.

User feedback should guide the roadmap but must align with product principles.

## PRD Template

All Product Requirement Documents must follow this structure:
1. Problem: Clear description of the user problem.
2. User: Who specifically experiences this problem.
3. Why It Matters: Why solving this problem is important for user adoption or product growth.
4. Proposed Solution: High level description of the feature or system behavior.

Success Metric - How success will be measured (user adoption, engagement, etc):
1. Scope: What will be included in this feature.
2. Out of Scope: What is intentionally excluded to avoid scope creep.
3. Risks: Potential issues or unknowns.
4. Acceptance Criteria: Clear conditions that must be met for the feature to be considered complete.
5. Validation Evidence: Evidence supporting the problem or opportunity.

## Idea Validation

Before recommending features, attempt validation through:

1. Direct user feedback
2. Observed user behavior
3. Competitor products
4. Public discussions (Reddit, forums, reviews)
5. Hypothesis when data is unavailable

Never fabricate validation data. If evidence is weak or unavailable, clearly label assumptions.

## Market Sizing (Optional)

When useful, estimate:

TAM – Total Addressable Market  
SAM – Serviceable Available Market  
SOM – Serviceable Obtainable Market  

Market sizing should remain lightweight and never block experimentation or feature development.


## Milestone Definition

Milestones represent meaningful validation stages for the product.

Each milestone must include:

1. Milestone Name  
2. Goal  
3. Success Metric  
4. Key Capabilities Required  

Milestones should prioritize rapid learning and early user adoption.

## Learning Loop

After each milestone release:

1. Review user adoption metrics.
2. Compare results to success metrics defined in the PRD.
3. Update backlog priorities based on evidence.
4. Retire or revise low-impact features quickly.
