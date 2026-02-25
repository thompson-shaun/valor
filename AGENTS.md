# Quest Mode — Agent Instructions

## Project Overview

Quest Mode is a gamified behavior point system for a child. It uses token economy principles with game language (XP, quests, levels) to reinforce positive behavior. This repo contains:

- **Docs site** (`docs/`) — Astro Starlight site with parent guide, player guide, reward shop, and quick reference
- **Config** (`config/`) — YAML files defining behaviors, rewards, settings, and thresholds
- **Bank** (`data/`) — JSON-based transaction ledger tracking the reward bank balance
- **GitHub workflows** (`.github/`) — Pages deployment and issue-driven reward updates
- **Skills** (`.claude/skills/`) — Claude Code skills for bank operations (`/bank`), shop management (`/shop`), and weekly check-in (`/checkin`)

## File Structure

```
game-plan/
├── AGENTS.md              # This file
├── CLAUDE.md              # Points here
├── .gitignore
├── README.md              # Open-source project intro
├── HANDOFF.md             # Project history and full design context
├── docs/                  # Astro Starlight site
│   └── src/content/docs/  # Site content (guides, rewards, rules)
├── config/
│   ├── behaviors.yaml     # All behaviors and point values
│   ├── rewards.yaml       # Reward shop items and costs
│   └── settings.yaml      # Bank deposit %, thresholds, rules
├── data/
│   └── <player>/           # One directory per player
│       ├── bank.json       # Current balance (materialized view)
│       └── bank-log.jsonl  # Append-only transaction ledger
├── scripts/
│   └── bank.sh             # Bank transaction script
└── .github/
    ├── workflows/         # CI/CD and agentic workflows
    └── ISSUE_TEMPLATE/    # Structured issue forms
```

## Key Design Principles

These are non-negotiable rules grounded in behavioral science:

1. **Earning > punishment.** The system is ~4:1 earning-to-losing ratio. Always feel mostly positive.
2. **8-point daily deduction cap.** Prevents hopelessness on bad days. Once hit, stop deducting.
3. **Earned points are locked in.** Morning points can never be retroactively removed. Deductions are separate line items.
4. **Bank never resets.** The reward bank carries over week to week. It only changes via deposits and withdrawals.
5. **Weekly total resets every Monday.** Fresh start each week.
6. **Physical activities are protected.** Swimming and rock climbing are never removed regardless of tier.
7. **Bank deposits use gross earned (before deductions).** Good choices always count toward the bank even on rough days.
8. **Bank deposit percentage is configurable.** See `config/settings.yaml` for the `deposit_percent` parameter (default 50%). Formula: `daily_bank_deposit = ceil(daily_gross_earned * deposit_percent / 100)`. Always round up.
9. **Config-driven.** All point values, rewards, and thresholds live in YAML. Never hardcode.
10. **Append-only ledger.** Never delete entries from `bank-log.jsonl`. All bank changes are auditable.

## Bank Skill (`/bank`)

The `/bank` Claude Code skill manages the reward bank via `scripts/bank.sh`. Player data lives in `data/<player>/`.

### Usage
- `/bank` — Show current balance and recent transactions
- `/bank deposit <amount> "<description>"` — Add points to the bank
- `/bank withdraw <amount> "<description>"` — Spend points from the bank
- `/bank set <amount> "<description>"` — Set balance to an exact value (corrections only)

All commands accept an optional `--player <name>` flag. If omitted, uses `default_player` from `config/settings.yaml`.

### Important
- The skill/script records amounts as-given. The deposit calculation (applying `deposit_percent` from settings.yaml, rounding up) is the caller's responsibility.
- Every operation appends to `data/<player>/bank-log.jsonl` and updates `data/<player>/bank.json`.
- After every write, the script replays the full JSONL to verify the balance matches `bank.json`.

## Reward Table Changes

Reward updates are handled via normal pull requests and review. Update `config/rewards.yaml` and the docs together.

## GitHub Actions — Manual Workflows

Manual workflows use `workflow_dispatch` and open PRs:

- `Bank Transaction (Manual)` — Runs `scripts/bank.sh` and opens a PR (optional auto-merge)
- `Weekly Check-In (Manual)` — Computes tier + deposit, writes weekly summary, opens a PR (optional auto-merge)
- `Claim Reward (Manual)` — Withdraws from bank and opens a PR (optional auto-merge)
- `Verify Ledger (Manual)` — Runs ledger verification and tests

Workflow input dropdowns are generated from config via `scripts/generate-workflow-inputs.js`.

## Taskfile and Hooks

Common tasks are available in `Taskfile.yml`. To keep workflow inputs in sync with config locally, enable the pre-commit hook in `.githooks/`.

## Content Conventions

- Parent-facing content uses standard language (points, behaviors, rewards)
- Player-facing content uses game language (XP, quests, damage, levels)
- No PII in any committed file
