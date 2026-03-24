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
**Cap:** 5 inline comments

Load `docs/integration-patterns.md` and focus on the **Security** section. Review the PR diff for any violations of those security patterns: hardcoded secrets, missing auth guards, PII in logs, missing webhook signature validation, overly permissive CORS, clients exported across module boundaries, sensitive fields in response DTOs, and raw query concatenation.

**Comment format:**
```
<!-- cursor-review:security -->
🔒 Security — [Short title]
[What the issue is and why it matters]
**Recommendation:** [Specific fix]
```

---

## Subagent 2: Jira Requirements & Definition of Done

**Marker:** `<!-- cursor-review:jira -->`
**Posts:** One PR-level summary comment only — no inline comments.

1. Extract ticket ID from branch name (pattern `[A-Z]+-[0-9]+`). If none, post: "⚠️ No Jira ticket found — requirements verification skipped." and stop.
2. Fetch: `curl -su "$JIRA_USER:$JIRA_API_TOKEN" "$JIRA_BASE_URL/rest/api/2/issue/$TICKET_ID?fields=summary,description"`
3. Parse for acceptance criteria, user stories, and DoD checklist items.
4. Compare against the PR diff and post summary with `gh pr comment {PR_NUMBER} --body '...'`

**Summary format:**
```markdown
<!-- cursor-review:jira -->
## 📋 Requirements Review: {TICKET_ID}

### ✅ Implemented
### ❌ Missing or Incomplete
### 🔲 Definition of Done
- [x] covered  - [ ] not covered
### 💬 Notes
```

---

## Subagent 3: E2E Test Coverage

**Marker:** `<!-- cursor-review:e2e -->`
**Cap:** 5 inline comments

Load `.cursor/skills/create-e2e-tests/SKILL.md`. Use those patterns as the reference for what correct tests look like. Review the PR diff for: missing e2e tests on new endpoints (🚨 Critical), test quality issues (wrong file location, missing cleanups, no JWT mock, missing nock), and anti-patterns (hardcoded IDs, raw status codes, no factory, no response body assertions).

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
**Cap:** 5 inline comments

Load `docs/coding-patterns.md`, `docs/integration-patterns.md`, and `.cursor/skills/modular-architecture/SKILL.md`. Use those documents as the complete reference. Review the PR diff for violations — critical violations from the modular-architecture skill (entity naming, cross-module DB access, direct Repository extension), high violations from coding-patterns.md (fat controllers, missing @Transactional connectionName, ORM leakage into services, wrong index.ts exports, facade containing logic), and coding standards (naming, enum usage, logger, client encapsulation).

**Comment format:**
```
<!-- cursor-review:architecture -->
[🚨/⚠️/💡] — [Short title]
Rule: [Which rule / which doc]
[What in the diff violates it]
**Recommendation:** [Exact fix, code snippet if < 6 lines]
```

---

## Subagent 5: Regression & Hallucination Detection

**Marker:** `<!-- cursor-review:regression -->`
**Cap:** 5 inline comments

Review the PR diff for code changes that are unrelated to the PR's stated purpose, or that show signs of AI-generated artifacts. Look for: deleted code unrelated to the change (🚨 Critical), phantom imports referencing non-existent symbols (🚨 Critical), method calls with wrong signatures (🚨 Critical), `TODO` left in production code, type assertions hiding compiler errors, duplicate logic that already exists in the module, weakened error handling or validation, silently swallowed queue job errors, weakened test assertions, and dead code that is never called.

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
**Cap:** 3 inline comments

Load `docs/coding-patterns.md` (Repository Pattern and Transaction Management sections). Only flag issues **clearly visible in the diff** — no speculation. Look for: N+1 query patterns (repository lookup inside a loop), unbounded `find()` with no pagination, missing `relations` causing lazy-load N+1, sequential `await` for independent operations that could use `Promise.all`, and multiple `repository.save()` calls without `@Transactional`.

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
3. Fetch PR-level comments for the `<!-- cursor-review:jira -->` summary.
4. Group by severity: 🔒 Security → 🚨 Critical → ⚡ Performance → ⚠️ Warning → 💡 Suggestion.
5. Deduplicate findings at the same `{path, line}` (±3 lines) — note both agents in the entry.
6. Collect one positive highlight per agent.
7. Post: `gh pr review {PR_NUMBER} --comment --body '...'`

**Summary format:**
```markdown
## 🤖 Cursor AI Review Summary

| | |
|---|---|
| **Subagents invoked** | {N} of 6 (Security · Requirements · E2E Coverage · Architecture · Regression · Performance) |
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
### ✅ Highlights
- [One positive highlight per agent]

---
> See inline comments for details and recommendations.
```

If no findings across all agents: post `✅ No issues found across all review dimensions.` but still include the metadata table.
