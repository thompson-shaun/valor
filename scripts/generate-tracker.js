#!/usr/bin/env node
// Generates a printable weekly tracker XLSX for Quest Mode.
// Output: docs/public/weekly-tracker.xlsx
//
// Usage: node scripts/generate-tracker.js

const ExcelJS = require('exceljs');
const path = require('path');

const OUTPUT = path.resolve(__dirname, '..', 'docs', 'public', 'weekly-tracker.xlsx');

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Colors
const GREEN = { argb: 'FF22C55E' };
const GOLD = { argb: 'FFFBBF24' };
const YELLOW_BG = { argb: 'FFFFFBEB' };
const GREEN_BG = { argb: 'FFF0FFF4' };
const RED_BG = { argb: 'FFFFF5F5' };
const HEADER_BG = { argb: 'FF1A2E1A' };
const HEADER_FG = { argb: 'FFFFFFFF' };
const SECTION_BG = { argb: 'FFE8F5E9' };

function headerFill(color) {
  return { type: 'pattern', pattern: 'solid', fgColor: color };
}

function thinBorder() {
  const side = { style: 'thin', color: { argb: 'FF333333' } };
  return { top: side, bottom: side, left: side, right: side };
}

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Quest Mode';

  // ===== Sheet 1: Weekly Tracker =====
  const ws = wb.addWorksheet('Weekly Tracker', {
    pageSetup: {
      paperSize: 1, // Letter
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: { left: 0.4, right: 0.4, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    },
  });

  // Column widths
  ws.columns = [
    { width: 34 }, // Behavior
    { width: 6 },  // Mon
    { width: 6 },  // Tue
    { width: 6 },  // Wed
    { width: 6 },  // Thu
    { width: 6 },  // Fri
    { width: 6 },  // Sat
    { width: 6 },  // Sun
    { width: 7 },  // Total
  ];

  // --- Title ---
  const titleRow = ws.addRow(['Quest Mode — Weekly Tracker']);
  ws.mergeCells(titleRow.number, 1, titleRow.number, 9);
  titleRow.getCell(1).font = { bold: true, size: 16, color: GREEN };
  titleRow.height = 28;

  // --- Week of ---
  const weekRow = ws.addRow(['Week of: _________________']);
  ws.mergeCells(weekRow.number, 1, weekRow.number, 9);
  weekRow.getCell(1).font = { size: 11 };
  weekRow.height = 20;

  ws.addRow([]); // spacer

  // --- Score Sheet Header ---
  const hdr = ws.addRow(['Behavior', ...DAYS, 'Total']);
  hdr.eachCell((cell) => {
    cell.fill = headerFill(HEADER_BG);
    cell.font = { bold: true, size: 10, color: HEADER_FG };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder();
  });
  hdr.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  hdr.height = 20;

  // --- Behaviors ---
  const behaviors = [
    { section: 'Morning' },
    { name: 'Wake up without drama', pts: '+1' },
    { name: 'Make bed', pts: '+1' },
    { name: 'Get dressed independently', pts: '+1' },
    { name: 'Eat breakfast on time', pts: '+1' },
    { name: 'Ready for school on time', pts: '+1' },
    { section: 'School (Mon–Fri)' },
    { name: 'Clip green (+3) / above green (+5)', pts: '' },
    { name: 'Homework done', pts: '+2' },
    { section: 'Evening' },
    { name: 'Eat dinner on time', pts: '+1' },
    { name: 'Follow instructions first time', pts: '+1' },
    { name: 'Positive attitude', pts: '+1' },
    { name: 'Bedtime routine on time', pts: '+1' },
    { name: 'Reading time', pts: '+1' },
    { section: 'Bonus' },
    { name: '______________________', pts: '' },
    { name: '______________________', pts: '' },
    { section: 'Deductions (max −8/day)' },
    { name: 'Clip yellow (−2) / orange (−4) / red (−6)', pts: '' },
    { name: 'Not listening after 2 asks', pts: '−1' },
    { name: 'Disrespectful language', pts: '−2' },
    { name: '______________________', pts: '' },
  ];

  for (const b of behaviors) {
    if (b.section) {
      const r = ws.addRow([b.section, '', '', '', '', '', '', '', '']);
      r.getCell(1).font = { bold: true, size: 10 };
      r.getCell(1).fill = headerFill(SECTION_BG);
      r.eachCell((cell) => { cell.border = thinBorder(); });
      r.height = 18;
    } else {
      const label = b.pts ? `${b.name} (${b.pts})` : b.name;
      const r = ws.addRow([label, '', '', '', '', '', '', '', '']);
      r.getCell(1).font = { size: 9 };
      r.eachCell((cell, colNumber) => {
        cell.border = thinBorder();
        if (colNumber > 1) cell.alignment = { horizontal: 'center' };
      });
      r.height = 16;
    }
  }

  // --- Daily Total row ---
  const totalRow = ws.addRow(['Daily Total', '', '', '', '', '', '', '', '']);
  totalRow.getCell(1).font = { bold: true, size: 10 };
  totalRow.getCell(1).fill = headerFill(SECTION_BG);
  totalRow.eachCell((cell, colNumber) => {
    cell.border = thinBorder();
    if (colNumber > 1) cell.alignment = { horizontal: 'center' };
  });
  totalRow.height = 20;

  ws.addRow([]); // spacer

  // --- Weekly Summary (compact) ---
  const sumTitle = ws.addRow(['Weekly Summary']);
  ws.mergeCells(sumTitle.number, 1, sumTitle.number, 4);
  sumTitle.getCell(1).font = { bold: true, size: 12, color: GREEN };
  sumTitle.height = 22;

  const summaryItems = [
    ['Weekly Total (sum of daily totals)', ''],
    ['Weekly Level', ''],
    ['Bank Deposit (half of total, round up)', ''],
  ];
  for (const [label, val] of summaryItems) {
    const r = ws.addRow([label, val]);
    ws.mergeCells(r.number, 2, r.number, 3);
    r.getCell(1).font = { bold: true, size: 10 };
    r.getCell(1).border = thinBorder();
    r.getCell(2).border = thinBorder();
    r.getCell(2).alignment = { horizontal: 'center' };
    r.height = 18;
  }

  ws.addRow([]); // spacer
  const balRow = ws.addRow(['Starting Balance: _____ + Deposit _____ − Spent _____ = New Balance _____']);
  ws.mergeCells(balRow.number, 1, balRow.number, 6);
  balRow.getCell(1).font = { size: 10 };

  // ===== Sheet 2: Quick Reference =====
  const qs = wb.addWorksheet('Quick Reference', {
    pageSetup: {
      paperSize: 1,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });

  qs.columns = [
    { width: 30 },
    { width: 12 },
    { width: 30 },
    { width: 12 },
  ];

  // --- Reward Shop ---
  const shopTitle = qs.addRow(['Reward Shop']);
  qs.mergeCells(shopTitle.number, 1, shopTitle.number, 4);
  shopTitle.getCell(1).font = { bold: true, size: 16, color: GREEN };
  shopTitle.height = 28;
  qs.addRow([]);

  // Weekday rewards
  const wdTitle = qs.addRow(['Weekday (Mon–Fri)', 'Cost']);
  wdTitle.getCell(1).font = { bold: true, size: 11, color: HEADER_FG };
  wdTitle.getCell(2).font = { bold: true, size: 11, color: HEADER_FG };
  wdTitle.getCell(1).fill = headerFill(HEADER_BG);
  wdTitle.getCell(2).fill = headerFill(HEADER_BG);
  wdTitle.getCell(1).border = thinBorder();
  wdTitle.getCell(2).border = thinBorder();
  wdTitle.getCell(2).alignment = { horizontal: 'center' };

  const weekdayRewards = [
    ['Extra 30 min screen time', '10 XP'],
    ['Small treat (candy, snack)', '10 XP'],
    ['Stay up 20 min past bedtime', '15 XP'],
  ];
  for (const [name, cost] of weekdayRewards) {
    const r = qs.addRow([name, cost]);
    r.getCell(1).border = thinBorder();
    r.getCell(2).border = thinBorder();
    r.getCell(2).alignment = { horizontal: 'center' };
    r.height = 18;
  }

  qs.addRow([]);

  // Weekend rewards
  const weTitle = qs.addRow(['Weekend (Sat–Sun)', 'Cost']);
  weTitle.getCell(1).font = { bold: true, size: 11, color: HEADER_FG };
  weTitle.getCell(2).font = { bold: true, size: 11, color: HEADER_FG };
  weTitle.getCell(1).fill = headerFill(HEADER_BG);
  weTitle.getCell(2).fill = headerFill(HEADER_BG);
  weTitle.getCell(1).border = thinBorder();
  weTitle.getCell(2).border = thinBorder();
  weTitle.getCell(2).alignment = { horizontal: 'center' };

  const weekendRewards = [
    ['Boba or special drink', '20 XP'],
    ['Pick the family movie', '20 XP'],
    ['Extra 1 hour screen time', '25 XP'],
    ['Pick dinner for the family', '30 XP'],
    ['Stay up 30 min past bedtime', '15 XP'],
    ['Disney trip (3–4 hours)', '40 XP'],
  ];
  for (const [name, cost] of weekendRewards) {
    const r = qs.addRow([name, cost]);
    r.getCell(1).border = thinBorder();
    r.getCell(2).border = thinBorder();
    r.getCell(2).alignment = { horizontal: 'center' };
    r.height = 18;
  }

  qs.addRow([]);

  // Save-up rewards
  const suTitle = qs.addRow(['Save-Up (anytime)', 'Cost']);
  suTitle.getCell(1).font = { bold: true, size: 11, color: HEADER_FG };
  suTitle.getCell(2).font = { bold: true, size: 11, color: HEADER_FG };
  suTitle.getCell(1).fill = headerFill(HEADER_BG);
  suTitle.getCell(2).fill = headerFill(HEADER_BG);
  suTitle.getCell(1).border = thinBorder();
  suTitle.getCell(2).border = thinBorder();
  suTitle.getCell(2).alignment = { horizontal: 'center' };

  const saveUpRewards = [
    ['Small toy or book (under $15)', '50 XP'],
    ['Special outing (1:1 with parent)', '60 XP'],
    ['Big reward (new game, experience)', '100 XP'],
    ['Nintendo Switch 2', '250 XP'],
  ];
  for (const [name, cost] of saveUpRewards) {
    const r = qs.addRow([name, cost]);
    r.getCell(1).border = thinBorder();
    r.getCell(2).border = thinBorder();
    r.getCell(2).alignment = { horizontal: 'center' };
    if (name === 'Nintendo Switch 2') {
      r.getCell(1).font = { bold: true, size: 11 };
      r.getCell(2).font = { bold: true, size: 11 };
      r.getCell(1).fill = headerFill(GOLD);
      r.getCell(2).fill = headerFill(GOLD);
    }
    r.height = 18;
  }

  qs.addRow([]);
  qs.addRow([]);

  // --- Weekly Levels ---
  const lvlTitle = qs.addRow(['Weekly Levels']);
  qs.mergeCells(lvlTitle.number, 1, lvlTitle.number, 4);
  lvlTitle.getCell(1).font = { bold: true, size: 14, color: GREEN };
  lvlTitle.height = 24;

  const lvlHdr = qs.addRow(['Points', 'Level', 'Result']);
  qs.mergeCells(lvlHdr.number, 2, lvlHdr.number, 3);
  for (let i = 1; i <= 3; i++) {
    lvlHdr.getCell(i).font = { bold: true, size: 10, color: HEADER_FG };
    lvlHdr.getCell(i).fill = headerFill(HEADER_BG);
    lvlHdr.getCell(i).border = thinBorder();
    lvlHdr.getCell(i).alignment = { horizontal: 'center' };
  }

  const levels = [
    { pts: '80+', name: 'GOLD', result: 'Full privileges + bonus reward', bg: { argb: 'FFFFFDE7' } },
    { pts: '60–79', name: 'GREEN', result: 'Full privileges', bg: GREEN_BG },
    { pts: '40–59', name: 'YELLOW', result: 'Weekend screens halved', bg: YELLOW_BG },
    { pts: 'Below 40', name: 'RED', result: 'No weekend rec screens', bg: RED_BG },
  ];
  for (const lvl of levels) {
    const r = qs.addRow([lvl.pts, lvl.name, lvl.result]);
    qs.mergeCells(r.number, 2, r.number, 3);
    r.getCell(1).font = { bold: true, size: 10 };
    r.getCell(2).font = { bold: true, size: 10 };
    for (let i = 1; i <= 3; i++) {
      r.getCell(i).border = thinBorder();
      r.getCell(i).fill = headerFill(lvl.bg);
    }
    r.getCell(1).alignment = { horizontal: 'center' };
    r.height = 20;
  }

  qs.addRow([]);
  qs.addRow([]);

  // --- Deductions ---
  const dedTitle = qs.addRow(['Deductions']);
  qs.mergeCells(dedTitle.number, 1, dedTitle.number, 4);
  dedTitle.getCell(1).font = { bold: true, size: 14, color: GREEN };
  dedTitle.height = 24;

  const dedHdr = qs.addRow(['Behavior', 'Damage']);
  dedHdr.getCell(1).font = { bold: true, size: 10, color: HEADER_FG };
  dedHdr.getCell(2).font = { bold: true, size: 10, color: HEADER_FG };
  dedHdr.getCell(1).fill = headerFill(HEADER_BG);
  dedHdr.getCell(2).fill = headerFill(HEADER_BG);
  dedHdr.getCell(1).border = thinBorder();
  dedHdr.getCell(2).border = thinBorder();
  dedHdr.getCell(2).alignment = { horizontal: 'center' };

  const deductionItems = [
    ['Clip yellow / orange / red', '−2 / −4 / −6'],
    ['Not listening after 2 asks', '−1'],
    ['Disrespectful language', '−2'],
  ];
  for (const [behavior, damage] of deductionItems) {
    const r = qs.addRow([behavior, damage]);
    r.getCell(1).border = thinBorder();
    r.getCell(2).border = thinBorder();
    r.getCell(2).alignment = { horizontal: 'center' };
    r.height = 18;
  }

  const dedNote = qs.addRow(['Max −8/day. Earned points are never removed.']);
  qs.mergeCells(dedNote.number, 1, dedNote.number, 4);
  dedNote.getCell(1).font = { italic: true, size: 9 };

  qs.addRow([]);
  const protTitle = qs.addRow(['Protected Activities (always safe)']);
  qs.mergeCells(protTitle.number, 1, protTitle.number, 4);
  protTitle.getCell(1).font = { bold: true, size: 11 };
  qs.addRow(['Swimming (Mon), Rock climbing (Wed, Sat)']);
  qs.mergeCells(qs.lastRow.number, 1, qs.lastRow.number, 4);

  // Write file
  await wb.xlsx.writeFile(OUTPUT);
  console.log(`Generated: ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
