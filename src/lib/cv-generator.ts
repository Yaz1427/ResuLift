import {
  Document, Packer, Paragraph, TextRun, TabStopType,
  AlignmentType, BorderStyle, convertInchesToTwip,
} from 'docx'
import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib'
import type { GeneratedCV } from '@/types/analysis'

// ─── DOCX constants ────────────────────────────────────────────────────────────
const FONT        = 'Calibri'
const SIZE_NAME   = 32   // 16pt
const SIZE_TITLE  = 22   // 11pt (contact/title)
const SIZE_SECT   = 22   // 11pt section header
const SIZE_BODY   = 20   // 10pt body
const C_BLACK     = '1A1A1A'
const C_ACCENT    = '5B21B6'   // violet
const C_MUTED     = '555555'

// Right tab at 9 inches for date alignment
const TAB_RIGHT = [{ type: TabStopType.RIGHT, position: convertInchesToTwip(6.5) }]

function hr(): Paragraph {
  return new Paragraph({
    border: { bottom: { color: C_ACCENT, space: 1, style: BorderStyle.SINGLE, size: 4 } },
    spacing: { before: 40, after: 80 },
  })
}

function sectionHeader(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, font: FONT, size: SIZE_SECT, color: C_ACCENT })],
    spacing: { before: 200, after: 0 },
  })
}

function nameParagraph(name: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: name, bold: true, font: FONT, size: SIZE_NAME, color: C_BLACK })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60 },
  })
}

function contactParagraph(cv: GeneratedCV): Paragraph {
  const parts: string[] = []
  if (cv.contact.email)    parts.push(cv.contact.email)
  if (cv.contact.phone)    parts.push(cv.contact.phone)
  if (cv.contact.location) parts.push(cv.contact.location)
  if (cv.contact.linkedin) parts.push(cv.contact.linkedin)
  return new Paragraph({
    children: [new TextRun({ text: parts.join('  |  '), font: FONT, size: SIZE_TITLE, color: C_MUTED })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 100 },
  })
}

function summaryParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY, color: C_MUTED })],
    spacing: { before: 60, after: 60 },
  })
}

function experienceHeader(position: string, company: string, dates: string): Paragraph {
  return new Paragraph({
    tabStops: TAB_RIGHT,
    children: [
      new TextRun({ text: position, bold: true, font: FONT, size: SIZE_BODY, color: C_BLACK }),
      new TextRun({ text: '\t', font: FONT, size: SIZE_BODY }),
      new TextRun({ text: dates, font: FONT, size: SIZE_BODY, color: C_MUTED }),
    ],
    spacing: { before: 120, after: 20 },
  })
}

function companyLine(company: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: company, font: FONT, size: SIZE_BODY, color: C_MUTED, italics: true })],
    spacing: { before: 0, after: 40 },
  })
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY, color: C_BLACK })],
    bullet: { level: 0 },
    spacing: { before: 30, after: 30 },
  })
}

function educationLine(degree: string, school: string, year?: string): Paragraph {
  const rightText = year ?? ''
  return new Paragraph({
    tabStops: TAB_RIGHT,
    children: [
      new TextRun({ text: degree, bold: true, font: FONT, size: SIZE_BODY, color: C_BLACK }),
      new TextRun({ text: ' — ', font: FONT, size: SIZE_BODY, color: C_MUTED }),
      new TextRun({ text: school, font: FONT, size: SIZE_BODY, color: C_MUTED }),
      ...(rightText ? [
        new TextRun({ text: '\t', font: FONT, size: SIZE_BODY }),
        new TextRun({ text: rightText, font: FONT, size: SIZE_BODY, color: C_MUTED }),
      ] : []),
    ],
    spacing: { before: 100, after: 30 },
  })
}

function skillsParagraph(skills: string[]): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: skills.join('  •  '), font: FONT, size: SIZE_BODY, color: C_BLACK })],
    spacing: { before: 60, after: 40 },
  })
}

// ─── DOCX export ───────────────────────────────────────────────────────────────
export async function generateCVDocx(cv: GeneratedCV): Promise<Buffer> {
  const children: Paragraph[] = []

  // Header
  children.push(nameParagraph(cv.fullName))
  children.push(contactParagraph(cv))

  // Summary
  if (cv.summary) {
    children.push(sectionHeader('Résumé professionnel'))
    children.push(hr())
    children.push(summaryParagraph(cv.summary))
  }

  // Experience
  if (cv.experience.length > 0) {
    children.push(sectionHeader('Expérience professionnelle'))
    children.push(hr())
    for (const exp of cv.experience) {
      children.push(experienceHeader(exp.position, exp.company, exp.dates))
      children.push(companyLine(exp.company))
      for (const b of exp.bullets) children.push(bulletParagraph(b))
    }
  }

  // Education
  if (cv.education.length > 0) {
    children.push(sectionHeader('Formation'))
    children.push(hr())
    for (const edu of cv.education) {
      children.push(educationLine(edu.degree, edu.school, edu.year))
    }
  }

  // Skills
  if (cv.skills.length > 0) {
    children.push(sectionHeader('Compétences'))
    children.push(hr())
    children.push(skillsParagraph(cv.skills))
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top:    convertInchesToTwip(0.75),
            right:  convertInchesToTwip(0.75),
            bottom: convertInchesToTwip(0.75),
            left:   convertInchesToTwip(0.75),
          },
        },
      },
      children,
    }],
  })

  return Buffer.from(await Packer.toBuffer(doc))
}

// ─── PDF constants ─────────────────────────────────────────────────────────────
const PAGE_W = 595.28                // A4 width in points
const PAGE_H = 841.89                // A4 height in points
const MARGIN_X = 50
const MARGIN_Y = 50
const CONTENT_W = PAGE_W - MARGIN_X * 2
const PDF_ACCENT = rgb(0.357, 0.129, 0.714)   // #5B21B6
const PDF_BLACK  = rgb(0.1, 0.1, 0.1)
const PDF_MUTED  = rgb(0.33, 0.33, 0.33)

interface PdfCtx {
  doc: PDFDocument
  pages: PDFPage[]
  bold: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>
  regular: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>
  y: number
}

function addPage(ctx: PdfCtx): PDFPage {
  const page = ctx.doc.addPage([PAGE_W, PAGE_H])
  ctx.pages.push(page)
  ctx.y = PAGE_H - MARGIN_Y
  return page
}

function currentPage(ctx: PdfCtx): PDFPage {
  return ctx.pages[ctx.pages.length - 1]
}

function ensureSpace(ctx: PdfCtx, needed: number) {
  if (ctx.y - needed < MARGIN_Y) addPage(ctx)
}

function drawText(
  ctx: PdfCtx,
  text: string,
  opts: { size: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; align?: 'left' | 'center' | 'right' }
) {
  const font = opts.bold ? ctx.bold : ctx.regular
  const size = opts.size
  const color = opts.color ?? PDF_BLACK
  const x = opts.x ?? MARGIN_X

  if (opts.align === 'center') {
    const tw = font.widthOfTextAtSize(text, size)
    const cx = (PAGE_W - tw) / 2
    currentPage(ctx).drawText(text, { x: cx, y: ctx.y, size, font, color })
  } else if (opts.align === 'right') {
    const tw = font.widthOfTextAtSize(text, size)
    currentPage(ctx).drawText(text, { x: PAGE_W - MARGIN_X - tw, y: ctx.y, size, font, color })
  } else {
    currentPage(ctx).drawText(text, { x, y: ctx.y, size, font, color })
  }
}

function drawLine(ctx: PdfCtx, y: number, color = PDF_ACCENT) {
  currentPage(ctx).drawLine({
    start: { x: MARGIN_X, y },
    end: { x: PAGE_W - MARGIN_X, y },
    thickness: 0.8,
    color,
  })
}

// Wraps long text into multiple lines
function wrapText(text: string, font: PdfCtx['regular'], size: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

function drawWrappedText(
  ctx: PdfCtx,
  text: string,
  opts: { size: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; lineHeight?: number }
): number {
  const font = opts.bold ? ctx.bold : ctx.regular
  const size = opts.size
  const x = opts.x ?? MARGIN_X
  const lh = opts.lineHeight ?? size * 1.4
  const maxW = PAGE_W - MARGIN_X - x
  const lines = wrapText(text, font, size, maxW)
  for (const line of lines) {
    ensureSpace(ctx, lh + 4)
    drawText(ctx, line, { size, bold: opts.bold, color: opts.color, x })
    ctx.y -= lh
  }
  return lines.length
}

function pdfSectionHeader(ctx: PdfCtx, title: string) {
  ensureSpace(ctx, 40)
  ctx.y -= 10
  drawText(ctx, title.toUpperCase(), { size: 11, bold: true, color: PDF_ACCENT })
  ctx.y -= 14
  drawLine(ctx, ctx.y)
  ctx.y -= 8
}

// ─── PDF export ────────────────────────────────────────────────────────────────
export async function generateCVPdf(cv: GeneratedCV): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  const ctx: PdfCtx = { doc, pages: [], bold, regular, y: PAGE_H - MARGIN_Y }
  addPage(ctx)

  // ── Name ──
  const nameFontSize = 20
  const nameW = bold.widthOfTextAtSize(cv.fullName, nameFontSize)
  currentPage(ctx).drawText(cv.fullName, {
    x: (PAGE_W - nameW) / 2, y: ctx.y,
    size: nameFontSize, font: bold, color: PDF_BLACK,
  })
  ctx.y -= nameFontSize * 1.5

  // ── Contact ──
  const parts: string[] = []
  if (cv.contact.email)    parts.push(cv.contact.email)
  if (cv.contact.phone)    parts.push(cv.contact.phone)
  if (cv.contact.location) parts.push(cv.contact.location)
  if (cv.contact.linkedin) parts.push(cv.contact.linkedin)
  const contactStr = parts.join('  |  ')
  const cW = regular.widthOfTextAtSize(contactStr, 9)
  currentPage(ctx).drawText(contactStr, {
    x: (PAGE_W - cW) / 2, y: ctx.y,
    size: 9, font: regular, color: PDF_MUTED,
  })
  ctx.y -= 28

  // ── Summary ──
  if (cv.summary) {
    pdfSectionHeader(ctx, 'Résumé professionnel')
    drawWrappedText(ctx, cv.summary, { size: 9.5, color: PDF_MUTED, lineHeight: 14 })
    ctx.y -= 4
  }

  // ── Experience ──
  if (cv.experience.length > 0) {
    pdfSectionHeader(ctx, 'Expérience professionnelle')
    for (const exp of cv.experience) {
      ensureSpace(ctx, 40)

      // Position (bold left) + Dates (right)
      drawText(ctx, exp.position, { size: 10, bold: true })
      drawText(ctx, exp.dates, { size: 9, color: PDF_MUTED, align: 'right' })
      ctx.y -= 14

      // Company (italic muted)
      drawText(ctx, exp.company, { size: 9, color: PDF_MUTED })
      ctx.y -= 14

      // Bullets
      for (const b of exp.bullets) {
        ensureSpace(ctx, 14)
        drawText(ctx, '•', { size: 9, x: MARGIN_X + 4 })
        drawWrappedText(ctx, b, { size: 9, color: PDF_BLACK, x: MARGIN_X + 16, lineHeight: 13 })
      }
      ctx.y -= 6
    }
  }

  // ── Education ──
  if (cv.education.length > 0) {
    pdfSectionHeader(ctx, 'Formation')
    for (const edu of cv.education) {
      ensureSpace(ctx, 30)
      drawText(ctx, edu.degree, { size: 10, bold: true })
      if (edu.year) drawText(ctx, edu.year, { size: 9, color: PDF_MUTED, align: 'right' })
      ctx.y -= 14
      drawText(ctx, edu.school, { size: 9, color: PDF_MUTED })
      ctx.y -= 14
    }
  }

  // ── Skills ──
  if (cv.skills.length > 0) {
    pdfSectionHeader(ctx, 'Compétences')
    drawWrappedText(ctx, cv.skills.join('  •  '), { size: 9.5, lineHeight: 14 })
  }

  return Buffer.from(await doc.save())
}
