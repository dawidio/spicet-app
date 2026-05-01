import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CATEGORIES_ORDER, CATEGORY_CONFIG } from '../data/prompts';
import { AP_WORLD_UNITS } from '../data/units';

const COLORS = {
  social: [239, 68, 68],
  political: [59, 130, 246],
  interactions: [16, 185, 129],
  cultural: [139, 92, 246],
  economic: [245, 158, 11],
  technological: [99, 102, 241],
};

const PRIMARY = [30, 64, 175];

/**
 * Export a single SPICE-T chart as PDF
 */
export function exportChartPDF(chart, profile) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header
  drawHeader(doc, pageWidth, margin, profile);

  // Chart title block
  let y = 38;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(chart.empireName || 'Untitled Chart', margin, y);

  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  const unit = AP_WORLD_UNITS.find((u) => u.number === chart.unitNumber);
  const meta = [
    chart.region,
    chart.dateRange,
    unit ? `Unit ${unit.number}: ${unit.name}` : null,
  ]
    .filter(Boolean)
    .join('  |  ');
  doc.text(meta, margin, y);

  y += 8;

  // Draw line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Each SPICE-T category as a table
  for (const catKey of CATEGORIES_ORDER) {
    const config = CATEGORY_CONFIG[catKey];
    const entries = chart.categories?.[catKey]?.entries || [];
    const filledEntries = entries.filter((e) => e.claim.trim());

    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    // Category label
    const color = COLORS[catKey];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 7, 1, 1, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(config.label.toUpperCase(), margin + 3, y + 5);
    y += 10;

    if (filledEntries.length === 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(156, 163, 175);
      doc.text('No entries', margin + 3, y + 4);
      y += 10;
    } else {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Claim / Information', 'Evidence', 'Citation']],
        body: filledEntries.map((e) => [
          e.claim,
          e.evidence || '—',
          e.citation || '—',
        ]),
        headStyles: {
          fillColor: [color[0], color[1], color[2]],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [51, 65, 85],
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 65 },
          2: { cellWidth: 30 },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        theme: 'grid',
        styles: {
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
          overflow: 'linebreak',
        },
      });
      y = doc.lastAutoTable.finalY + 6;
    }
  }

  // Study prompt block
  if (y > 230) {
    doc.addPage();
    y = 20;
  }
  y += 4;
  drawPromptBlock(doc, chart, null, pageWidth, margin, y);

  // Footer
  addFooter(doc);

  doc.save(`SPICET_${sanitizeFilename(chart.empireName || 'chart')}.pdf`);
}

/**
 * Export a comparison as PDF
 */
export function exportComparisonPDF(charts, comparison, profile) {
  // Use landscape for side-by-side
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  // Header
  drawHeader(doc, pageWidth, margin, profile);

  let y = 38;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  const title = `Comparison: ${charts.map((c) => c.empireName || 'Untitled').join(' vs. ')}`;
  doc.text(title, margin, y);
  y += 10;

  // Chart summary row
  const colWidth = (pageWidth - margin * 2) / charts.length;
  charts.forEach((chart, i) => {
    const x = margin + i * colWidth;
    const color = [
      [59, 130, 246],
      [16, 185, 129],
      [245, 158, 11],
      [139, 92, 246],
    ][i];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y, colWidth - 4, 12, 1, 1, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(chart.empireName || 'Untitled', x + 3, y + 5);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const sub = [chart.region, chart.dateRange, chart.unitNumber ? `Unit ${chart.unitNumber}` : null]
      .filter(Boolean)
      .join(' | ');
    doc.text(sub, x + 3, y + 9.5);
  });
  y += 16;

  // Categories
  for (const catKey of CATEGORIES_ORDER) {
    const config = CATEGORY_CONFIG[catKey];
    const color = COLORS[catKey];

    if (y > 170) {
      doc.addPage();
      y = 15;
    }

    // Category header
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 6, 1, 1, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(config.label.toUpperCase(), margin + 3, y + 4.2);
    y += 8;

    // Side-by-side entries
    let maxY = y;
    charts.forEach((chart, i) => {
      const x = margin + i * colWidth;
      const entries = chart.categories?.[catKey]?.entries || [];
      const filled = entries.filter((e) => e.claim.trim());
      let cellY = y;

      if (filled.length === 0) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(156, 163, 175);
        doc.text('No entries', x + 2, cellY + 4);
        cellY += 8;
      } else {
        filled.forEach((entry) => {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(51, 65, 85);
          const claimLines = doc.splitTextToSize(entry.claim, colWidth - 8);
          doc.text(claimLines, x + 2, cellY + 4);
          cellY += claimLines.length * 3.5;

          if (entry.evidence) {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            const evLines = doc.splitTextToSize(entry.evidence, colWidth - 8);
            doc.text(evLines, x + 2, cellY + 3);
            cellY += evLines.length * 3 + 1;
          }

          if (entry.citation) {
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(156, 163, 175);
            doc.text(entry.citation, x + 2, cellY + 3);
            cellY += 5;
          }
          cellY += 2;
        });
      }
      maxY = Math.max(maxY, cellY);
    });

    y = maxY + 2;

    // Annotations for this category
    const ann = comparison?.annotations?.[catKey];
    if (ann && (ann.similarities?.trim() || ann.differences?.trim() || ann.ccot?.trim())) {
      if (y > 170) {
        doc.addPage();
        y = 15;
      }

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 5, 0.5, 0.5, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('YOUR ANALYSIS', margin + 3, y + 3.5);
      y += 7;

      const annFields = [
        { label: 'Similarities', value: ann.similarities, labelColor: [16, 185, 129] },
        { label: 'Differences', value: ann.differences, labelColor: [245, 158, 11] },
        { label: 'CCOT', value: ann.ccot, labelColor: [59, 130, 246] },
      ];

      for (const field of annFields) {
        if (field.value?.trim()) {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(field.labelColor[0], field.labelColor[1], field.labelColor[2]);
          doc.text(`${field.label}:`, margin + 3, y + 3);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          const lines = doc.splitTextToSize(field.value, pageWidth - margin * 2 - 30);
          doc.text(lines, margin + 28, y + 3);
          y += Math.max(lines.length * 3.2, 5) + 1;
        }
      }
      y += 3;
    }

    y += 3;
  }

  // Study prompt block
  if (y > 155) {
    doc.addPage();
    y = 15;
  }
  drawPromptBlock(doc, null, charts, pageWidth, margin, y);

  addFooter(doc);

  const names = charts.map((c) => sanitizeFilename(c.empireName || 'chart')).join('_vs_');
  doc.save(`SPICET_Compare_${names}.pdf`);
}

// ── Helpers ──────────────────────────────────────────────────────

function drawHeader(doc, pageWidth, margin, profile) {
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SPICE-T Chart', margin, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('AP World History: Modern', margin, 18);

  if (profile?.name) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(profile.name, pageWidth - margin, 12, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(profile.classPeriod || '', pageWidth - margin, 18, { align: 'right' });
  }

  doc.setFontSize(7);
  doc.text(
    `Generated ${new Date().toLocaleDateString()}`,
    pageWidth - margin,
    24,
    { align: 'right' }
  );
}

function drawPromptBlock(doc, singleChart, multiCharts, pageWidth, margin, y) {
  doc.setFillColor(239, 246, 255);
  const blockHeight = 30;
  doc.roundedRect(margin, y, pageWidth - margin * 2, blockHeight, 2, 2, 'F');
  doc.setDrawColor(191, 219, 254);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, pageWidth - margin * 2, blockHeight, 2, 2, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('AI Study Prompt', margin + 4, y + 6);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  let prompt;
  if (singleChart) {
    prompt = `Using my SPICE-T chart for the ${singleChart.empireName || 'this empire'}${singleChart.dateRange ? ` (${singleChart.dateRange})` : ''}, help me: 1) Identify the most important connections between the SPICE-T categories. 2) Suggest what I should compare this empire/region to and why. 3) Ask me 3 Socratic questions that would deepen my understanding.`;
  } else if (multiCharts) {
    const names = multiCharts.map((c) => c.empireName || 'Untitled').join(', ');
    prompt = `Using my SPICE-T comparison of ${names}, help me: 1) Identify the strongest similarities and most significant differences across these societies. 2) Trace one change and one continuity over time across these charts. 3) Explain how developments in one society may have caused or influenced developments in another.`;
  }

  if (prompt) {
    const lines = doc.splitTextToSize(prompt, pageWidth - margin * 2 - 8);
    doc.text(lines, margin + 4, y + 12);
  }

  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Copy this prompt and paste into an AI tool for extended study help.',
    margin + 4,
    y + blockHeight - 3
  );
}

function addFooter(doc) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    doc.text(
      `SPICE-T Charts — AP World History: Modern  |  Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
  }
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
}
