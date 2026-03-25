import {
  Document, Packer, Paragraph, TextRun, TabStopType, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, convertInchesToTwip, ImageRun, WidthType, VerticalAlign,
} from 'docx'
import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib'
import type { GeneratedCV } from '@/types/analysis'

// ─── Shared photo type ─────────────────────────────────────────────────────────
export interface PhotoData {
  buffer: Buffer
  type: 'jpg' | 'png'
}

export function detectPhotoType(buf: Buffer): 'jpg' | 'png' {
  return (buf[0] === 0xFF && buf[1] === 0xD8) ? 'jpg' : 'png'
}

// ─── DOCX constants ────────────────────────────────────────────────────────────
const FONT     = 'Calibri'
const C_BLACK  = '111111'
const C_ACCENT = '5B21B6'
const C_MUTED  = '555555'
const TAB_RIGHT = [{ type: TabStopType.RIGHT, position: convertInchesToTwip(6.5) }]
const NB = { style: BorderStyle.NONE, size: 0, color: 'auto' }
const NO_BORDERS = { top: NB, bottom: NB, left: NB, right: NB }

function docxSectionHeader(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, font: FONT, size: 24, color: C_ACCENT })],
    border: { bottom: { color: C_ACCENT, space: 4, style: BorderStyle.SINGLE, size: 6 } },
    spacing: { before: 260, after: 140 },
  })
}

// ─── DOCX export ───────────────────────────────────────────────────────────────
export async function generateCVDocx(cv: GeneratedCV, photo?: PhotoData): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = []

  // ── Header ──
  const contactParts: string[] = []
  if (cv.contact.email)    contactParts.push(cv.contact.email)
  if (cv.contact.phone)    contactParts.push(cv.contact.phone)
  if (cv.contact.location) contactParts.push(cv.contact.location)
  if (cv.contact.linkedin) contactParts.push(cv.contact.linkedin)
  const contactStr = contactParts.join('  |  ')

  if (photo) {
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top:    { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.NONE, size: 0 },
        left:   { style: BorderStyle.NONE, size: 0 },
        right:  { style: BorderStyle.NONE, size: 0 },
      },
      rows: [new TableRow({
        children: [
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            borders: NO_BORDERS,
            children: [
              new Paragraph({
                children: [new TextRun({ text: cv.fullName, bold: true, font: FONT, size: 36, color: C_BLACK })],
                spacing: { before: 0, after: 60 },
              }),
              new Paragraph({
                children: [new TextRun({ text: contactStr, font: FONT, size: 20, color: C_MUTED })],
                spacing: { before: 0, after: 0 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            borders: NO_BORDERS,
            children: [
              new Paragraph({
                children: [new ImageRun({
                  type: photo.type,
                  data: photo.buffer,
                  transformation: { width: 88, height: 108 },
                })],
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 0 },
              }),
            ],
          }),
        ],
      })],
    }))
  } else {
    children.push(new Paragraph({
      children: [new TextRun({ text: cv.fullName, bold: true, font: FONT, size: 36, color: C_BLACK })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
    }))
    children.push(new Paragraph({
      children: [new TextRun({ text: contactStr, font: FONT, size: 20, color: C_MUTED })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
    }))
  }

  // ── Summary ──
  if (cv.summary) {
    children.push(docxSectionHeader('Résumé professionnel'))
    children.push(new Paragraph({
      children: [new TextRun({ text: cv.summary, font: FONT, size: 20, color: C_MUTED })],
      spacing: { before: 0, after: 0 },
    }))
  }

  // ── Experience ──
  if (cv.experience.length > 0) {
    children.push(docxSectionHeader('Expérience professionnelle'))
    for (const exp of cv.experience) {
      children.push(new Paragraph({
        tabStops: TAB_RIGHT,
        children: [
          new TextRun({ text: exp.position, bold: true, font: FONT, size: 20, color: C_BLACK }),
          new TextRun({ text: '\t', font: FONT, size: 20 }),
          new TextRun({ text: exp.dates, font: FONT, size: 20, color: C_MUTED }),
        ],
        spacing: { before: 120, after: 20 },
      }))
      children.push(new Paragraph({
        children: [new TextRun({ text: exp.company, font: FONT, size: 20, color: C_MUTED, italics: true })],
        spacing: { before: 0, after: 60 },
      }))
      for (const b of exp.bullets) {
        children.push(new Paragraph({
          children: [new TextRun({ text: b, font: FONT, size: 20, color: C_BLACK })],
          bullet: { level: 0 },
          spacing: { before: 40, after: 40 },
        }))
      }
    }
  }

  // ── Education ──
  if (cv.education.length > 0) {
    children.push(docxSectionHeader('Formation'))
    for (const edu of cv.education) {
      children.push(new Paragraph({
        tabStops: TAB_RIGHT,
        children: [
          new TextRun({ text: edu.degree, bold: true, font: FONT, size: 20, color: C_BLACK }),
          new TextRun({ text: ' — ', font: FONT, size: 20, color: C_MUTED }),
          new TextRun({ text: edu.school, font: FONT, size: 20, color: C_MUTED }),
          ...(edu.year ? [
            new TextRun({ text: '\t', font: FONT, size: 20 }),
            new TextRun({ text: edu.year, font: FONT, size: 20, color: C_MUTED }),
          ] : []),
        ],
        spacing: { before: 80, after: 40 },
      }))
    }
  }

  // ── Skills ──
  if (cv.skills.length > 0) {
    children.push(docxSectionHeader('Compétences'))
    children.push(new Paragraph({
      children: [new TextRun({ text: cv.skills.join('  •  '), font: FONT, size: 20, color: C_BLACK })],
      spacing: { before: 0, after: 0 },
    }))
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
const PAGE_W   = 595.28
const PAGE_H   = 841.89
const MARGIN_X = 48
const MARGIN_Y = 45
const PDF_ACCENT = rgb(0.357, 0.129, 0.714)
const PDF_BLACK  = rgb(0.067, 0.067, 0.067)
const PDF_MUTED  = rgb(0.333, 0.333, 0.333)

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

function drawPdfText(
  ctx: PdfCtx,
  text: string,
  opts: { size: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; align?: 'left' | 'center' | 'right' }
) {
  const font  = opts.bold ? ctx.bold : ctx.regular
  const color = opts.color ?? PDF_BLACK
  const x     = opts.x ?? MARGIN_X

  if (opts.align === 'center') {
    const tw = font.widthOfTextAtSize(text, opts.size)
    currentPage(ctx).drawText(text, { x: (PAGE_W - tw) / 2, y: ctx.y, size: opts.size, font, color })
  } else if (opts.align === 'right') {
    const tw = font.widthOfTextAtSize(text, opts.size)
    currentPage(ctx).drawText(text, { x: PAGE_W - MARGIN_X - tw, y: ctx.y, size: opts.size, font, color })
  } else {
    currentPage(ctx).drawText(text, { x, y: ctx.y, size: opts.size, font, color })
  }
}

function drawPdfLine(ctx: PdfCtx, y: number, color = PDF_ACCENT) {
  currentPage(ctx).drawLine({
    start: { x: MARGIN_X, y },
    end:   { x: PAGE_W - MARGIN_X, y },
    thickness: 0.8,
    color,
  })
}

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

function drawPdfWrapped(
  ctx: PdfCtx,
  text: string,
  opts: { size: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; lineHeight?: number }
) {
  const font  = opts.bold ? ctx.bold : ctx.regular
  const x     = opts.x ?? MARGIN_X
  const lh    = opts.lineHeight ?? opts.size * 1.5
  const maxW  = PAGE_W - MARGIN_X - x
  const lines = wrapText(text, font, opts.size, maxW)
  for (const line of lines) {
    ensureSpace(ctx, lh + 4)
    drawPdfText(ctx, line, { size: opts.size, bold: opts.bold, color: opts.color, x })
    ctx.y -= lh
  }
}

// ── 1-page height estimator ────────────────────────────────────────────────────
function estimatePdfHeight(cv: GeneratedCV, hasPhoto: boolean): number {
  const SECTION = 55
  const LINE    = 14
  let h = hasPhoto ? 120 : 68
  if (cv.summary)           h += SECTION + Math.max(1, Math.ceil(cv.summary.length / 85)) * LINE
  if (cv.experience.length) {
    h += SECTION
    for (const exp of cv.experience) h += 15 + 16 + Math.max(1, exp.bullets.length) * LINE + 8
  }
  if (cv.education.length)  h += SECTION + cv.education.length * 32
  if (cv.skills.length)     h += SECTION + Math.max(1, Math.ceil(cv.skills.join('  •  ').length / 70)) * LINE
  return h
}

// ─── PDF export ────────────────────────────────────────────────────────────────
export async function generateCVPdf(cv: GeneratedCV, photo?: PhotoData): Promise<Buffer> {
  const doc     = await PDFDocument.create()
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  const AVAIL     = PAGE_H - 2 * MARGIN_Y
  const estimated = estimatePdfHeight(cv, !!photo)
  const scale     = estimated > AVAIL ? Math.max(0.72, AVAIL / estimated) : 1.0
  const S = (n: number) => n * scale

  const ctx: PdfCtx = { doc, pages: [], bold, regular, y: PAGE_H - MARGIN_Y }
  addPage(ctx)

  // ── Header ──
  const contactParts: string[] = []
  if (cv.contact.email)    contactParts.push(cv.contact.email)
  if (cv.contact.phone)    contactParts.push(cv.contact.phone)
  if (cv.contact.location) contactParts.push(cv.contact.location)
  if (cv.contact.linkedin) contactParts.push(cv.contact.linkedin)

  if (photo) {
    const imgW    = Math.round(S(80))
    const imgH    = Math.round(S(96))
    const imgX    = PAGE_W - MARGIN_X - imgW
    const imgTopY = ctx.y

    const pdfImg = photo.type === 'jpg'
      ? await doc.embedJpg(photo.buffer)
      : await doc.embedPng(photo.buffer)
    currentPage(ctx).drawImage(pdfImg, { x: imgX, y: imgTopY - imgH, width: imgW, height: imgH })

    // Name left
    currentPage(ctx).drawText(cv.fullName, {
      x: MARGIN_X, y: ctx.y, size: S(20), font: bold, color: PDF_BLACK,
    })
    ctx.y -= S(28)

    // Contact left (split if too wide)
    const maxCW = imgX - MARGIN_X - 8
    const cSz   = S(9.5)
    const full  = contactParts.join('  |  ')
    if (regular.widthOfTextAtSize(full, cSz) <= maxCW) {
      currentPage(ctx).drawText(full, { x: MARGIN_X, y: ctx.y, size: cSz, font: regular, color: PDF_MUTED })
      ctx.y -= S(14)
    } else {
      const half = Math.ceil(contactParts.length / 2)
      currentPage(ctx).drawText(contactParts.slice(0, half).join('  |  '), { x: MARGIN_X, y: ctx.y, size: cSz, font: regular, color: PDF_MUTED })
      ctx.y -= S(13)
      currentPage(ctx).drawText(contactParts.slice(half).join('  |  '), { x: MARGIN_X, y: ctx.y, size: cSz, font: regular, color: PDF_MUTED })
      ctx.y -= S(14)
    }

    // Ensure we're below the photo
    const photoBtm = imgTopY - imgH - S(8)
    if (ctx.y > photoBtm) ctx.y = photoBtm

    drawPdfLine(ctx, ctx.y, rgb(0.8, 0.8, 0.8))
    ctx.y -= S(4)
  } else {
    const nameSz = S(22)
    const nameW  = bold.widthOfTextAtSize(cv.fullName, nameSz)
    currentPage(ctx).drawText(cv.fullName, {
      x: (PAGE_W - nameW) / 2, y: ctx.y, size: nameSz, font: bold, color: PDF_BLACK,
    })
    ctx.y -= S(30)

    const cSz  = S(9.5)
    const cStr = contactParts.join('  |  ')
    const cW   = regular.widthOfTextAtSize(cStr, cSz)
    currentPage(ctx).drawText(cStr, {
      x: (PAGE_W - cW) / 2, y: ctx.y, size: cSz, font: regular, color: PDF_MUTED,
    })
    ctx.y -= S(8)
    drawPdfLine(ctx, ctx.y, rgb(0.8, 0.8, 0.8))
    ctx.y -= S(4)
  }

  // ── Section header ──
  function pdfSection(title: string) {
    ensureSpace(ctx, S(55))
    ctx.y -= S(20)
    drawPdfText(ctx, title.toUpperCase(), { size: S(11), bold: true, color: PDF_ACCENT })
    ctx.y -= S(17)
    drawPdfLine(ctx, ctx.y)
    ctx.y -= S(14)
  }

  // ── Summary ──
  if (cv.summary) {
    pdfSection('Résumé professionnel')
    drawPdfWrapped(ctx, cv.summary, { size: S(10), color: PDF_MUTED, lineHeight: S(15) })
  }

  // ── Experience ──
  if (cv.experience.length > 0) {
    pdfSection('Expérience professionnelle')
    for (const exp of cv.experience) {
      ensureSpace(ctx, S(50))
      drawPdfText(ctx, exp.position, { size: S(10.5), bold: true })
      drawPdfText(ctx, exp.dates, { size: S(9.5), color: PDF_MUTED, align: 'right' })
      ctx.y -= S(15)
      drawPdfText(ctx, exp.company, { size: S(9.5), color: PDF_MUTED })
      ctx.y -= S(16)
      for (const b of exp.bullets) {
        ensureSpace(ctx, S(15))
        drawPdfText(ctx, '–', { size: S(9.5), x: MARGIN_X + 2 })
        drawPdfWrapped(ctx, b, { size: S(9.5), color: PDF_BLACK, x: MARGIN_X + 14, lineHeight: S(14) })
      }
      ctx.y -= S(8)
    }
  }

  // ── Education ──
  if (cv.education.length > 0) {
    pdfSection('Formation')
    for (const edu of cv.education) {
      ensureSpace(ctx, S(36))
      drawPdfText(ctx, edu.degree, { size: S(10.5), bold: true })
      if (edu.year) drawPdfText(ctx, edu.year, { size: S(9.5), color: PDF_MUTED, align: 'right' })
      ctx.y -= S(15)
      drawPdfText(ctx, edu.school, { size: S(9.5), color: PDF_MUTED })
      ctx.y -= S(16)
    }
  }

  // ── Skills ──
  if (cv.skills.length > 0) {
    pdfSection('Compétences')
    drawPdfWrapped(ctx, cv.skills.join('  •  '), { size: S(10), lineHeight: S(15) })
  }

  return Buffer.from(await doc.save())
}
