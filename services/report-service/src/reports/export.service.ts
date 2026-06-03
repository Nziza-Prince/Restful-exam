import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { ReportFormat } from './enums/report-format.enum';

export interface ExportResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

// Palette
const COPPER = '#B45309';
const COPPER_ARGB = 'FFB45309';
const COPPER_LIGHT_ARGB = 'FFFFF7EB'; // amber-50
const ZINC_50_ARGB = 'FFF9FAFB';
const ZINC_100_ARGB = 'FFF4F4F5';
const ZINC_200_ARGB = 'FFE4E4E7';
const ZINC_500 = '#71717A';
const ZINC_800 = '#27272A';
const ZINC_950 = '#09090B';
const WHITE_ARGB = 'FFFFFFFF';

@Injectable()
export class ExportService {
  async export(
    title: string,
    rows: Record<string, unknown>[],
    format: ReportFormat,
  ): Promise<ExportResult> {
    switch (format) {
      case ReportFormat.PDF:
        return this.toPdf(title, rows);
      case ReportFormat.XLSX:
        return this.toXlsx(title, rows);
      case ReportFormat.CSV:
      default:
        return this.toCsv(title, rows);
    }
  }

  private getColumns(rows: Record<string, unknown>[]): string[] {
    if (!rows.length) return ['No records'];
    return Object.keys(rows[0]);
  }

  /** camelCase / snake_case → Title Case */
  private humanize(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  private formatValue(val: unknown): string {
    if (val === null || val === undefined) return '';
    if (val instanceof Date) {
      return val.toISOString().slice(0, 10);
    }
    return String(val);
  }

  private nowLabel(): string {
    return new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  }

  // ── CSV ────────────────────────────────────────────────────────────────────

  private async toCsv(title: string, rows: Record<string, unknown>[]): Promise<ExportResult> {
    const columns = this.getColumns(rows);
    const humanCols = columns.map((c) => this.humanize(c));

    const quote = (s: string) => `"${s.replace(/"/g, '""')}"`;

    const lines: string[] = [
      `# Report: ${title.replace(/-/g, ' ').toUpperCase()}`,
      `# Generated: ${this.nowLabel()}`,
      `# Total records: ${rows.length}`,
      '#',
      humanCols.map(quote).join(','),
      ...rows.map((row) =>
        columns.map((col) => quote(this.formatValue(row[col]))).join(','),
      ),
    ];

    // UTF-8 BOM so Excel auto-detects encoding
    const content = '﻿' + lines.join('\r\n');
    return {
      buffer: Buffer.from(content, 'utf-8'),
      contentType: 'text/csv; charset=utf-8',
      filename: `${title}.csv`,
    };
  }

  // ── XLSX ───────────────────────────────────────────────────────────────────

  private async toXlsx(title: string, rows: Record<string, unknown>[]): Promise<ExportResult> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FEMS — Fire Extinguisher Management System';
    workbook.created = new Date();
    workbook.properties.date1904 = false;

    const sheetName = title.slice(0, 31);
    const sheet = workbook.addWorksheet(sheetName, {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
      properties: { defaultRowHeight: 18 },
    });

    const columns = this.getColumns(rows);
    const humanCols = columns.map((c) => this.humanize(c));
    const colCount = Math.max(columns.length, 1);

    // ── Row 1: Title band ────────────────────────────────
    sheet.mergeCells(1, 1, 1, colCount);
    const titleCell = sheet.getCell('A1');
    titleCell.value = title.replace(/-/g, ' ').toUpperCase();
    titleCell.font = { bold: true, size: 13, color: { argb: WHITE_ARGB }, name: 'Arial' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COPPER_ARGB } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // ── Row 2: Metadata ──────────────────────────────────
    sheet.mergeCells(2, 1, 2, colCount);
    const metaCell = sheet.getCell('A2');
    metaCell.value = `Generated: ${this.nowLabel()}   |   Records: ${rows.length}`;
    metaCell.font = { italic: true, size: 9, color: { argb: 'FF71717A' }, name: 'Arial' };
    metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COPPER_LIGHT_ARGB } };
    metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 20;

    // ── Row 3: Spacer ────────────────────────────────────
    sheet.getRow(3).height = 6;

    // ── Row 4: Column headers ────────────────────────────
    const headerRow = sheet.getRow(4);
    humanCols.forEach((label, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = label;
      cell.font = { bold: true, size: 10, name: 'Arial', color: { argb: 'FF18181B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZINC_100_ARGB } };
      cell.border = {
        bottom: { style: 'medium', color: { argb: COPPER_ARGB } },
        top: { style: 'thin', color: { argb: ZINC_200_ARGB } },
      };
      cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: false };
    });
    headerRow.height = 24;

    // ── Rows 5+: Data ────────────────────────────────────
    if (rows.length === 0) {
      sheet.mergeCells(5, 1, 5, colCount);
      const empty = sheet.getCell('A5');
      empty.value = 'No records found for the selected filters.';
      empty.font = { italic: true, color: { argb: 'FF71717A' }, name: 'Arial' };
      empty.alignment = { horizontal: 'center' };
    } else {
      rows.forEach((row, ri) => {
        const dataRow = sheet.getRow(5 + ri);
        const isEven = ri % 2 === 0;
        columns.forEach((col, ci) => {
          const cell = dataRow.getCell(ci + 1);
          const raw = row[col];
          if (raw instanceof Date) {
            cell.value = raw;
            cell.numFmt = 'yyyy-mm-dd';
          } else if (typeof raw === 'number') {
            cell.value = raw;
            cell.numFmt = '#,##0.##';
          } else {
            cell.value = raw === null || raw === undefined ? '' : String(raw);
          }
          cell.font = { size: 9, name: 'Arial' };
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
          if (isEven) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZINC_50_ARGB } };
          }
          cell.border = { bottom: { style: 'hair', color: { argb: ZINC_200_ARGB } } };
        });
        dataRow.height = 18;
      });
    }

    // ── Column widths (auto-fit) ─────────────────────────
    sheet.columns = columns.map((col, i) => {
      const header = humanCols[i];
      const maxData = rows.reduce((m, r) => Math.max(m, this.formatValue(r[col]).length), 0);
      return { width: Math.min(45, Math.max(header.length + 4, maxData + 2, 12)) };
    });

    // ── Freeze panes below header ─────────────────────────
    sheet.views = [{ state: 'frozen', ySplit: 4, activeCell: 'A5' }];

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return {
      buffer,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `${title}.xlsx`,
    };
  }

  // ── PDF ────────────────────────────────────────────────────────────────────

  private async toPdf(title: string, rows: Record<string, unknown>[]): Promise<ExportResult> {
    const columns = this.getColumns(rows);
    const humanCols = columns.map((c) => this.humanize(c));

    const doc = new PDFDocument({
      margin: 36,
      size: 'A4',
      layout: columns.length > 5 ? 'landscape' : 'portrait',
      info: {
        Title: title,
        Author: 'FEMS — Fire Extinguisher Management System',
        CreationDate: new Date(),
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const finished = new Promise<Buffer>((resolve) =>
      doc.on('end', () => resolve(Buffer.concat(chunks))),
    );

    const MARGIN = 36;
    const PAGE_W = doc.page.width - MARGIN * 2;
    const COL_W = Math.min(120, PAGE_W / columns.length);
    const TABLE_W = COL_W * columns.length;
    const TABLE_X = MARGIN + Math.max(0, (PAGE_W - TABLE_W) / 2);

    const ROW_H = 18;
    const HDR_H = 22;
    const HEADER_BAND_H = 52;

    // ── Page header band (drawn on every page via closure) ───────────────────
    const drawPageHeader = (isFirstPage: boolean) => {
      const y = MARGIN;
      // Copper band
      doc.rect(MARGIN, y, PAGE_W, HEADER_BAND_H).fill(COPPER);
      doc
        .fillColor('#FFFFFF')
        .fontSize(isFirstPage ? 15 : 11)
        .font('Helvetica-Bold')
        .text(
          title.replace(/-/g, ' ').toUpperCase(),
          MARGIN + 10,
          y + (isFirstPage ? 8 : 12),
          { width: PAGE_W - 20, align: 'left' },
        );
      if (isFirstPage) {
        doc
          .fillColor('#FEF3C7')
          .fontSize(8)
          .font('Helvetica')
          .text(
            `Generated: ${this.nowLabel()}   |   ${rows.length} record(s)`,
            MARGIN + 10,
            y + 30,
            { width: PAGE_W - 20 },
          );
      }
    };

    const drawTableHeader = (y: number) => {
      // Header background
      doc.rect(TABLE_X, y, TABLE_W, HDR_H).fill('#F4F4F5');
      // Bottom border line (copper)
      doc.rect(TABLE_X, y + HDR_H, TABLE_W, 1.5).fill(COPPER);

      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(ZINC_950);
      humanCols.forEach((label, i) => {
        doc.text(
          label.toUpperCase(),
          TABLE_X + i * COL_W + 4,
          y + (HDR_H - 9) / 2,
          { width: COL_W - 8, lineBreak: false, ellipsis: true },
        );
      });
      return y + HDR_H + 1.5;
    };

    // ── First page ────────────────────────────────────────
    drawPageHeader(true);
    let y = MARGIN + HEADER_BAND_H + 10;
    y = drawTableHeader(y);

    // ── Data rows ─────────────────────────────────────────
    if (rows.length === 0) {
      y += 12;
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(ZINC_500)
        .text('No records found for the selected filters.', TABLE_X, y, {
          width: TABLE_W,
          align: 'center',
        });
    } else {
      doc.font('Helvetica').fontSize(8);

      rows.forEach((row, ri) => {
        // Page break: leave 40px for footer
        if (y + ROW_H > doc.page.height - 40) {
          drawPageFooter(doc, MARGIN, PAGE_W);
          doc.addPage();
          drawPageHeader(false);
          y = MARGIN + HEADER_BAND_H + 6;
          y = drawTableHeader(y);
          doc.font('Helvetica').fontSize(8);
        }

        // Alternating row tint
        if (ri % 2 === 0) {
          doc.rect(TABLE_X, y, TABLE_W, ROW_H).fill('#FAFAFA');
        }
        // Row border
        doc.rect(TABLE_X, y + ROW_H - 0.5, TABLE_W, 0.5).fill('#E4E4E7');

        doc.fillColor(ZINC_800);
        columns.forEach((col, ci) => {
          const str = this.formatValue(row[col]) || '—';
          doc.text(str, TABLE_X + ci * COL_W + 4, y + (ROW_H - 8) / 2, {
            width: COL_W - 8,
            lineBreak: false,
            ellipsis: true,
          });
        });

        y += ROW_H;
      });
    }

    drawPageFooter(doc, MARGIN, PAGE_W);
    doc.end();
    const buffer = await finished;

    return {
      buffer,
      contentType: 'application/pdf',
      filename: `${title}.pdf`,
    };
  }
}

function drawPageFooter(doc: PDFKit.PDFDocument, margin: number, pageWidth: number): void {
  const footerY = doc.page.height - 28;
  doc.rect(margin, footerY - 6, pageWidth, 0.5).fill('#E4E4E7');
  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor('#A1A1AA')
    .text(
      'FEMS — Fire Extinguisher Management System   |   Confidential',
      margin,
      footerY,
      { width: pageWidth, align: 'center' },
    );
}
