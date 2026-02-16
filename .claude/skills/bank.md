---
name: bank
description: Manage the Level Up! reward bank — deposit, withdraw, set balance, or view status
user_invocable: true
---

# /bank — Reward Bank Operations

Manage the Level Up! reward bank. All operations are handled by `scripts/bank.sh`.

## Parse the command

The user invokes `/bank [--player <name>] [subcommand] [amount] ["description"]`. Parse the arguments and run the corresponding script command:

- `/bank` (no args) → `scripts/bank.sh status`
- `/bank deposit <amount> "<description>"` → `scripts/bank.sh deposit <amount> "<description>"`
- `/bank withdraw <amount> "<description>"` → `scripts/bank.sh withdraw <amount> "<description>"`
- `/bank set <amount> "<description>"` → `scripts/bank.sh set <amount> "<description>"`
- `/bank verify` → `scripts/bank.sh verify`

If the user specifies `--player <name>`, prepend `--player <name>` before the subcommand. If not specified, the script reads `default_player` from `config/settings.yaml`.

## What to do

1. Parse the user's arguments from the `/bank` invocation.
2. Run `scripts/bank.sh` via Bash with the appropriate subcommand and arguments.
3. Display the script output to the user.

The script handles all logic: balance computation, JSONL ledger appending, bank.json updates, and integrity verification. Do not duplicate this logic — just call the script.

If the script exits with an error (non-zero), show the error message to the user.
