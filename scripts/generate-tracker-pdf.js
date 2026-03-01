#!/usr/bin/env node
// Generates a printable weekly tracker PDF for Quest Mode.
// Page 1 (landscape): Score sheet + weekly summary
// Page 2 (landscape): Reward shop + weekly levels (quick reference)
//
// Uses PDFKit directly.
// Output: docs/public/weekly-tracker.pdf
// Usage: node scripts/generate-tracker-pdf.js

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUTPUT = path.resolve(__dirname, '..', 'docs', 'public', 'weekly-tracker.pdf');

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DARK_GREEN = [26, 46, 26];
const GREEN = [34, 197, 94];
const SECTION_BG = [232, 245, 233];
const GOLD_BG = [255, 253, 231];
const GREEN_BG = [240, 255, 244];
const YELLOW_BG = [255, 251, 235];
const RED_BG = [255, 245, 245];

function drawCell(doc, x, y, w, h, { fill, border = true } = {}) {
  if (fill) {
    doc.save().rect(x, y, w, h).fill(fill).restore();
  }
  if (border) {
    doc.save().lineWidth(0.5).strokeColor('#555555').rect(x, y, w, h).stroke().restore();
  }
}

function cellText(doc, text, x, y, w, h, { font = 'Helvetica', size = 8, color = '#000000', align = 'left', padX = 3 } = {}) {
  doc.save().font(font).fontSize(size).fillColor(color);
  const textY = y + (h - size) / 2;
  doc.text(text, x + padX, textY, { width: w - padX * 2, align, lineBreak: false });
  doc.restore();
}

function drawRow(doc, x, y, widths, height, cells) {
  let cx = x;
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const w = widths[i];
    drawCell(doc, cx, y, w, height, { fill: cell.fill, border: cell.border !== false });
    if (cell.text !== undefined) {
      cellText(doc, String(cell.text), cx, y, w, height, {
        font: cell.bold ? 'Helvetica-Bold' : 'Helvetica',
        size: cell.size || 8,
        color: cell.color || '#000000',
        align: cell.align || 'left',
      });
    }
    cx += w;
  }
  return y + height;
}

function headerCell(text) {
  return { text, fill: DARK_GREEN, color: '#ffffff', bold: true, align: 'center' };
}

function sectionCell(text, count) {
  const cells = [{ text, fill: SECTION_BG, bold: true }];
  for (let i = 1; i < count; i++) cells.push({ text: '', fill: SECTION_BG });
  return cells;
}

function behaviorRow(label) {
  const cells = [{ text: label }];
  for (let i = 0; i < 8; i++) cells.push({ text: '' });
  return cells;
}

function buildPage1(doc) {
  const LEFT = 30;
  let y = 30;

  // Title
  doc.save().font('Helvetica-Bold').fontSize(18).fillColor(GREEN).text('Quest Mode — Weekly Tracker', LEFT, y).restore();
  y += 26;

  doc.save().font('Helvetica').fontSize(11).fillColor('#000000').text('Week of: _______________________', LEFT, y).restore();
  y += 20;

  // Score table
  const colWidths = [195, 42, 42, 42, 42, 42, 42, 42, 50];
  const ROW_H = 16;

  const headerCells = [
    { ...headerCell('Behavior'), align: 'left' },
    ...DAYS.map(d => headerCell(d)),
    headerCell('Total'),
  ];
  y = drawRow(doc, LEFT, y, colWidths, ROW_H, headerCells);

  const rows = [
    sectionCell('Morning', 9),
    behaviorRow('Wake up without drama (+1)'),
    behaviorRow('Make bed (+1)'),
    behaviorRow('Get dressed independently (+1)'),
    behaviorRow('Eat breakfast on time (+1)'),
    behaviorRow('Ready for school on time (+1)'),
    sectionCell('School (Mon–Fri)', 9),
    behaviorRow('Clip green (+3) / above green (+5)'),
    behaviorRow('Homework done (+2)'),
    sectionCell('Evening', 9),
    behaviorRow('Eat dinner on time (+1)'),
    behaviorRow('Follow instructions first time (+1)'),
    behaviorRow('Positive attitude (+1)'),
    behaviorRow('Bedtime routine on time (+1)'),
    behaviorRow('Reading time (+1)'),
    sectionCell('Bonus', 9),
    behaviorRow('______________________'),
    behaviorRow('______________________'),
    sectionCell('Deductions (max -8/day)', 9),
    behaviorRow('Clip yellow (-2) / orange (-4) / red (-6)'),
    behaviorRow('Not listening after 2 asks (-1)'),
    behaviorRow('Disrespectful language (-2)'),
    behaviorRow('______________________'),
    [{ text: 'Daily Total', fill: SECTION_BG, bold: true }, ...Array(8).fill({ text: '', fill: SECTION_BG })],
  ];

  for (const row of rows) {
    y = drawRow(doc, LEFT, y, colWidths, ROW_H, row);
  }

}

function buildPage2(doc) {
  const LEFT = 30;
  const MID = 370;
  let yL = 30;
  let yR = 30;
  const ROW_H = 16;

  // === LEFT COLUMN: Weekly Levels ===
  doc.save().font('Helvetica-Bold').fontSize(12).fillColor(GREEN).text('Weekly Levels', LEFT, yL).restore();
  yL += 18;

  const lvlWidths = [60, 250];
  yL = drawRow(doc, LEFT, yL, lvlWidths, ROW_H, [headerCell('Points'), headerCell('Level')]);

  const levels = [
    { pts: '80+', desc: 'Gold — full privileges + bonus reward', bg: GOLD_BG },
    { pts: '60–79', desc: 'Green — full privileges', bg: GREEN_BG },
    { pts: '40–59', desc: 'Yellow — weekend screens halved', bg: YELLOW_BG },
    { pts: 'Below 40', desc: 'Red — no weekend rec screens', bg: RED_BG },
  ];
  for (const lvl of levels) {
    yL = drawRow(doc, LEFT, yL, lvlWidths, 18, [
      { text: lvl.pts, bold: true, size: 9, fill: lvl.bg },
      { text: lvl.desc, size: 9, fill: lvl.bg },
    ]);
  }

  // === LEFT COLUMN: Weekly Summary ===
  yL += 16;
  doc.save().font('Helvetica-Bold').fontSize(12).fillColor(GREEN).text('Weekly Summary', LEFT, yL).restore();
  yL += 18;

  const sumWidths = [250, 80];
  yL = drawRow(doc, LEFT, yL, sumWidths, ROW_H, [headerCell(''), headerCell('Value')]);
  const summaryItems = [
    'Weekly Total (sum of daily totals)',
    'Weekly Level',
    'Bank Deposit (half of total, round up)',
  ];
  for (const label of summaryItems) {
    yL = drawRow(doc, LEFT, yL, sumWidths, 18, [
      { text: label, bold: true, size: 9 },
      { text: '' },
    ]);
  }

  yL += 6;
  doc.save().font('Helvetica').fontSize(9).fillColor('#000000')
    .text('Starting Balance: _____ + Deposit _____ - Spent _____ = New Balance _____', LEFT, yL)
    .restore();

  yL += 16;
  doc.save().font('Helvetica-Oblique').fontSize(8).fillColor('#000000')
    .text('Protected: Swimming (Mon), Rock climbing (Wed, Sat)', LEFT, yL)
    .restore();

  // === RIGHT COLUMN: Reward Shop ===
  doc.save().font('Helvetica-Bold').fontSize(12).fillColor(GREEN).text('Reward Shop', MID, yR).restore();
  yR += 18;

  const rewWidths = [260, 60];
  yR = drawRow(doc, MID, yR, rewWidths, ROW_H, [headerCell('Reward'), headerCell('Cost')]);

  function rewardSectionHeader(title) {
    return [
      { text: title, fill: DARK_GREEN, color: '#ffffff', bold: true, size: 9 },
      { text: '', fill: DARK_GREEN },
    ];
  }

  function rewardRow(name, cost, opts = {}) {
    return [
      { text: name, size: 9, bold: opts.bold || false, fill: opts.fill },
      { text: cost, size: 9, align: 'center', bold: opts.bold || false, fill: opts.fill },
    ];
  }

  const rewardRows = [
    rewardSectionHeader('Weekday (Mon–Fri)'),
    rewardRow('Extra 30 min screen time', '10 XP'),
    rewardRow('Small treat (candy, snack)', '10 XP'),
    rewardRow('Stay up 20 min past bedtime', '15 XP'),
    rewardSectionHeader('Weekend (Sat–Sun)'),
    rewardRow('Boba or special drink', '20 XP'),
    rewardRow('Pick the family movie', '20 XP'),
    rewardRow('Extra 1 hour screen time', '25 XP'),
    rewardRow('Pick dinner for the family', '30 XP'),
    rewardRow('Stay up 30 min past bedtime', '15 XP'),
    rewardRow('Disney trip (3–4 hours)', '40 XP'),
    rewardSectionHeader('Save-Up (anytime)'),
    rewardRow('Small toy or book', '50 XP'),
    rewardRow('Special outing (1:1 with parent)', '60 XP'),
    rewardRow('Big reward (new game, experience)', '100 XP'),
    rewardRow('Nintendo Switch 2', '250 XP', { bold: true, fill: GOLD_BG }),
  ];

  for (const row of rewardRows) {
    yR = drawRow(doc, MID, yR, rewWidths, ROW_H, row);
  }
}

// --- Generate PDF ---
const doc = new PDFDocument({
  size: 'LETTER',
  layout: 'landscape',
  margins: { top: 30, bottom: 30, left: 30, right: 30 },
});

doc.pipe(fs.createWriteStream(OUTPUT));

buildPage1(doc);
doc.addPage({ size: 'LETTER', layout: 'landscape', margins: { top: 30, bottom: 30, left: 30, right: 30 } });
buildPage2(doc);

doc.end();
console.log(`Generated: ${OUTPUT}`);
