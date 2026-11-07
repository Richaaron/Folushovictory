import PDFDocument from "pdfkit";

const PAGE_MARGIN = 40;
const ROW_HEIGHT = 20;
const HEADER_HEIGHT = 22;

const FONT = "Helvetica";
const FONT_BOLD = "Helvetica-Bold";

const BRAND_GREEN = "#0B6E4F";
const TEXT_DARK = "#0f172a";
const TEXT_MUTED = "#64748b";
const BORDER = "#e2e8f0";
const HEADER_FILL = "#f1f5f9";

function drawGroupTitle(doc, group, continued, left, width) {
  doc.font(FONT_BOLD).fontSize(16).fillColor(BRAND_GREEN)
    .text("Folusho Victory Schools", left, PAGE_MARGIN, { width });
  doc.font(FONT).fontSize(9).fillColor(TEXT_MUTED)
    .text(continued ? "Student Login PINs (continued)" : "Student Login PINs", left, PAGE_MARGIN + 20, { width });
  doc.font(FONT_BOLD).fontSize(13).fillColor(TEXT_DARK)
    .text(group.classLabel || "Unassigned", left, PAGE_MARGIN + 38, { width });
  const count = group.students.length;
  doc.font(FONT).fontSize(9).fillColor(TEXT_MUTED)
    .text(`${count} student${count === 1 ? "" : "s"}`, left, PAGE_MARGIN + 56, { width });
  return PAGE_MARGIN + 78;
}

function drawRow(doc, cells, widths, left, y, isHeader) {
  const height = isHeader ? HEADER_HEIGHT : ROW_HEIGHT;
  const tableWidth = widths.reduce((sum, value) => sum + value, 0);

  if (isHeader) {
    doc.rect(left, y, tableWidth, height).fill(HEADER_FILL);
  }

  doc.font(isHeader ? FONT_BOLD : FONT)
    .fontSize(isHeader ? 9 : 10)
    .fillColor(isHeader ? "#475569" : TEXT_DARK);

  let x = left;
  cells.forEach((cell, index) => {
    doc.text(String(cell ?? ""), x + 6, y + (isHeader ? 7 : 5), {
      width: widths[index] - 12,
      height: height - 6,
      ellipsis: true,
      lineBreak: false
    });
    x += widths[index];
  });

  doc.moveTo(left, y + height).lineTo(left + tableWidth, y + height)
    .lineWidth(0.5).strokeColor(BORDER).stroke();

  return y + height;
}

function renderGroup(doc, group) {
  const left = PAGE_MARGIN;
  const width = doc.page.width - PAGE_MARGIN * 2;
  const bottom = doc.page.height - PAGE_MARGIN;
  const columnWidths = [28, width - 28 - 120 - 80, 120, 80];
  const columnLabels = ["#", "Name", "Admission No.", "PIN"];

  let y = drawGroupTitle(doc, group, false, left, width);
  y = drawRow(doc, columnLabels, columnWidths, left, y, true);

  let position = 1;
  for (const student of group.students) {
    if (y + ROW_HEIGHT > bottom) {
      doc.addPage();
      y = drawGroupTitle(doc, group, true, left, width);
      y = drawRow(doc, columnLabels, columnWidths, left, y, true);
    }
    y = drawRow(doc, [
      position,
      student.name || "",
      student.studentId || "",
      student.pin || ""
    ], columnWidths, left, y, false);
    position += 1;
  }
}

/**
 * Builds a single PDF where each class starts on its own page.
 * @param {Array<{ classLabel: string, students: Array<{ name: string, studentId: string, pin: string }> }>} groups
 * @returns {Promise<Buffer>}
 */
export function buildStudentPinsPdf(groups) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      groups.forEach((group, index) => {
        if (index > 0) doc.addPage();
        renderGroup(doc, group);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
