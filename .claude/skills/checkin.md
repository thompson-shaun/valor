---
name: checkin
description: Record a weekly check-in — enter the week's valor standing, get the rank, and deposit to the Vault
user_invocable: true
---

# /checkin — Weekly Check-In

Record a week's total valor, determine the rank, and deposit to the Vault.

## Parse the command

`/checkin [--player <name>] <weekly_total> ["notes"]`

Examples:
- `/checkin 75` — record 75 valor for the default player
- `/checkin --player finn 82 "Great week, Legend!"`
- `/checkin` — prompt for the total

If `--player` is not specified, read `default_player` from `config/settings.yaml`.

## Flow

1. **Get the weekly total.** If not provided inline, ask for it.

2. **Determine the week.** Default to the most recent completed week (last Monday's date). If a summary already exists for that week in `data/<player>/weeks/`, warn and confirm before overwriting.

3. **Compute rank.** Read thresholds from `config/settings.yaml`:
   - 80+: Legend
   - 60–79: Champion
   - 40–59: Knight
   - Below 40: Recruit

4. **Compute Vault deposit.** Run `scripts/bank.sh calc-deposit <weekly_total>` to get the deposit amount using the configured `deposit_percent`.

5. **Deposit to the Vault.** Run `scripts/bank.sh [--player <name>] deposit <amount> "Week of <monday-date>"`.

6. **Store weekly summary.** Write `data/<player>/weeks/<monday-date>.json`:
   ```json
   {
     "week_of": "2026-02-09",
     "recorded_at": "<ISO8601>",
     "weekly_total": 75,
     "tier": "green",
     "tier_name": "Champion",
     "bank_deposit": 38,
     "notes": ""
   }
   ```

7. **Display results:**
   - Rank (be encouraging)
   - Vault deposit and new balance
   - Comparison to previous week if one exists

## Tone

Be encouraging. Celebrate wins. On tough weeks, note the fresh start Monday brings.
