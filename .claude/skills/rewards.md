---
name: rewards
description: View and manage the Valor reward list
user_invocable: true
---

# /rewards — Reward List Management

Manage the Valor reward list. The source of truth is `config/rewards.yaml`.

## Parse the command

The user invokes `/rewards [subcommand] [args...]`:

- `/rewards` or `/rewards list` — Display all rewards as a formatted table
- `/rewards redeem "<name>"` — Redeem a reward (withdraw cost from the Vault)
- `/rewards add <category> "<name>" <cost> ["description"]` — Add a new reward
- `/rewards remove <category> "<name>"` — Remove a reward
- `/rewards update <category> "<name>" <cost>` — Change a reward's cost

Categories: `weekday`, `weekend`, `long_term`

## List operation

1. Read `config/rewards.yaml`.
2. Display all rewards grouped by category as a nicely formatted table with name, cost, and whether approval is required.

## Redeem operation

1. Read `config/rewards.yaml`.
2. Find the reward by name (case-insensitive, partial match is fine if unambiguous).
3. If the reward has `requires_approval: true`, warn the user and ask for confirmation before proceeding.
4. Check the current Vault balance by running `scripts/bank.sh status`. If insufficient funds, tell the user and stop.
5. Run the withdrawal: `scripts/bank.sh withdraw <cost> "Claimed: <reward name>"`.
6. Display the result: reward redeemed, amount spent, new balance.

## Add / Remove / Update operations

1. Read `config/rewards.yaml`.
2. Make the requested change using the Edit tool, preserving the existing YAML structure and style exactly.
3. Read the file again to confirm the edit looks correct.
4. Then update `docs/src/content/docs/rewards/shop.md` to match — read the current rewards page, edit the appropriate table to reflect the change, keeping the existing markdown format.
5. Display what changed.

## Rules

- When adding, check that the reward doesn't already exist in the target category.
- When removing or updating, confirm the reward exists before editing.
- Always keep `config/rewards.yaml` and `docs/src/content/docs/rewards/shop.md` in sync.
- New rewards default to `requires_approval: false` unless the user says otherwise.
- Preserve alphabetical or existing ordering within categories — append new entries at the end of their category section.
