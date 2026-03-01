#!/usr/bin/env node
// Verifies generated workflow inputs match config.

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SETTINGS = path.join(REPO_ROOT, 'config', 'settings.yaml');
const REWARDS = path.join(REPO_ROOT, 'config', 'rewards.yaml');

const WORKFLOWS = [
  path.join(REPO_ROOT, '.github', 'workflows', 'transactions-manual.yml'),
  path.join(REPO_ROOT, '.github', 'workflows', 'weekly-checkin-manual.yml'),
  path.join(REPO_ROOT, '.github', 'workflows', 'claim-reward-manual.yml'),
];

function readFile(file) {
  return fs.readFileSync(file, 'utf8');
}

function yamlScalar(text, key) {
  const re = new RegExp(`^\\s*${key}:\\s*(\\S+)\\s*$`, 'm');
  const m = text.match(re);
  return m ? m[1] : null;
}

function yamlListBlock(text, key) {
  const re = new RegExp(`^\\s*${key}:\\s*$`, 'm');
  const m = text.match(re);
  if (!m) return [];
  const start = m.index + m[0].length;
  const lines = text.slice(start).split('\n');
  const items = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    if (!line.startsWith('  - ') && !line.startsWith('\t- ')) break;
    items.push(line.replace(/^\s*-\s*/, '').trim());
  }
  return items;
}

function parsePlayers(settingsText) {
  const players = yamlListBlock(settingsText, 'players');
  const defaultPlayer = yamlScalar(settingsText, 'default_player') || 'default';
  const list = players.length ? players.slice() : [defaultPlayer];
  if (!list.includes(defaultPlayer)) list.unshift(defaultPlayer);
  return Array.from(new Set(list));
}

function parseRewards(rewardsText) {
  const rewards = [];
  let current = null;
  for (const line of rewardsText.split('\n')) {
    const nameMatch = line.match(/^\s*-\s*name:\s*(.+)\s*$/);
    if (nameMatch) {
      current = { name: nameMatch[1].trim(), cost: null };
      rewards.push(current);
      continue;
    }
    const costMatch = line.match(/^\s*cost:\s*(\d+)\s*$/);
    if (costMatch && current && current.cost === null) {
      current.cost = parseInt(costMatch[1], 10);
    }
  }
  return rewards.filter((r) => r.name && Number.isInteger(r.cost));
}

function extractBlock(text, marker) {
  const re = new RegExp(
    `^[ \\t]*# BEGIN GENERATED ${marker}\\s*$([\\s\\S]*?)^[ \\t]*# END GENERATED ${marker}\\s*$`,
    'm'
  );
  const m = text.match(re);
  if (!m) return null;
  return m[1]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- '))
    .map((l) => l.replace(/^- /, '').trim())
    .map((l) => l.replace(/^"(.*)"$/, '$1'));
}

function assertEqualList(label, expected, actual) {
  const exp = expected.slice();
  const act = actual.slice();
  const same =
    exp.length === act.length &&
    exp.every((v, i) => v === act[i]);
  if (!same) {
    console.error(`Mismatch in ${label}`);
    console.error(`Expected: ${JSON.stringify(exp)}`);
    console.error(`Actual:   ${JSON.stringify(act)}`);
    return false;
  }
  return true;
}

function main() {
  const settingsText = readFile(SETTINGS);
  const rewardsText = readFile(REWARDS);

  const players = parsePlayers(settingsText);
  const rewards = parseRewards(rewardsText).map((r) => `${r.name} (${r.cost} VP)`);

  let ok = true;
  for (const workflow of WORKFLOWS) {
    const text = readFile(workflow);
    const playersBlock = extractBlock(text, 'PLAYERS');
    if (!playersBlock) {
      console.error(`Missing PLAYERS block in ${workflow}`);
      ok = false;
      continue;
    }
    if (!assertEqualList(`${path.basename(workflow)} PLAYERS`, players, playersBlock)) ok = false;

    if (workflow.endsWith('claim-reward-manual.yml')) {
      const rewardsBlock = extractBlock(text, 'REWARDS');
      if (!rewardsBlock) {
        console.error(`Missing REWARDS block in ${workflow}`);
        ok = false;
      } else if (!assertEqualList(`${path.basename(workflow)} REWARDS`, rewards, rewardsBlock)) {
        ok = false;
      }
    }
  }

  if (!ok) process.exit(1);
  console.log('Workflow inputs match config.');
}

main();
