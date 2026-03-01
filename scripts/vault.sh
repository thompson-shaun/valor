#!/usr/bin/env bash
set -euo pipefail

# Valor Vault — transaction script
# Usage:
#   vault.sh [--player <name>] [--no-commit] status
#   vault.sh [--player <name>] [--no-commit] deposit <amount> <description>
#   vault.sh [--player <name>] [--no-commit] redeem <amount> <description>
#   vault.sh [--player <name>] [--no-commit] withdraw <amount> <description>
#   vault.sh [--player <name>] [--no-commit] set <amount> <description>
#   vault.sh [--player <name>] [--no-commit] verify
#   vault.sh calc-deposit <gross_earned>                     Calculate Vault deposit from daily gross
#
# Flags:
#   --no-commit   Skip auto-commit after transactions (env: BANK_NO_COMMIT=true)
#
# Player data lives in data/<player>/. If --player is not given,
# reads default_player from config/settings.yaml.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# --- Parse flags ---
PLAYER=""
NO_COMMIT="${BANK_NO_COMMIT:-false}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --player)
      PLAYER="$2"
      shift 2
      ;;
    --no-commit)
      NO_COMMIT=true
      shift
      ;;
    *)
      break
      ;;
  esac
done

# Resolve player name: flag > env > settings.yaml default
if [[ -z "$PLAYER" ]]; then
  PLAYER="${BANK_PLAYER:-}"
fi
if [[ -z "$PLAYER" ]]; then
  SETTINGS_FILE="$REPO_ROOT/config/settings.yaml"
  if [[ -f "$SETTINGS_FILE" ]]; then
    PLAYER=$(node -e "
      const fs = require('fs');
      const text = fs.readFileSync('$SETTINGS_FILE','utf8');
      const m = text.match(/default_player:\s*(\S+)/);
      console.log(m ? m[1] : 'default');
    ")
  else
    PLAYER="default"
  fi
fi

DATA_DIR="$REPO_ROOT/data/$PLAYER"
BANK_FILE="$DATA_DIR/bank.json"
LOG_FILE="$DATA_DIR/bank-log.jsonl"

# Ensure data files exist
mkdir -p "$DATA_DIR"
if [[ ! -f "$BANK_FILE" ]]; then
  echo '{"balance":0,"last_updated":null,"last_entry_id":null}' > "$BANK_FILE"
fi
if [[ ! -f "$LOG_FILE" ]]; then
  touch "$LOG_FILE"
fi

get_balance() {
  node -e "console.log(JSON.parse(require('fs').readFileSync('$BANK_FILE','utf8')).balance)"
}

generate_uuid() {
  node -e "console.log(require('crypto').randomUUID())"
}

iso_now() {
  node -e "console.log(new Date().toISOString())"
}

cmd_status() {
  local balance
  balance=$(get_balance)
  echo "Player: $PLAYER"
  echo "VP Balance: $balance VP"
  echo ""

  local line_count
  line_count=$(wc -l < "$LOG_FILE" | tr -d ' ')
  if [[ "$line_count" -eq 0 ]]; then
    echo "No transactions yet."
    return
  fi

  echo "Recent transactions:"
  echo "---"
  tail -n 10 "$LOG_FILE" | node -e "
    const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\n');
    console.log('Date                     | Type       | Amount | Balance | Description');
    console.log('-------------------------|------------|--------|---------|------------');
    for (const line of lines) {
      const e = JSON.parse(line);
      const d = e.timestamp.slice(0,19).replace('T',' ');
      const t = e.type.padEnd(10);
      const a = (e.type === 'withdrawal' ? '-' : '+') + String(e.amount).padStart(4);
      const b = String(e.balance_after).padStart(7);
      console.log(d + ' | ' + t + ' | ' + a + ' | ' + b + ' | ' + e.description);
    }
  "
}

cmd_verify() {
  local line_count
  line_count=$(wc -l < "$LOG_FILE" | tr -d ' ')
  if [[ "$line_count" -eq 0 ]]; then
    local balance
    balance=$(get_balance)
    if [[ "$balance" -eq 0 ]]; then
      echo "Integrity check: PASS (empty ledger, zero balance)"
      return 0
    else
      echo "Integrity check: FAIL (empty ledger but balance is $balance)"
      return 1
    fi
  fi

  local result
  result=$(node -e "
    const fs = require('fs');
    const lines = fs.readFileSync('$LOG_FILE','utf8').trim().split('\n');
    let running = 0;
    for (const line of lines) {
      const e = JSON.parse(line);
      if (e.type === 'deposit') running += e.amount;
      else if (e.type === 'withdrawal') running -= e.amount;
      else if (e.type === 'set') running = e.balance_after;
    }
    const bank = JSON.parse(fs.readFileSync('$BANK_FILE','utf8'));
    if (running === bank.balance) {
      console.log('PASS|' + running);
    } else {
      console.log('FAIL|ledger=' + running + ',bank.json=' + bank.balance);
    }
  ")

  local status="${result%%|*}"
  local detail="${result#*|}"

  if [[ "$status" == "PASS" ]]; then
    echo "Integrity check: PASS (balance: $detail)"
    return 0
  else
    echo "Integrity check: FAIL ($detail)"
    return 1
  fi
}

cmd_transact() {
  local type="$1"
  local amount="$2"
  local description="$3"

  # Validate amount is a non-negative integer (0 only valid for set)
  if ! [[ "$amount" =~ ^[0-9]+$ ]]; then
    echo "Error: amount must be a non-negative integer" >&2
    exit 1
  fi
  if [[ "$amount" -eq 0 && "$type" != "set" ]]; then
    echo "Error: amount must be a positive integer" >&2
    exit 1
  fi

  local balance
  balance=$(get_balance)
  local new_balance

  case "$type" in
    deposit)
      new_balance=$((balance + amount))
      ;;
    withdrawal)
      if [[ "$amount" -gt "$balance" ]]; then
        echo "Error: insufficient funds (balance: $balance, requested: $amount)" >&2
        exit 1
      fi
      new_balance=$((balance - amount))
      ;;
    set)
      new_balance=$amount
      ;;
    *)
      echo "Error: unknown transaction type: $type" >&2
      exit 1
      ;;
  esac

  local uuid ts
  uuid=$(generate_uuid)
  ts=$(iso_now)

  # Append to ledger
  node -e "
    const entry = {
      id: '$uuid',
      timestamp: '$ts',
      type: '$type',
      amount: $amount,
      balance_after: $new_balance,
      description: $(node -e "console.log(JSON.stringify('$description'))"),
      metadata: {}
    };
    require('fs').appendFileSync('$LOG_FILE', JSON.stringify(entry) + '\n');
  "

  # Update bank.json
  node -e "
    const bank = {
      balance: $new_balance,
      last_updated: '$ts',
      last_entry_id: '$uuid'
    };
    require('fs').writeFileSync('$BANK_FILE', JSON.stringify(bank, null, 2) + '\n');
  "

  local action_label="$type"
  if [[ "$type" == "withdrawal" ]]; then
    action_label="redeem"
  fi
  echo "$action_label: $amount VP"
  echo "New balance: $new_balance VP"
  echo ""
  cmd_verify

  # Auto-commit unless --no-commit or BANK_NO_COMMIT=true
  if [[ "$NO_COMMIT" != "true" ]]; then
    if git -C "$REPO_ROOT" rev-parse --git-dir >/dev/null 2>&1; then
      git -C "$REPO_ROOT" add "$DATA_DIR"
      git -C "$REPO_ROOT" commit -m "$action_label: $amount VP — $description"
    fi
  fi
}

cmd_calc_deposit() {
  local gross="$1"

  if ! [[ "$gross" =~ ^[0-9]+$ ]]; then
    echo "Error: gross_earned must be a non-negative integer" >&2
    exit 1
  fi

  if [[ "$gross" -eq 0 ]]; then
    echo "Daily gross earned: 0 VP"
    echo "Vault deposit: 0 VP"
    return
  fi

  local percent
  percent=$(node -e "
    const fs = require('fs');
    const text = fs.readFileSync('$REPO_ROOT/config/settings.yaml','utf8');
    const m = text.match(/deposit_percent:\s*(\d+)/);
    console.log(m ? m[1] : '50');
  ")

  local deposit
  deposit=$(node -e "console.log(Math.ceil($gross * $percent / 100))")

  echo "Daily gross earned: $gross VP"
  echo "Deposit rate: $percent%"
  echo "Vault deposit: $deposit VP (rounded up)"
}

# --- Main ---
subcommand="${1:-status}"

case "$subcommand" in
  status)
    cmd_status
    ;;
  verify)
    cmd_verify
    ;;
  deposit|withdrawal|withdraw|redeem|set)
    if [[ "$subcommand" == "withdraw" || "$subcommand" == "redeem" ]]; then
      subcommand="withdrawal"
    fi
    if [[ $# -lt 3 ]]; then
      echo "Usage: vault.sh $subcommand <amount> <description>" >&2
      exit 1
    fi
    cmd_transact "$subcommand" "$2" "$3"
    ;;
  calc-deposit)
    if [[ $# -lt 2 ]]; then
      echo "Usage: vault.sh calc-deposit <gross_earned>" >&2
      exit 1
    fi
    cmd_calc_deposit "$2"
    ;;
  *)
    echo "Usage: vault.sh [--player <name>] {status|deposit|redeem|withdraw|set|verify|calc-deposit} [args]" >&2
    exit 1
    ;;
esac
