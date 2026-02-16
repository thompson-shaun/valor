---
name: checkin
description: Record a weekly check-in — enter the week's total, get the tier, and deposit to the bank
user_invocable: true
---

# /checkin — Weekly Check-In

Record a week's total points, determine the tier, and deposit to the reward bank.

## Parse the command

`/checkin [--player <name>] <weekly_total> ["notes"]`

Examples:
- `/checkin 75` — record 75 points for the default player
- `/checkin --player finn 82 "Great week, gold!"
- `/checkin` — prompt for the total

If `--player` is not specified, read `default_player` from `config/settings.yaml`.

## Flow

1. **Get the weekly total.** If not provided inline, ask for it.

2. **Determine the week.** Default to the most recent completed week (last Monday's date). If a summary already exists for that week in `data/<player>/weeks/`, warn and confirm before overwriting.

3. **Compute tier.** Read thresholds from `config/settings.yaml`:
   - 80+: Gold
   - 60–79: Green
   - 40–59: Yellow
   - Below 40: Red

4. **Compute bank deposit.** Run `scripts/bank.sh calc-deposit <weekly_total>` to get the deposit amount using the configured `deposit_percent`.

5. **Deposit to bank.** Run `scripts/bank.sh [--player <name>] deposit <amount> "Week of <monday-date>"`.

6. **Store weekly summary.** Write `data/<player>/weeks/<monday-date>.json`:
   ```json
   {
     "week_of": "2026-02-09",
     "recorded_at": "<ISO8601>",
     "weekly_total": 75,
     "tier": "green",
     "bank_deposit": 38,
     "notes": ""
   }
   ```

7. **Display results:**
   - Tier (be encouraging)
   - Bank deposit and new balance
   - Comparison to previous week if one exists

## Tone

Be encouraging. Celebrate wins. On tough weeks, note the fresh start Monday brings.
