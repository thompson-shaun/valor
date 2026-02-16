# Quest Mode

A gamified behavior point system that turns daily routines into quests, good choices into XP, and consistency into real rewards.

## How It Works

Kids earn points (XP) throughout the day by completing quests — morning routines, school behavior, evening tasks, and bonus challenges. Points flow into two tracks:

- **Weekly Total** — resets every Monday, determines the privilege tier (Gold/Green/Yellow/Red) for the following week
- **Reward Bank** — a persistent, rolling balance used to buy rewards from the shop

The system is designed around a ~4:1 earning-to-losing ratio. Good choices always count, even on rough days.

## Guides

- **[Parent Guide](docs/src/content/docs/parents/guide.md)** — full rules, point values, implementation details
- **[Player's Guide](docs/src/content/docs/players/guide.md)** — kid-facing version with game language
- **[Reward Shop](docs/src/content/docs/rewards/shop.md)** — what XP can buy

## Bank

Use the `/bank` Claude Code skill or `scripts/bank.sh` directly to manage the reward bank:

```
/bank                                    # Show balance and recent transactions
/bank deposit 10 "Daily deposit"         # Add points
/bank withdraw 20 "Bought boba"          # Spend points
/bank set 100 "Manual correction"        # Set exact balance
/bank --player kidname deposit 10 "..."  # Specify a player
```

Each player's data lives in `data/<player>/`. The default player is set in `config/settings.yaml`. You can also file a **Bank Transaction** issue on GitHub to process transactions via the agentic workflow.

## Configuration

All point values, rewards, and settings live in `config/`:

- `behaviors.yaml` — earning behaviors and deductions with point values
- `rewards.yaml` — reward shop items, costs, and categories
- `settings.yaml` — bank deposit percentage, weekly thresholds, rules

## Proposing Reward Changes

Open an issue using the **Reward Change** template. Label it `reward-update` and the automated workflow will open a PR with the changes.

## Development

The docs site uses [Astro Starlight](https://starlight.astro.build/):

```bash
cd docs
npm install
npm run dev
```

## License

TBD
