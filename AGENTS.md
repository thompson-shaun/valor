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

Reward updates follow an issue-driven workflow:
1. Open an issue using the "Reward Change" template
2. Label it `reward-update`
3. The GitHub Actions workflow parses the issue and opens a PR updating `config/rewards.yaml` and the docs

## GitHub Actions — Issue Workflows

Issue-driven workflows use two approaches:

**Plain shell** (deterministic, structured input):
- `bank-transaction` — Parses issue form, runs `scripts/bank.sh`, creates PR with auto-merge
- `weekly-checkin` — Parses issue form, computes tier + deposit, creates PR with auto-merge
- `claim-reward` — Parses reward selection, validates cost, withdraws from bank, creates PR with auto-merge

**Claude agent** (requires judgment):
- `reward-update` — Claude interprets the request and edits `config/rewards.yaml` + docs
- `@claude` comments — Ad-hoc requests on any issue or PR

When working on an issue via the Claude agent workflow (label `claude`, assignment, or `@claude` mention), always:
1. Make the required changes and commit them to the branch
2. Push the branch to the remote
3. Create a pull request using `gh pr create` with `Fixes #<issue-number>` in the body so the issue auto-closes on merge

## Content Conventions

- Parent-facing content uses standard language (points, behaviors, rewards)
- Player-facing content uses game language (XP, quests, damage, levels)
- No PII in any committed file
