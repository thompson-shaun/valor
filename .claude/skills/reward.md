---
name: reward
description: View and manage the Level Up! reward shop
user_invocable: true
---

# /reward — Reward Shop Management

Manage the Level Up! reward shop. The source of truth is `config/rewards.yaml`.

## Parse the command

The user invokes `/reward [subcommand] [args...]`:

- `/reward` or `/reward list` — Display all rewards as a formatted table
- `/reward add <category> "<name>" <cost> ["description"]` — Add a new reward
- `/reward remove <category> "<name>"` — Remove a reward
- `/reward update <category> "<name>" <cost>` — Change a reward's cost

Categories: `weekday`, `weekend`, `long_term`

## List operation

1. Read `config/rewards.yaml`.
2. Display all rewards grouped by category as a nicely formatted table with name, cost, and whether approval is required.

## Add / Remove / Update operations

1. Read `config/rewards.yaml`.
2. Make the requested change using the Edit tool, preserving the existing YAML structure and style exactly.
3. Read the file again to confirm the edit looks correct.
4. Then update `docs/src/content/docs/rewards/shop.md` to match — read the current shop page, edit the appropriate table to reflect the change, keeping the existing markdown format.
5. Display what changed.

## Rules

- When adding, check that the reward doesn't already exist in the target category.
- When removing or updating, confirm the reward exists before editing.
- Always keep `config/rewards.yaml` and `docs/src/content/docs/rewards/shop.md` in sync.
- New rewards default to `requires_approval: false` unless the user says otherwise.
- Preserve alphabetical or existing ordering within categories — append new entries at the end of their category section.
