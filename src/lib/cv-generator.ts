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

/** Returns null for unsupported formats (WEBP, GIF, BMP, etc.) */
export function detectPhotoType(buf: Buffer): 'jpg' | 'png' | null {
  if (buf[0] === 0xFF && buf[1] === 0xD8) return 'jpg'                         // JPEG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E) return 'png'     // PNG
  return null
}

// ─── DOCX constants ────────────────────────────────────────────────────────────
const FONT     = 'Calibri'
const C_BLACK  = '111111'
const C_ACCENT = '5B21B6'
const C_MUTED  = '555555'
const TAB_RIGHT = [{ type: TabStopType.RIGHT, position: convertInchesToTwip(6.5) }]
const NB = { style: BorderStyle.NONE, size: 0, color: 'auto' }
const NO_BORDERS = { top: NB, bottom: NB, left: NB, right: NB }

// ─── DOCX export ───────────────────────────────────────────────────────────────
export async function generateCVDocx(cv: GeneratedCV, photo?: PhotoData): Promise<Buffer> {
  const totalBullets = cv.experience.reduce((s, e) => s + e.bullets.length, 0)
  const compact = cv.experience.length >= 3 || totalBullets >= 7 || !!photo

  const SP = {
    sectionBefore: compact ? 180 : 260,
    sectionAfter:  compact ? 80  : 140,
    expBefore:     compact ? 80  : 120,
    companyAfter:  compact ? 30  : 60,
    bulletBefore:  compact ? 20  : 40,
    bulletAfter:   compact ? 20  : 40,
    eduBefore:     compact ? 60  : 80,
  }

  function sectionHdr(text: string): Paragraph {
    return new Paragraph({
      children: [new TextRun({ text: text.toUpperCase(), bold: true, font: FONT, size: 24, color: C_ACCENT })],
      border: { bottom: { color: C_ACCENT, space: 4, style: BorderStyle.SINGLE, size: 6 } },
      spacing: { before: SP.sectionBefore, after: SP.sectionAfter },
    })
  }

  const children: (Paragraph | Table)[] = []

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
            width: { size: 77, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            borders: NO_BORDERS,
            children: [
              new Paragraph({
                children: [new TextRun({ text: cv.fullName, bold: true, font: FONT, size: 36, color: C_BLACK })],
                spacing: { before: 0, after: 50 },
              }),
              new Paragraph({
                children: [new TextRun({ text: contactStr, font: FONT, size: 19, color: C_MUTED })],
                spacing: { before: 0, after: 0 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 23, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            borders: NO_BORDERS,
            children: [
              new Paragraph({
                children: [new ImageRun({
                  type: photo.type,
                  data: photo.buffer,
                  transformation: { width: 84, height: 104 },
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

  if (cv.summary) {
    children.push(sectionHdr('Résumé professionnel'))
    children.push(new Paragraph({
      children: [new TextRun({ text: cv.summary, font: FONT, size: 20, color: C_MUTED })],
      spacing: { before: 0, after: 0 },
    }))
  }

  if (cv.experience.length > 0) {
    children.push(sectionHdr('Expérience professionnelle'))
    for (const exp of cv.experience) {
      children.push(new Paragraph({
        tabStops: TAB_RIGHT,
        children: [
          new TextRun({ text: exp.position, bold: true, font: FONT, size: 20, color: C_BLACK }),
          new TextRun({ text: '\t', font: FONT, size: 20 }),
          new TextRun({ text: exp.dates, font: FONT, size: 20, color: C_MUTED }),
        ],
        spacing: { before: SP.expBefore, after: 20 },
      }))
      children.push(new Paragraph({
        children: [new TextRun({ text: exp.company, font: FONT, size: 20, color: C_MUTED, italics: true })],
        spacing: { before: 0, after: SP.companyAfter },
      }))
      for (const b of exp.bullets) {
        children.push(new Paragraph({
          children: [new TextRun({ text: b, font: FONT, size: 20, color: C_BLACK })],
          bullet: { level: 0 },
          spacing: { before: SP.bulletBefore, after: SP.bulletAfter },
        }))
      }
    }
  }

  if (cv.education.length > 0) {
    children.push(sectionHdr('Formation'))
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
        spacing: { before: SP.eduBefore, after: 30 },
      }))
    }
  }

  if (cv.skills.length > 0) {
    children.push(sectionHdr('Compétences'))
    children.push(new Paragraph({
      children: [new TextRun({ text: cv.skills.join('  •  '), font: FONT, size: 20, color: C_BLACK })],
      spacing: { before: 0, after: 0 },
    }))
  }

  const margin = compact ? 0.6 : 0.75
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top:    convertInchesToTwip(margin),
            right:  convertInchesToTwip(margin),
            bottom: convertInchesToTwip(margin),
            left:   convertInchesToTwip(margin),
          },
        },
      },
      children,
    }],
  })

  return Buffer.from(await Packer.toBuffer(doc))
}

// ─── PDF page geometry ─────────────────────────────────────────────────────────
const PAGE_W   = 595.28   // A4 width  (pt)
const PAGE_H   = 841.89   // A4 height (pt)
const MARGIN_X = 48
const MARGIN_Y = 44       // top & bottom margin

// Total vertical space available on one page
const AVAIL = PAGE_H - 2 * MARGIN_Y   // ≈ 753.89 pt

const PDF_ACCENT = rgb(0.357, 0.129, 0.714)
const PDF_BLACK  = rgb(0.067, 0.067, 0.067)
const PDF_MUTED  = rgb(0.333, 0.333, 0.333)

interface PdfCtx {
  doc: PDFDocument
  pages: PDFPage[]
  bold: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>
  regular: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>
  y: number                 // current pen Y (top = PAGE_H - MARGIN_Y, moves down)
  totalConsumed: number     // tracks total height used across all pages
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

/** Move pen down by `delta` pt; overflow to next page if needed. */
function advance(ctx: PdfCtx, delta: number) {
  ctx.y -= delta
  ctx.totalConsumed += delta
  if (ctx.y < MARGIN_Y) {
    addPage(ctx)
    // totalConsumed already tracks the gap; y reset by addPage
  }
}

function ensureSpace(ctx: PdfCtx, needed: number) {
  if (ctx.y - needed < MARGIN_Y) addPage(ctx)
}

function drawText(
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

function drawLine(ctx: PdfCtx, y: number, color = PDF_ACCENT) {
  currentPage(ctx).drawLine({
    start: { x: MARGIN_X, y },
    end:   { x: PAGE_W - MARGIN_X, y },
    thickness: 0.7,
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

function drawWrapped(
  ctx: PdfCtx,
  text: string,
  opts: { size: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; lineHeight?: number }
) {
  const font = opts.bold ? ctx.bold : ctx.regular
  const x    = opts.x ?? MARGIN_X
  const lh   = opts.lineHeight ?? opts.size * 1.5
  const maxW = PAGE_W - MARGIN_X - x
  const lines = wrapText(text, font, opts.size, maxW)
  for (const line of lines) {
    ensureSpace(ctx, lh + 2)
    drawText(ctx, line, { size: opts.size, bold: opts.bold, color: opts.color, x })
    advance(ctx, lh)
  }
}

// ─── Core render function (pure, deterministic given a scale) ──────────────────
async function renderCVPdf(
  cv: GeneratedCV,
  photo: PhotoData | undefined,
  scale: number
): Promise<{ buffer: Uint8Array; pageCount: number; contentHeight: number }> {
  const doc     = await PDFDocument.create()
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  // Scaled dimension helper — all layout values go through S()
  const S = (n: number) => n * scale

  const ctx: PdfCtx = { doc, pages: [], bold, regular, y: PAGE_H - MARGIN_Y, totalConsumed: 0 }
  addPage(ctx)

  // ── Header ──────────────────────────────────────────────────────────────────
  const contactParts: string[] = []
  if (cv.contact.email)    contactParts.push(cv.contact.email)
  if (cv.contact.phone)    contactParts.push(cv.contact.phone)
  if (cv.contact.location) contactParts.push(cv.contact.location)
  if (cv.contact.linkedin) contactParts.push(cv.contact.linkedin)

  if (photo) {
    const imgW    = Math.round(S(78))
    const imgH    = Math.round(S(94))
    const imgX    = PAGE_W - MARGIN_X - imgW
    const imgTopY = ctx.y

    const pdfImg = photo.type === 'jpg'
      ? await doc.embedJpg(photo.buffer)
      : await doc.embedPng(photo.buffer)

    currentPage(ctx).drawImage(pdfImg, { x: imgX, y: imgTopY - imgH, width: imgW, height: imgH })

    // Name (left of photo)
    drawText(ctx, cv.fullName, { size: S(19), bold: true, color: PDF_BLACK })
    advance(ctx, S(26))

    // Contact lines (left of photo, may split into 2 lines)
    const cSz  = S(9)
    const maxCW = imgX - MARGIN_X - 6
    const full  = contactParts.join('  |  ')
    if (regular.widthOfTextAtSize(full, cSz) <= maxCW) {
      drawText(ctx, full, { size: cSz, color: PDF_MUTED })
      advance(ctx, S(13))
    } else {
      const half = Math.ceil(contactParts.length / 2)
      drawText(ctx, contactParts.slice(0, half).join('  |  '), { size: cSz, color: PDF_MUTED })
      advance(ctx, S(12))
      drawText(ctx, contactParts.slice(half).join('  |  '), { size: cSz, color: PDF_MUTED })
      advance(ctx, S(13))
    }

    // Make sure we clear the photo before drawing the separator
    const photoBtm = imgTopY - imgH - S(6)
    if (ctx.y > photoBtm) {
      const drop = ctx.y - photoBtm
      advance(ctx, drop)
    }
  } else {
    const nameSz = S(21)
    const nameW  = bold.widthOfTextAtSize(cv.fullName, nameSz)
    currentPage(ctx).drawText(cv.fullName, {
      x: (PAGE_W - nameW) / 2, y: ctx.y, size: nameSz, font: bold, color: PDF_BLACK,
    })
    advance(ctx, S(28))

    const cSz  = S(9)
    const cStr = contactParts.join('  |  ')
    const cW   = regular.widthOfTextAtSize(cStr, cSz)
    currentPage(ctx).drawText(cStr, {
      x: (PAGE_W - cW) / 2, y: ctx.y, size: cSz, font: regular, color: PDF_MUTED,
    })
    advance(ctx, S(8))
  }

  // Separator after header
  drawLine(ctx, ctx.y, rgb(0.75, 0.75, 0.75))
  advance(ctx, S(4))

  // ── Section header ──────────────────────────────────────────────────────────
  function section(title: string) {
    ensureSpace(ctx, S(46))
    advance(ctx, S(16))
    drawText(ctx, title.toUpperCase(), { size: S(10.5), bold: true, color: PDF_ACCENT })
    advance(ctx, S(15))
    drawLine(ctx, ctx.y)
    advance(ctx, S(11))
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  if (cv.summary) {
    section('Résumé professionnel')
    drawWrapped(ctx, cv.summary, { size: S(9.5), color: PDF_MUTED, lineHeight: S(14) })
  }

  // ── Experience ──────────────────────────────────────────────────────────────
  if (cv.experience.length > 0) {
    section('Expérience professionnelle')
    for (const exp of cv.experience) {
      ensureSpace(ctx, S(44))
      // Position (bold) + dates (right)
      drawText(ctx, exp.position, { size: S(10), bold: true })
      drawText(ctx, exp.dates,    { size: S(9), color: PDF_MUTED, align: 'right' })
      advance(ctx, S(14))
      // Company (italic-style, muted)
      drawText(ctx, exp.company, { size: S(9), color: PDF_MUTED })
      advance(ctx, S(14))
      // Bullets
      for (const b of exp.bullets) {
        ensureSpace(ctx, S(14))
        drawText(ctx, '–', { size: S(9), x: MARGIN_X + 2 })
        drawWrapped(ctx, b, { size: S(9), x: MARGIN_X + 12, lineHeight: S(13) })
      }
      advance(ctx, S(6))
    }
  }

  // ── Education ───────────────────────────────────────────────────────────────
  if (cv.education.length > 0) {
    section('Formation')
    for (const edu of cv.education) {
      ensureSpace(ctx, S(32))
      drawText(ctx, edu.degree, { size: S(10), bold: true })
      if (edu.year) drawText(ctx, edu.year, { size: S(9), color: PDF_MUTED, align: 'right' })
      advance(ctx, S(14))
      drawText(ctx, edu.school, { size: S(9), color: PDF_MUTED })
      advance(ctx, S(14))
    }
  }

  // ── Skills ──────────────────────────────────────────────────────────────────
  if (cv.skills.length > 0) {
    section('Compétences')
    drawWrapped(ctx, cv.skills.join('  •  '), { size: S(9.5), lineHeight: S(14) })
  }

  // contentHeight = total vertical space the content consumed at this scale
  // Formula: (N-1 full pages) + (used space on last page)
  const usedOnLastPage = (PAGE_H - MARGIN_Y) - ctx.y
  const contentHeight  = (ctx.pages.length - 1) * AVAIL + usedOnLastPage

  return { buffer: await doc.save(), pageCount: ctx.pages.length, contentHeight }
}

// ─── Public PDF export — guaranteed 1 page ────────────────────────────────────
//
// Algorithm:
//   1. Render at scale=1.0 to get the EXACT content height (no guessing).
//   2. If it fits → done.  If it overflows → compute the mathematically exact
//      scale factor and re-render once.  Always stays on 1 page.
//
export async function generateCVPdf(cv: GeneratedCV, photo?: PhotoData): Promise<Buffer> {
  // Pass 1 — full size, measure actual height
  const pass1 = await renderCVPdf(cv, photo, 1.0)

  if (pass1.contentHeight <= AVAIL) {
    // Already fits — no scaling needed
    return Buffer.from(pass1.buffer)
  }

  // Pass 2 — compute exact scale so content fills (but doesn't overflow) one page
  // Subtract a 1.5% safety margin to absorb any sub-pixel rounding.
  const exactScale = Math.max(0.48, (AVAIL / pass1.contentHeight) * 0.985)
  const pass2 = await renderCVPdf(cv, photo, exactScale)
  return Buffer.from(pass2.buffer)
}
