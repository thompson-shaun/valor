# Valor

Valor turns daily routines into quests, good choices into VP, and consistency into real rewards. Every good day fills the Vault. Do good. Bank it.

## How It Works

Kids earn Valor Points (VP) throughout the day by completing quests — morning routines, school choices, evening tasks, and bonus challenges. Valor Points flow into two tracks:

- **Valor Standing** — resets every Monday, determines the rank (Legend/Champion/Knight/Recruit) for the following week
- **The Vault** — a persistent, rolling balance of Valor Points used to redeem rewards from the list

The system is designed around a ~4:1 earning-to-losing ratio. Good choices always count, even on rough days.

## Guides

- **[Warden's Guide](docs/src/content/docs/parent/guide.md)** — full rules, point values, implementation details
- **[Hero's Guide](docs/src/content/docs/player/guide.md)** — kid-facing version with game language
- **[The Vault Shop](docs/src/content/docs/rewards/shop.md)** — what VP can buy

## The Vault

Use the `/vault` Claude Code skill or `scripts/vault.sh` directly to manage the Vault:

```
/vault                                    # Show balance and recent transactions
/vault deposit 10 "Daily deposit"         # Add VP
/vault redeem 20 "Bought boba"            # Redeem VP
/vault set 100 "Manual correction"        # Set exact balance
/vault --player kidname deposit 10 "..."  # Specify a player
```

Each player's data lives in `data/<player>/`. The default player is set in `config/settings.yaml`.

## Configuration

All point values, rewards, and settings live in `config/`:

- `behaviors.yaml` — earning choices and dips with point values
- `rewards.yaml` — Vault Shop items, costs, and categories
- `settings.yaml` — Vault deposit percentage, weekly thresholds, rules

## GitHub Workflows

All changes go through pull requests. Issue-driven workflows create a branch, commit changes, and open a PR. A required CI check (`verify`) validates ledger integrity and runs tests before any PR can merge. Workflows only run for the repo owner.

| Trigger | Workflow | What it does | Merge |
|---|---|---|---|
| `workflow_dispatch` | Transactions (Manual) | Runs `vault.sh` deposit/redeem/set and opens a PR | Optional auto-merge |
| `workflow_dispatch` | Weekly Check-In (Manual) | Computes rank + Vault deposit, writes weekly summary, opens a PR | Optional auto-merge |
| `workflow_dispatch` | Claim Reward (Manual) | Redeems a reward and opens a PR | Optional auto-merge |
| `workflow_dispatch` | Verify Ledger (Manual) | Replays ledgers + runs tests | N/A |

The **Verify Ledger** CI workflow runs on every PR to `main`:
1. Replays each player's `bank-log.jsonl` and confirms the running total matches `bank.json`
2. Runs the full `tests/vault_test.sh` suite
3. Verifies workflow inputs match `config/`

Only GitHub-owned (`actions/*`) actions are used — no third-party community actions.

## Development

The docs site uses [Astro Starlight](https://starlight.astro.build/):

```bash
cd docs
npm install
npm run dev
```

### Taskfile

Common tasks use Taskfile:

```bash
task generate:workflow-inputs
task verify
```

### Git Hooks

To enable the pre-commit hook that keeps workflow inputs in sync:

```bash
bash scripts/setup-githooks.sh
```

## License

TBD
