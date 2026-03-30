---
name: pr-review
description: Multi-agent PR reviewer for Fakeflix. Use ONLY when explicitly asked to review a pull request: "review PR #N", "review this PR", "code review", "check this pull request". Do NOT trigger automatically during coding, feature implementation, or general questions.
license: CC-BY-4.0
metadata:
  author: Fakeflix Team
  version: 1.0.0
---

# PR Review — Orchestration Protocol

Coordinates 6 specialized subagents (via the Task tool) then consolidates findings into a unified summary. Each subagent loads the relevant existing project docs — this skill does not duplicate them.

## Step 1: Initialize

1. Get PR number from context or ask the user.
2. Identify repo: `gh repo view --json nameWithOwner -q .nameWithOwner`
3. Fetch diff: `gh pr diff {PR_NUMBER}`
4. Load existing inline comments: `gh api repos/{REPO}/pulls/{PR_NUMBER}/comments` — build a set of `{path, line}` pairs to avoid reposting.
5. Read PR intent: `gh pr view {PR_NUMBER} --json title,body,headRefName`
6. Check for a linked Jira ticket in the branch name (pattern `[A-Z]+-[0-9]+`).

## Step 2: Launch Subagents in Parallel

Send **one message** with **six Task tool calls** — all launched simultaneously. Pass REPO, PR_NUMBER, the diff, existing comment locations, and PR intent to each subagent prompt. After all complete, run Step 3.

---

## Severity Labels (all subagents use these)

- 🚨 Critical — bugs or logic errors that will cause failures
- 🔒 Security — security vulnerabilities or data exposure
- ⚡ Performance — significant performance concerns
- ⚠️ Warning — code smells or maintainability issues
- 💡 Suggestion — optional improvements

---

## Universal Rules (every subagent must follow)

1. **Comment allowlist:** Only post inline comments on lines in the diff starting with `+` (excluding `+++`).
2. **Skip duplicates:** If `{path, line}` within ±3 lines already has a comment, skip.
3. **Mark resolved:** Reply `[RESOLVED] This appears resolved by the recent changes.` on existing comments where the issue is fixed.
4. **False positive guard:** Only report findings with ≥80% confidence. Skip when uncertain.
5. **Positive highlight:** Include at least one well-done aspect of the change before listing issues.
6. **Tone:** Specific, actionable, collegial. Explain WHY something is a problem.
7. **Never** approve, request-changes, or modify files. Use `--comment` only.
8. **Marker:** Start every inline comment body with `<!-- cursor-review:{type} -->` (invisible in rendered view, used by the consolidation subagent).

---

## Subagent 1: Security

**Marker:** `<!-- cursor-review:security -->`

Load `docs/integration-patterns.md` and focus on the **Security** section. Review the PR diff for any violations of those security patterns: hardcoded secrets, missing auth guards, PII in logs, missing webhook signature validation, overly permissive CORS, clients exported across module boundaries, sensitive fields in response DTOs, and raw query concatenation.

**Second pass:** Re-read the full diff from top to bottom. List every file or hunk you did not comment on. For each uncovered file, ask: "Does this file violate any security rule in my scope?" Only skip a file when you can explicitly state why it is clean.

**Comment format:**
```
<!-- cursor-review:security -->
🔒 Security — [Short title]
[What the issue is and why it matters]
**Recommendation:** [Specific fix]
```

---

## Subagent 2: Requirements & Definition of Done

**Marker:** `<!-- cursor-review:requirements -->`
**Posts:** One PR-level summary comment only — no inline comments.

Use a two-track approach to find requirements. Run both tracks in parallel; use whichever yields content.

### Track A — Jira Ticket

1. Extract ticket ID from branch name (pattern `[A-Z]+-[0-9]+`).
2. If found, fetch: `curl -su "$JIRA_USER:$JIRA_API_TOKEN" "$JIRA_BASE_URL/rest/api/2/issue/$TICKET_ID?fields=summary,description"`
3. Parse for acceptance criteria, user stories, and DoD checklist items.

### Track B — Repo Spec Files

1. Scan the PR title and body for any reference to spec or task files. Common patterns:
   - Explicit file paths: `.specs/`, `docs/`, `*.spec.md`, `*-tasks.md`, `*-spec.md`
   - Markdown links: `[...](path/to/file.md)`
   - Inline mentions: `spec: path/to/file`, `tasks: path/to/file`
2. Also look for a `.specs/` directory at the repo root — if present, check whether any file inside matches the PR branch name, ticket ID, or feature name (fuzzy match on file stem).
3. For each candidate file found, read it with `cat {path}` and extract: acceptance criteria, task checklist items, and any stated goals or non-goals.

### Resolution Logic

| Tracks with content | Action |
|---|---|
| Both A and B | Merge requirements from both sources; note the source of each item |
| A only | Use Jira requirements |
| B only | Use spec file requirements |
| Neither | Post: "⚠️ No Jira ticket or spec file found — requirements verification skipped." and stop |

Compare the merged requirements against the PR diff and post a summary with `gh pr comment {PR_NUMBER} --body '...'`

**Second pass:** After drafting the summary, re-read the full requirements list one item at a time and ask: "Did I evaluate this criterion against the diff?" For any item not yet assessed, find the relevant section of the diff and explicitly mark it ✅, ❌, or 🔲.

**Summary format:**
```markdown
<!-- cursor-review:requirements -->
## 📋 Requirements Review

**Sources:** {e.g. "Jira: FAKE-123" | "Spec: .specs/recommendations-v2.md" | "Both"}

### ✅ Implemented
### ❌ Missing or Incomplete
### 🔲 Definition of Done
- [x] covered  - [ ] not covered
### 💬 Notes
```

---

## Subagent 3: E2E Test Coverage

**Marker:** `<!-- cursor-review:e2e -->`

Load `.cursor/skills/create-e2e-tests/SKILL.md`. Use those patterns as the reference for what correct tests look like. Review the PR diff for: missing e2e tests on new endpoints (🚨 Critical), test quality issues (wrong file location, missing cleanups, no JWT mock, missing nock), and anti-patterns (hardcoded IDs, raw status codes, no factory, no response body assertions).

**Second pass:** Re-read the full diff from top to bottom. List every new or modified endpoint, controller method, and queue consumer you did not comment on. For each uncovered handler, ask: "Is there a corresponding e2e test covering the happy path and at least one error case?" Only skip a handler when you can explicitly state why e2e coverage already exists or is not applicable.

**Comment format:**
```
<!-- cursor-review:e2e -->
[🚨/⚠️/💡] — [Short title]
[Description of the gap or anti-pattern]
**Recommendation:** [Pattern to follow per create-e2e-tests skill]
```

---

## Subagent 4: Architecture & Coding Patterns

**Marker:** `<!-- cursor-review:architecture -->`

### Phase 0 — Load all reference documents

Load every document listed below before touching the diff. Do not skip any.

1. `docs/coding-patterns.md`
2. `docs/integration-patterns.md`
3. `.cursor/skills/modular-architecture/SKILL.md`
4. `.cursor/skills/modular-architecture/references/principles.md`
5. `.cursor/skills/modular-architecture/references/verification.md`
6. `.cursor/skills/modular-architecture/references/subdomain-persistence.md`
7. `.cursor/skills/modular-architecture/references/module-scaffolding.md`

Then scan the diff for directory structure: if any changed path contains a `shared/` directory alongside multiple `{subdomain}/` sibling folders, the PR touches a **subdomain-based module** — note this for Phase 1.

### Phase 1 — Extract the rule list from the loaded documents

Do not use a hardcoded list. After loading all documents in Phase 0, scan each one and extract every explicit rule into a single numbered checklist. Use these extraction targets per document:

- **`verification.md`** — extract every item from the **New Feature Checklist** and the **Pre-Commit Checklist** sections (look for `□` checkbox markers)
- **`module-scaffolding.md`** — extract every item from the **Post-Generation Checklist** and the **Facade Rules** sections
- **`coding-patterns.md`** — extract every rule marked `✅` or `❌` from each section header
- **`principles.md`** — extract every rule marked `✅` or `❌` from each principle's **Rules** block
- **`subdomain-persistence.md`** — extract every item from the **Verification Checklist for Subdomain Persistence** section — include only if the PR touches a subdomain-based module

Number the combined list sequentially starting from 1. This numbered list is your evaluation matrix for Phase 2. Do not add rules not present in the documents, and do not omit any you find.

### Phase 2 — Evaluate the matrix

Work through the diff **one file at a time**. For each changed file:

- For each rule in the Phase 1 list, decide: **PASS** / **VIOLATION** / **N/A**
- N/A is only valid when the rule is structurally inapplicable to the file type (e.g. a DTO file cannot violate `@Transactional` rules; a migration file cannot violate controller leanness)
- For every VIOLATION: post an inline comment on the exact `+` line in the diff that is the evidence. Include the rule number and source document.

**Second pass:** After completing the matrix for all files, re-read the full diff from top to bottom. List every file or hunk you did not evaluate. For any uncovered file, run the matrix again. Only skip a file when you can explicitly state which rules are N/A and why.

**Comment format:**
```
<!-- cursor-review:architecture -->
[🚨/⚠️/💡] — [Short title]
Rule: [Rule number + which doc, e.g. "Rule 8 — verification.md New Feature Checklist"]
[What in the diff violates it — quote the offending line]
**Recommendation:** [Exact fix, code snippet if < 6 lines]
```

---

## Subagent 5: Regression & Hallucination Detection

**Marker:** `<!-- cursor-review:regression -->`

Review the PR diff for code changes that are unrelated to the PR's stated purpose, or that show signs of AI-generated artifacts. Look for: deleted code unrelated to the change (🚨 Critical), phantom imports referencing non-existent symbols (🚨 Critical), method calls with wrong signatures (🚨 Critical), `TODO` left in production code, type assertions hiding compiler errors, duplicate logic that already exists in the module, weakened error handling or validation, silently swallowed queue job errors, weakened test assertions, and dead code that is never called.

**Second pass:** Re-read the full diff from top to bottom. List every file or hunk you did not comment on. For each uncovered file, ask: "Does this file contain any unrelated deletions, phantom imports, duplicate logic, or weakened assertions?" Only skip a file when you can explicitly state why none of those categories apply.

**Comment format:**
```
<!-- cursor-review:regression -->
[🚨/⚠️/💡] — [Short title]
Type: [unrelated-deletion | phantom-import | hallucination | duplicate | regression | dead-code]
[Specific description with quoted evidence from the diff]
**Recommendation:** [Exact fix]
```

---

## Subagent 6: Performance

**Marker:** `<!-- cursor-review:performance -->`

Load `docs/coding-patterns.md` (Repository Pattern and Transaction Management sections). Only flag issues **clearly visible in the diff** — no speculation. Look for: N+1 query patterns (repository lookup inside a loop), unbounded `find()` with no pagination, missing `relations` causing lazy-load N+1, sequential `await` for independent operations that could use `Promise.all`, and multiple `repository.save()` calls without `@Transactional`.

**Second pass:** Re-read the full diff from top to bottom. List every service method, repository call, and loop you did not comment on. For each uncovered block, ask: "Does this contain a clearly visible performance issue?" Only skip a block when you can explicitly state why none of the patterns above apply.

**Comment format:**
```
<!-- cursor-review:performance -->
⚡ Performance — [Short title]
[Description with estimated impact, e.g. "O(N) queries per request"]
**Recommendation:** [Fix with short code sketch if < 6 lines]
```

---

## Step 3: Consolidation

After all 6 subagents complete, spawn one more subagent via Task tool to consolidate:

1. `gh api repos/{REPO}/pulls/{PR_NUMBER}/comments` — fetch all inline comments.
2. Filter to those starting with `<!-- cursor-review: -->` and parse the type from the marker.
3. Fetch PR-level comments for the `<!-- cursor-review:requirements -->` summary.
4. Group by severity: 🔒 Security → 🚨 Critical → ⚡ Performance → ⚠️ Warning → 💡 Suggestion.
5. Deduplicate findings at the same `{path, line}` (±3 lines) — note both agents in the entry.
6. Collect one positive highlight per agent.
7. **Gap detection:** Run `gh pr diff {PR_NUMBER} --name-only` to get the full list of changed files. Cross-reference against all collected inline comment paths. For any file with zero inline comments from any subagent, add it to a `### 🔍 Files With No Inline Comments` section in the summary. Omit a file from this section only if it is a config/lock file (e.g. `*.json`, `*.yaml`, `*.lock`) or a pure type declaration file with no logic.
8. Post: `gh pr review {PR_NUMBER} --comment --body '...'`

**Summary format:**
```markdown
## 🤖 Cursor AI Review Summary

| | |
|---|---|
| **Subagents invoked** | {N} of 6 (Security · Requirements (Jira + Spec) · E2E Coverage · Architecture · Regression · Performance) |
| **Skills loaded** | `.cursor/skills/pr-review/SKILL.md`, `.cursor/skills/create-e2e-tests/SKILL.md` |
| **Docs loaded** | `docs/coding-patterns.md`, `docs/integration-patterns.md`, `.cursor/skills/modular-architecture/SKILL.md` |
| **Findings** | {N} across {M} files |

---

### 🔒 Security ({N})
- [`path/file.ts:L42`] Finding title

### 🚨 Critical ({N})
### ⚡ Performance ({N})
### ⚠️ Warnings ({N})
### 💡 Suggestions ({N})

---
### 🔍 Files With No Inline Comments
- `path/to/file.ts` — no findings from any subagent (verify manually or re-run targeted review)

_(Omit this section if all logic files received at least one comment.)_

---
### ✅ Highlights
- [One positive highlight per agent]

---
> See inline comments for details and recommendations.
```

If no findings across all agents: post `✅ No issues found across all review dimensions.` but still include the metadata table.
