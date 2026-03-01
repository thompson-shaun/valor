#!/usr/bin/env bash
set -euo pipefail

# Tests for scripts/vault.sh
# Uses a temp player so real data is never touched.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BANK="$REPO_ROOT/scripts/vault.sh"
TEST_PLAYER="__test_$$"
export BANK_NO_COMMIT=true

PASSED=0
FAILED=0

cleanup() {
  rm -rf "$REPO_ROOT/data/$TEST_PLAYER"
}
trap cleanup EXIT

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$expected" == "$actual" ]]; then
    echo "  PASS: $label"
    PASSED=$((PASSED + 1))
  else
    echo "  FAIL: $label"
    echo "    expected: $expected"
    echo "    actual:   $actual"
    FAILED=$((FAILED + 1))
  fi
}

assert_contains() {
  local label="$1" needle="$2" haystack="$3"
  if [[ "$haystack" == *"$needle"* ]]; then
    echo "  PASS: $label"
    PASSED=$((PASSED + 1))
  else
    echo "  FAIL: $label"
    echo "    expected to contain: $needle"
    echo "    actual: $haystack"
    FAILED=$((FAILED + 1))
  fi
}

assert_exit_code() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$expected" -eq "$actual" ]]; then
    echo "  PASS: $label"
    PASSED=$((PASSED + 1))
  else
    echo "  FAIL: $label"
    echo "    expected exit code: $expected"
    echo "    actual exit code:   $actual"
    FAILED=$((FAILED + 1))
  fi
}

get_balance() {
  node -e "console.log(JSON.parse(require('fs').readFileSync('$REPO_ROOT/data/$TEST_PLAYER/bank.json','utf8')).balance)"
}

log_lines() {
  wc -l < "$REPO_ROOT/data/$TEST_PLAYER/bank-log.jsonl" | tr -d ' '
}

# ---- Tests ----

echo "=== Vault Script Tests (player: $TEST_PLAYER) ==="
echo ""

# --- Fresh state ---
echo "[fresh state]"
output=$("$BANK" --player "$TEST_PLAYER" status)
assert_contains "status shows player name" "$TEST_PLAYER" "$output"
assert_contains "status shows zero balance" "VP Balance: 0 VP" "$output"
assert_contains "status shows no transactions" "No transactions yet" "$output"

output=$("$BANK" --player "$TEST_PLAYER" verify)
assert_contains "verify passes on empty" "PASS" "$output"

# --- Deposit ---
echo ""
echo "[deposit]"
output=$("$BANK" --player "$TEST_PLAYER" deposit 10 "First deposit")
assert_contains "deposit output" "deposit: 10 VP" "$output"
assert_contains "deposit new balance" "New balance: 10 VP" "$output"
assert_contains "deposit integrity" "PASS" "$output"
assert_eq "balance after deposit" "10" "$(get_balance)"
assert_eq "ledger has 1 entry" "1" "$(log_lines)"

# --- Second deposit ---
echo ""
echo "[second deposit]"
output=$("$BANK" --player "$TEST_PLAYER" deposit 5 "Second deposit")
assert_eq "balance after second deposit" "15" "$(get_balance)"
assert_eq "ledger has 2 entries" "2" "$(log_lines)"

# --- Withdraw ---
echo ""
echo "[withdraw]"
output=$("$BANK" --player "$TEST_PLAYER" withdraw 7 "Bought a treat")
assert_contains "withdraw output" "redeem: 7 VP" "$output"
assert_contains "withdraw new balance" "New balance: 8 VP" "$output"
assert_contains "withdraw integrity" "PASS" "$output"
assert_eq "balance after withdraw" "8" "$(get_balance)"
assert_eq "ledger has 3 entries" "3" "$(log_lines)"

# --- Overdraft rejection ---
echo ""
echo "[overdraft]"
output=$("$BANK" --player "$TEST_PLAYER" withdraw 999 "Should fail" 2>&1 || true)
ec=0
"$BANK" --player "$TEST_PLAYER" withdraw 999 "Should fail" 2>/dev/null || ec=$?
assert_exit_code "overdraft exits non-zero" 1 "$ec"
assert_contains "overdraft error message" "insufficient funds" "$output"
assert_eq "balance unchanged after overdraft" "8" "$(get_balance)"
assert_eq "ledger unchanged after overdraft" "3" "$(log_lines)"

# --- Set ---
echo ""
echo "[set]"
output=$("$BANK" --player "$TEST_PLAYER" set 50 "Manual correction")
assert_contains "set output" "New balance: 50 VP" "$output"
assert_contains "set integrity" "PASS" "$output"
assert_eq "balance after set" "50" "$(get_balance)"
assert_eq "ledger has 4 entries" "4" "$(log_lines)"

# --- Set to zero ---
echo ""
echo "[set to zero]"
output=$("$BANK" --player "$TEST_PLAYER" set 0 "Reset bank")
assert_contains "set zero output" "New balance: 0 VP" "$output"
assert_contains "set zero integrity" "PASS" "$output"
assert_eq "balance after set zero" "0" "$(get_balance)"

# Re-set to 50 for the next test
"$BANK" --player "$TEST_PLAYER" set 50 "Restore" >/dev/null

# --- Withdraw to zero ---
echo ""
echo "[withdraw to zero]"
output=$("$BANK" --player "$TEST_PLAYER" withdraw 50 "Spend it all")
assert_eq "balance is zero" "0" "$(get_balance)"
assert_contains "zero balance integrity" "PASS" "$output"

# --- Status with history ---
echo ""
echo "[status with history]"
output=$("$BANK" --player "$TEST_PLAYER" status)
assert_contains "status shows table header" "Type" "$output"
assert_contains "status shows a deposit" "deposit" "$output"
assert_contains "status shows a withdrawal" "withdrawal" "$output"

# --- Invalid inputs ---
echo ""
echo "[invalid inputs]"
ec=0
"$BANK" --player "$TEST_PLAYER" deposit 0 "zero" 2>/dev/null || ec=$?
assert_exit_code "zero amount rejected" 1 "$ec"

ec=0
"$BANK" --player "$TEST_PLAYER" deposit -5 "negative" 2>/dev/null || ec=$?
assert_exit_code "negative amount rejected" 1 "$ec"

ec=0
"$BANK" --player "$TEST_PLAYER" deposit abc "letters" 2>/dev/null || ec=$?
assert_exit_code "non-numeric amount rejected" 1 "$ec"

ec=0
"$BANK" --player "$TEST_PLAYER" bogus 2>/dev/null || ec=$?
assert_exit_code "unknown subcommand rejected" 1 "$ec"

# --- Missing args ---
echo ""
echo "[missing args]"
ec=0
"$BANK" --player "$TEST_PLAYER" deposit 10 2>/dev/null || ec=$?
assert_exit_code "deposit without description rejected" 1 "$ec"

# --- Player isolation ---
echo ""
echo "[player isolation]"
OTHER_PLAYER="__test_other_$$"
trap 'rm -rf "$REPO_ROOT/data/$TEST_PLAYER" "$REPO_ROOT/data/$OTHER_PLAYER"' EXIT
"$BANK" --player "$OTHER_PLAYER" deposit 100 "Other player" >/dev/null
assert_eq "original player balance unchanged" "0" "$(get_balance)"
other_balance=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$REPO_ROOT/data/$OTHER_PLAYER/bank.json','utf8')).balance)")
assert_eq "other player has own balance" "100" "$other_balance"

# --- JSONL entry format ---
echo ""
echo "[JSONL format]"
entry=$(head -1 "$REPO_ROOT/data/$TEST_PLAYER/bank-log.jsonl")
for field in id timestamp type amount balance_after description metadata; do
  assert_contains "entry has $field" "\"$field\"" "$entry"
done

# --- Calc deposit ---
echo ""
echo "[calc-deposit]"
output=$("$BANK" calc-deposit 15)
assert_contains "calc 15 gross" "Vault deposit: 8 VP" "$output"
assert_contains "calc shows rate" "50%" "$output"

output=$("$BANK" calc-deposit 7)
assert_contains "calc 7 gross rounds up" "Vault deposit: 4 VP" "$output"

output=$("$BANK" calc-deposit 0)
assert_contains "calc 0 gross" "Vault deposit: 0 VP" "$output"

output=$("$BANK" calc-deposit 1)
assert_contains "calc 1 gross rounds up" "Vault deposit: 1 VP" "$output"

ec=0
"$BANK" calc-deposit abc 2>/dev/null || ec=$?
assert_exit_code "calc rejects non-numeric" 1 "$ec"

# --- Summary ---
echo ""
echo "========================="
echo "Results: $PASSED passed, $FAILED failed"
echo "========================="

if [[ "$FAILED" -gt 0 ]]; then
  exit 1
fi
