---
name: vault
description: Manage the Vault — deposit, redeem, set balance, or view status
user_invocable: true
---

# /vault — Vault Operations

Manage the Vault. All operations are handled by `scripts/vault.sh`.

## Parse the command

The user invokes `/vault [--player <name>] [subcommand] [amount] ["description"]`. Parse the arguments and run the corresponding script command:

- `/vault` (no args) → `scripts/vault.sh status`
- `/vault deposit <amount> "<description>"` → `scripts/vault.sh deposit <amount> "<description>"`
- `/vault redeem <amount> "<description>"` → `scripts/vault.sh redeem <amount> "<description>"`
- `/vault set <amount> "<description>"` → `scripts/vault.sh set <amount> "<description>"`
- `/vault verify` → `scripts/vault.sh verify`

If the user specifies `--player <name>`, prepend `--player <name>` before the subcommand. If not specified, the script reads `default_player` from `config/settings.yaml`.

## What to do

1. Parse the user's arguments from the `/vault` invocation.
2. Run `scripts/vault.sh` via Bash with the appropriate subcommand and arguments.
3. Display the script output to the user.

The script handles all logic: balance computation, JSONL ledger appending, bank.json updates, and integrity verification. Do not duplicate this logic — just call the script.

If the script exits with an error (non-zero), show the error message to the user.
