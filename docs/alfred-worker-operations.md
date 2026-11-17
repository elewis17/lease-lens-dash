# Alfred agent task execution

## Queue a task

Create a Lease Lens issue from the repository owner's account. Specify a small,
bounded change, acceptance criteria and the checks to run. Add `agent-ready`
after the issue exists. Adding the label emits the `issues.labeled` event;
editing the description alone or leaving an already-present label does not.

`Dispatch Agent` retrieves OS context, uploads `task-packet`, and comments on
the issue. Successful dispatcher completion starts `Coding Worker`. The worker
uses a pinned AI Company OS revision, runs engineering and QA, and creates or
updates an `agent/issue-N-...` branch and pull request only after QA completes.
No workflow merges or deploys the resulting change.

## Verify the outcome

Open the dispatcher and worker runs in GitHub Actions. Download
`worker-runtime-runs` to inspect the role outputs, implementation artifacts and
`workflow_result.json`. Success requires `passed: true` and a QA result with
both `status` and `workflow_outcome` equal to `completed`. A blocked, incomplete
or exhausted review fails the worker and prevents PR creation. A green job
alone is not evidence that meaningful code tests ran: inspect the reported
checks and the PR diff. The current runner records model QA; application test
execution still requires separate verification before code tasks are accepted.

Runtime files, task packets, engine checkouts and issue output files must not
appear in the proposed application diff. They remain available as Actions
artifacts. Review the PR before approving any merge.

## Retry an existing packet

Use Coding Worker → Run workflow and provide the successful dispatcher run ID
in `dispatcher_run_id`. Select the reviewed workflow branch when testing
isolated fixes. This reuses the existing packet without changing the issue or
re-running retrieval. Do not run simultaneous jobs for the same task.

## Validation evidence

- Issue 33: documentation-only test queued by adding `agent-ready`.
- Initial dispatcher: https://github.com/elewis17/lease-lens-dash/actions/runs/44190824068
- Initial worker: https://github.com/elewis17/lease-lens-dash/actions/runs/44190899680
- Initial result PR: https://github.com/elewis17/lease-lens-dash/pull/34
- Engine fix: https://github.com/elewis17/ai-company-os/pull/2
- Worker fix: https://github.com/elewis17/lease-lens-dash/pull/35
- Isolated patched-worker retry: https://github.com/elewis17/lease-lens-dash/actions/runs/44193049194

The initial worker falsely reported success after blocked QA and included
generated files. Treat that run as diagnostic evidence, not milestone success.
The patched workflow must be reviewed and approved before it becomes the
normal label-triggered path. Projects-board permissions are not required for
this label mechanism; no board-status trigger has been verified.

## Patched worker verification

The final isolated retry passed QA and the explicit QA gate, then automatically
updated PR 34. Its diff contains only docs/alfred-agent-validation.md.

- Successful retry: https://github.com/elewis17/lease-lens-dash/actions/runs/44195518392
- Engine regression CI (8 tests): https://github.com/elewis17/ai-company-os/actions/runs/44195471881
- Worker regression CI (3 tests): https://github.com/elewis17/lease-lens-dash/actions/runs/44195508420

The earlier patched retry correctly failed on a handoff loop. QA received the
implemented file, but agents attempted to delegate PR publication before
completion. The corrected instructions assign branch/PR publication to Actions
after QA completes. Revalidate the normal label path after approved merges.

## Executable code checks (proposed in PR 37)

The existing merged worker's QA is model review. PR 37 adds real Node 24 test
execution before PR publication. Put dependency-free executable checks in
`tests/*.test.mjs` using `node:test`. The worker runs them with `node --test`.
A failing test stops publication; changes under `src` without such tests also
stop publication. This is the initial test contract, not a substitute for
application-specific build, integration or browser checks.

The worker posts a completed/blocked comment and run link on the original issue.
Generated PRs include their evidence run. Source and test changes remain in a
review branch; no worker merges or deploys them.

Code validation issue: https://github.com/elewis17/lease-lens-dash/issues/36
Code and test PR: https://github.com/elewis17/lease-lens-dash/pull/38
Test-execution gate PR: https://github.com/elewis17/lease-lens-dash/pull/37

The first test-gated attempt caught an ES-module import error and posted a
blocked outcome: https://github.com/elewis17/lease-lens-dash/actions/runs/44199308041
The task was corrected to include package.json and its `type: module` setting;
its utility and test must use matching ES-module named exports/imports.
