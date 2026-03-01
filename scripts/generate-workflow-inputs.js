#!/usr/bin/env node
// Generates workflow input option lists from config.
// Updates .github/workflows/*-manual.yml between markers.

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

function yamlQuote(value) {
  return JSON.stringify(value);
}

function replaceBlock(text, marker, lines) {
  const re = new RegExp(
    `(^[ \\t]*# BEGIN GENERATED ${marker}[\\s\\S]*?^[ \\t]*# END GENERATED ${marker})`,
    'm'
  );
  const match = text.match(re);
  if (!match) {
    throw new Error(`Missing generated block: ${marker}`);
  }
  const block = match[0].split('\n');
  const beginLine = block[0];
  const endLine = block[block.length - 1];
  const indent = beginLine.match(/^(\s*)/)[1];
  const body = lines.map((l) => `${indent}${l}`).join('\n');
  return text.replace(re, `${beginLine}\n${body}\n${endLine}`);
}

function main() {
  const settingsText = readFile(SETTINGS);
  const rewardsText = readFile(REWARDS);

  const players = parsePlayers(settingsText);
  const rewards = parseRewards(rewardsText);
  if (rewards.length === 0) {
    throw new Error('No rewards parsed from config/rewards.yaml');
  }

  const playerLines = players.map((p) => `- ${yamlQuote(p)}`);
  const rewardLines = rewards.map((r) => `- ${yamlQuote(`${r.name} (${r.cost} VP)`)}`);

  for (const workflow of WORKFLOWS) {
    let text = readFile(workflow);
    text = replaceBlock(text, 'PLAYERS', playerLines);
    if (workflow.endsWith('claim-reward-manual.yml')) {
      text = replaceBlock(text, 'REWARDS', rewardLines);
    }
    fs.writeFileSync(workflow, text);
  }

  console.log('Updated workflow inputs from config.');
}

main();
