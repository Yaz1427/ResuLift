import {
  Document, Packer, Paragraph, TextRun, TabStopType, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, convertInchesToTwip, ImageRun, WidthType, VerticalAlign,
} from 'docx'
import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib'
import type { GeneratedCV } from '@/types/analysis'

// ─── Photo ────────────────────────────────────────────────────────────────────

export interface PhotoData {
  buffer: Buffer
  type: 'jpg' | 'png'
}

/** null = unsupported format (WEBP, GIF, BMP…) */
export function detectPhotoType(buf: Buffer): 'jpg' | 'png' | null {
  if (buf[0] === 0xFF && buf[1] === 0xD8)                                return 'jpg' // JPEG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E)            return 'png' // PNG
  return null
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCX EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

const FONT     = 'Calibri'
const C_BLACK  = '111111'
const C_ACCENT = '5B21B6'
const C_MUTED  = '555555'
const TAB_R    = [{ type: TabStopType.RIGHT, position: convertInchesToTwip(6.5) }]
const NB       = { style: BorderStyle.NONE, size: 0, color: 'auto' }
const NO_BORD  = { top: NB, bottom: NB, left: NB, right: NB }

export async function generateCVDocx(cv: GeneratedCV, photo?: PhotoData): Promise<Buffer> {
  const totalBullets = cv.experience.reduce((s, e) => s + e.bullets.length, 0)
  const compact = cv.experience.length >= 3 || totalBullets >= 7 || !!photo

  const SP = {
    secBefore:  compact ? 180 : 260,
    secAfter:   compact ? 80  : 140,
    expBefore:  compact ? 80  : 120,
    compAfter:  compact ? 30  : 60,
    bulBefore:  compact ? 20  : 40,
    bulAfter:   compact ? 20  : 40,
    eduBefore:  compact ? 60  : 80,
  }

  const hdr = (text: string): Paragraph => new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, font: FONT, size: 24, color: C_ACCENT })],
    border:   { bottom: { color: C_ACCENT, space: 4, style: BorderStyle.SINGLE, size: 6 } },
    spacing:  { before: SP.secBefore, after: SP.secAfter },
  })

  const children: (Paragraph | Table)[] = []
  const contact = [cv.contact.email, cv.contact.phone, cv.contact.location, cv.contact.linkedin]
    .filter(Boolean).join('  |  ')

  if (photo) {
    children.push(new Table({
      width:   { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 },
                 left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
      rows: [new TableRow({ children: [
        new TableCell({
          width: { size: 77, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER, borders: NO_BORD,
          children: [
            new Paragraph({ children: [new TextRun({ text: cv.fullName, bold: true, font: FONT, size: 36, color: C_BLACK })], spacing: { before: 0, after: 50 } }),
            new Paragraph({ children: [new TextRun({ text: contact, font: FONT, size: 19, color: C_MUTED })], spacing: { before: 0, after: 0 } }),
          ],
        }),
        new TableCell({
          width: { size: 23, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.TOP, borders: NO_BORD,
          children: [new Paragraph({
            children: [new ImageRun({ type: photo.type, data: photo.buffer, transformation: { width: 90, height: 112 } })],
            alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 0 },
          })],
        }),
      ]})],
    }))
  } else {
    children.push(new Paragraph({
      children: [new TextRun({ text: cv.fullName, bold: true, font: FONT, size: 36, color: C_BLACK })],
      alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 },
    }))
    children.push(new Paragraph({
      children: [new TextRun({ text: contact, font: FONT, size: 20, color: C_MUTED })],
      alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 },
    }))
  }

  if (cv.summary) {
    children.push(hdr('Résumé professionnel'))
    children.push(new Paragraph({
      children: [new TextRun({ text: cv.summary, font: FONT, size: 20, color: C_MUTED })],
      spacing: { before: 0, after: 0 },
    }))
  }

  if (cv.experience.length > 0) {
    children.push(hdr('Expérience professionnelle'))
    for (const exp of cv.experience) {
      children.push(new Paragraph({
        tabStops: TAB_R,
        children: [
          new TextRun({ text: exp.position, bold: true, font: FONT, size: 20, color: C_BLACK }),
          new TextRun({ text: '\t',          font: FONT, size: 20 }),
          new TextRun({ text: exp.dates,     font: FONT, size: 20, color: C_MUTED }),
        ],
        spacing: { before: SP.expBefore, after: 20 },
      }))
      children.push(new Paragraph({
        children: [new TextRun({ text: exp.company, font: FONT, size: 20, color: C_MUTED, italics: true })],
        spacing: { before: 0, after: SP.compAfter },
      }))
      for (const b of exp.bullets) {
        children.push(new Paragraph({
          children: [new TextRun({ text: b, font: FONT, size: 20, color: C_BLACK })],
          bullet: { level: 0 },
          spacing: { before: SP.bulBefore, after: SP.bulAfter },
        }))
      }
    }
  }

  if (cv.education.length > 0) {
    children.push(hdr('Formation'))
    for (const edu of cv.education) {
      children.push(new Paragraph({
        tabStops: TAB_R,
        children: [
          new TextRun({ text: edu.degree, bold: true, font: FONT, size: 20, color: C_BLACK }),
          new TextRun({ text: ' — ',       font: FONT, size: 20, color: C_MUTED }),
          new TextRun({ text: edu.school,  font: FONT, size: 20, color: C_MUTED }),
          ...(edu.year ? [
            new TextRun({ text: '\t',     font: FONT, size: 20 }),
            new TextRun({ text: edu.year, font: FONT, size: 20, color: C_MUTED }),
          ] : []),
        ],
        spacing: { before: SP.eduBefore, after: 30 },
      }))
    }
  }

  if (cv.skills.length > 0) {
    children.push(hdr('Compétences'))
    children.push(new Paragraph({
      children: [new TextRun({ text: cv.skills.join('  •  '), font: FONT, size: 20, color: C_BLACK })],
      spacing: { before: 0, after: 0 },
    }))
  }

  if (cv.languages && cv.languages.length > 0) {
    children.push(hdr('Langues'))
    const langText = cv.languages.map(l => `${l.name} — ${l.level}`).join('  •  ')
    children.push(new Paragraph({
      children: [new TextRun({ text: langText, font: FONT, size: 20, color: C_BLACK })],
      spacing: { before: 0, after: 0 },
    }))
  }

  const margin = compact ? 0.6 : 0.75
  const doc = new Document({
    sections: [{
      properties: { page: { margin: {
        top:    convertInchesToTwip(margin),
        right:  convertInchesToTwip(margin),
        bottom: convertInchesToTwip(margin),
        left:   convertInchesToTwip(margin),
      }}},
      children,
    }],
  })
  return Buffer.from(await Packer.toBuffer(doc))
}

// ═══════════════════════════════════════════════════════════════════════════════
// PDF EXPORT — 3-pass adaptive algorithm
// ═══════════════════════════════════════════════════════════════════════════════
//
// Pass 1 → scale=1.0, SPACIOUS spacing: measure totalConsumed
//           If content fits (totalConsumed ≤ AVAIL) → return immediately.
//           Best case: full-size text, comfortable spacing.
//
// Pass 2 → scale=1.0, COMPACT spacing: measure totalConsumed
//           If content fits → return. Full-size text, tighter spacing.
//
// Pass 3 → exactScale = AVAIL / pass2.totalConsumed, COMPACT spacing.
//           Mathematically guaranteed to fit on 1 page.
//
// ─── Why totalConsumed is the right metric ─────────────────────────────────────
//
// totalConsumed = Σ advance() calls = pure vertical distance consumed,
// independent of page breaks. When scale = s, every advance becomes
// advance*s, so totalConsumed_new = totalConsumed * s.
// Setting s = AVAIL / totalConsumed gives totalConsumed_new = AVAIL → 1 page.
// Text wrapping at smaller scale only gets *better* (fewer wraps), so
// actual height ≤ AVAIL. No overflow possible.
//
// ─── Font sizes (base at scale=1.0) ────────────────────────────────────────────
const FS = {
  name:    22,
  contact: 9.5,
  sec:     11,
  pos:     10.5,
  comp:    9.5,
  bul:     9.5,
  date:    9,
  degree:  10.5,
  school:  9.5,
  skills:  9.5,
}

// ─── Spacing presets (base pt at scale=1.0) ─────────────────────────────────
interface SpacingPreset {
  headerSep:  number  // gap between header separator line and first section
  secPre:     number  // space above section title
  secTitleH:  number  // height consumed by section title + line
  secPost:    number  // gap between section line and first content ← KEY FIX
  expPre:     number  // gap before each experience block
  posH:       number  // height of position line (advance after drawing)
  compH:      number  // height of company line
  bulH:       number  // height of each bullet line
  expPost:    number  // gap after last bullet of an experience
  eduH:       number  // height of each education row
  skillsH:    number  // height of skills line
}

const SPACIOUS: SpacingPreset = {
  headerSep: 8,
  secPre:    16,
  secTitleH: 14,
  secPost:   10,
  expPre:    10,
  posH:      14,
  compH:     12,
  bulH:      13,
  expPost:   8,
  eduH:      26,
  skillsH:   14,
}

const COMPACT: SpacingPreset = {
  headerSep: 5,
  secPre:    10,
  secTitleH: 12,
  secPost:   7,
  expPre:    6,
  posH:      12,
  compH:     11,
  bulH:      12,
  expPost:   4,
  eduH:      22,
  skillsH:   12,
}

// ─── Page geometry ───────────────────────────────────────────────────────────
const PAGE_W   = 595.28
const PAGE_H   = 841.89
const MARGIN_X = 50
const MARGIN_Y = 40

/** Usable height per page (pt) */
const AVAIL = PAGE_H - 2 * MARGIN_Y   // ≈ 753.89

const C_ACCENT_PDF  = rgb(0.357, 0.129, 0.714)
const C_BLACK_PDF   = rgb(0.067, 0.067, 0.067)
const C_MUTED_PDF   = rgb(0.35,  0.35,  0.35)
const C_LIGHT_PDF   = rgb(0.92,  0.92,  0.92)
const C_RULE        = rgb(0.78,  0.78,  0.78)
const SIDEBAR_W     = 4

interface PdfCtx {
  doc:     PDFDocument
  pages:   PDFPage[]
  bold:    Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>
  regular: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>
  y:       number
}

function newPage(ctx: PdfCtx): PDFPage {
  const p = ctx.doc.addPage([PAGE_W, PAGE_H])
  ctx.pages.push(p)
  ctx.y = PAGE_H - MARGIN_Y
  return p
}

function cur(ctx: PdfCtx) { return ctx.pages[ctx.pages.length - 1] }

// ─── Renderer ────────────────────────────────────────────────────────────────

async function renderCVPdf(
  cv: GeneratedCV,
  photo: PhotoData | undefined,
  sp: SpacingPreset,
  scale: number,
): Promise<{ buffer: Uint8Array; totalConsumed: number; pageCount: number }> {

  const doc     = await PDFDocument.create()
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  const ctx: PdfCtx = { doc, pages: [], bold, regular, y: PAGE_H - MARGIN_Y }
  newPage(ctx)

  /** Scale a base value */
  const S = (n: number) => n * scale

  // ── Page decorations (drawn on first page) ────────────────────────────────
  // Accent sidebar on the left
  cur(ctx).drawRectangle({
    x: 0, y: 0, width: SIDEBAR_W, height: PAGE_H,
    color: C_ACCENT_PDF,
  })
  // Thin accent line at the very top
  cur(ctx).drawRectangle({
    x: 0, y: PAGE_H - 2, width: PAGE_W, height: 2,
    color: C_ACCENT_PDF,
  })

  let totalConsumed = 0

  function advance(delta: number) {
    totalConsumed += delta
    ctx.y -= delta
    if (ctx.y < MARGIN_Y) {
      newPage(ctx)
      // Redraw sidebar on new pages
      cur(ctx).drawRectangle({ x: 0, y: 0, width: SIDEBAR_W, height: PAGE_H, color: C_ACCENT_PDF })
    }
  }

  function guard(needed: number) {
    if (ctx.y - needed < MARGIN_Y) {
      const waste = ctx.y - MARGIN_Y
      totalConsumed += waste
      newPage(ctx)
      cur(ctx).drawRectangle({ x: 0, y: 0, width: SIDEBAR_W, height: PAGE_H, color: C_ACCENT_PDF })
    }
  }

  function drawT(
    text: string,
    opts: { size: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; maxX?: number; align?: 'left' | 'center' | 'right' }
  ) {
    const font  = opts.bold ? ctx.bold : ctx.regular
    const color = opts.color ?? C_BLACK_PDF
    const x     = opts.x ?? MARGIN_X
    const rightEdge = opts.maxX ?? (PAGE_W - MARGIN_X)
    if (opts.align === 'center') {
      const w = font.widthOfTextAtSize(text, opts.size)
      cur(ctx).drawText(text, { x: (PAGE_W - w) / 2, y: ctx.y, size: opts.size, font, color })
    } else if (opts.align === 'right') {
      const w = font.widthOfTextAtSize(text, opts.size)
      cur(ctx).drawText(text, { x: rightEdge - w, y: ctx.y, size: opts.size, font, color })
    } else {
      cur(ctx).drawText(text, { x, y: ctx.y, size: opts.size, font, color })
    }
  }

  function hRule(color = C_ACCENT_PDF, thickness = 0.75) {
    cur(ctx).drawLine({ start: { x: MARGIN_X, y: ctx.y }, end: { x: PAGE_W - MARGIN_X, y: ctx.y }, thickness, color })
  }

  function wrapText(text: string, maxW: number, fontSize: number, fontType?: 'bold' | 'regular'): string[] {
    const font  = fontType === 'bold' ? bold : regular
    const words = text.split(' ')
    const lines: string[] = []
    let line = ''
    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w
      if (font.widthOfTextAtSize(candidate, fontSize) > maxW && line) {
        lines.push(line)
        line = w
      } else {
        line = candidate
      }
    }
    if (line) lines.push(line)
    return lines
  }

  function drawWrapped(
    text: string,
    opts: { size: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; lineH: number }
  ) {
    const x    = opts.x ?? MARGIN_X
    const maxW = PAGE_W - MARGIN_X - x
    const lines = wrapText(text, maxW, opts.size, opts.bold ? 'bold' : 'regular')
    for (const line of lines) {
      guard(opts.lineH + 2)
      drawT(line, { size: opts.size, bold: opts.bold, color: opts.color, x })
      advance(opts.lineH)
    }
  }

  // ── Section header (accent color + underline) ─────────────────────────────
  function section(title: string) {
    guard(S(sp.secPre) + S(sp.secTitleH) + S(sp.secPost) + S(20))
    advance(S(sp.secPre))
    drawT(title.toUpperCase(), { size: S(FS.sec), bold: true, color: C_ACCENT_PDF })
    advance(S(sp.secTitleH))
    hRule(C_ACCENT_PDF, 0.8)
    advance(S(sp.secPost))
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // HEADER BLOCK
  // ══════════════════════════════════════════════════════════════════════════════
  const contactParts = [cv.contact.email, cv.contact.phone, cv.contact.location, cv.contact.linkedin]
    .filter((v): v is string => Boolean(v))

  if (photo) {
    // Photo dimensions — slightly larger, professional ratio
    const imgW  = Math.round(S(80))
    const imgH  = Math.round(S(100))
    const imgPad = 3  // border padding
    const imgX  = PAGE_W - MARGIN_X - imgW
    const imgTopY = ctx.y + 4

    // Subtle light background behind photo (acts as a "frame")
    cur(ctx).drawRectangle({
      x: imgX - imgPad,
      y: imgTopY - imgH - imgPad,
      width: imgW + imgPad * 2,
      height: imgH + imgPad * 2,
      color: C_LIGHT_PDF,
    })
    // Thin accent border around photo (4 lines)
    const bx = imgX - imgPad - 0.5
    const by = imgTopY - imgH - imgPad - 0.5
    const bw = imgW + imgPad * 2 + 1
    const bh = imgH + imgPad * 2 + 1
    const bThick = 0.75
    const page = cur(ctx)
    page.drawLine({ start: { x: bx, y: by }, end: { x: bx + bw, y: by }, thickness: bThick, color: C_ACCENT_PDF })
    page.drawLine({ start: { x: bx, y: by + bh }, end: { x: bx + bw, y: by + bh }, thickness: bThick, color: C_ACCENT_PDF })
    page.drawLine({ start: { x: bx, y: by }, end: { x: bx, y: by + bh }, thickness: bThick, color: C_ACCENT_PDF })
    page.drawLine({ start: { x: bx + bw, y: by }, end: { x: bx + bw, y: by + bh }, thickness: bThick, color: C_ACCENT_PDF })

    const pdfImg = photo.type === 'jpg' ? await doc.embedJpg(photo.buffer) : await doc.embedPng(photo.buffer)
    cur(ctx).drawImage(pdfImg, { x: imgX, y: imgTopY - imgH, width: imgW, height: imgH })

    // Available width for text (left of photo)
    const textMaxX = imgX - 14

    // Name — large bold, left-aligned
    drawT(cv.fullName, { size: S(FS.name), bold: true, color: C_BLACK_PDF, maxX: textMaxX })
    advance(S(28))

    // Contact info — split into lines if needed
    const cSz   = S(FS.contact)
    const maxCW = textMaxX - MARGIN_X
    const full  = contactParts.join('  |  ')
    if (regular.widthOfTextAtSize(full, cSz) <= maxCW) {
      drawT(full, { size: cSz, color: C_MUTED_PDF })
      advance(S(14))
    } else {
      // Split into two lines
      const mid = Math.ceil(contactParts.length / 2)
      drawT(contactParts.slice(0, mid).join('  |  '), { size: cSz, color: C_MUTED_PDF })
      advance(S(13))
      drawT(contactParts.slice(mid).join('  |  '), { size: cSz, color: C_MUTED_PDF })
      advance(S(13))
    }

    // Website/LinkedIn on separate line if present
    if (cv.contact.website) {
      drawT(cv.contact.website, { size: cSz, color: C_ACCENT_PDF })
      advance(S(13))
    }

    // Ensure we clear the photo area before continuing
    const photoBtm = imgTopY - imgH - imgPad - S(6)
    if (ctx.y > photoBtm) {
      advance(ctx.y - photoBtm)
    }
  } else {
    // No photo — centered layout
    drawT(cv.fullName, { size: S(FS.name), bold: true, color: C_BLACK_PDF, align: 'center' })
    advance(S(28))
    const cSz = S(FS.contact)
    const full = contactParts.join('  |  ')
    drawT(full, { size: cSz, color: C_MUTED_PDF, align: 'center' })
    advance(S(12))
    if (cv.contact.website) {
      drawT(cv.contact.website, { size: cSz, color: C_ACCENT_PDF, align: 'center' })
      advance(S(12))
    }
  }

  // Separator after header
  hRule(C_RULE, 0.5)
  advance(S(sp.headerSep))

  // ══════════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════════════════════
  if (cv.summary) {
    section('Résumé professionnel')
    drawWrapped(cv.summary, { size: S(FS.comp), color: C_MUTED_PDF, lineH: S(sp.bulH) })
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // EXPERIENCE
  // ══════════════════════════════════════════════════════════════════════════════
  if (cv.experience.length > 0) {
    section('Expérience professionnelle')
    for (let i = 0; i < cv.experience.length; i++) {
      const exp = cv.experience[i]
      guard(S(sp.expPre) + S(sp.posH) + S(sp.compH) + S(sp.bulH))
      if (i > 0) advance(S(sp.expPre))

      // Position (bold) + dates (right, muted)
      drawT(exp.position, { size: S(FS.pos), bold: true })
      drawT(exp.dates, { size: S(FS.date), color: C_MUTED_PDF, align: 'right' })
      advance(S(sp.posH))

      // Company (italic-style muted)
      drawT(exp.company, { size: S(FS.comp), color: C_MUTED_PDF })
      advance(S(sp.compH))

      // Bullet points with dash
      for (const b of exp.bullets) {
        guard(S(sp.bulH) + 2)
        drawT('–', { size: S(FS.bul), color: C_ACCENT_PDF, x: MARGIN_X + 4 })
        drawWrapped(b, { size: S(FS.bul), x: MARGIN_X + 16, lineH: S(sp.bulH) })
      }
      advance(S(sp.expPost))
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // EDUCATION
  // ══════════════════════════════════════════════════════════════════════════════
  if (cv.education.length > 0) {
    section('Formation')
    for (const edu of cv.education) {
      guard(S(sp.eduH) + 2)
      drawT(edu.degree, { size: S(FS.degree), bold: true })
      if (edu.year) drawT(edu.year, { size: S(FS.date), color: C_MUTED_PDF, align: 'right' })
      advance(S(sp.posH))
      drawT(edu.school, { size: S(FS.school), color: C_MUTED_PDF })
      advance(S(sp.compH))
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SKILLS
  // ══════════════════════════════════════════════════════════════════════════════
  if (cv.skills.length > 0) {
    section('Compétences')
    drawWrapped(cv.skills.join('  •  '), { size: S(FS.skills), lineH: S(sp.skillsH) })
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // LANGUAGES
  // ══════════════════════════════════════════════════════════════════════════════
  if (cv.languages && cv.languages.length > 0) {
    section('Langues')
    const langText = cv.languages.map(l => `${l.name} — ${l.level}`).join('  •  ')
    drawWrapped(langText, { size: S(FS.skills), lineH: S(sp.skillsH) })
  }

  return { buffer: await doc.save(), totalConsumed, pageCount: ctx.pages.length }
}

// ─── Public entry point ──────────────────────────────────────────────────────

export async function generateCVPdf(cv: GeneratedCV, photo?: PhotoData): Promise<Buffer> {
  // Pass 1: full scale, spacious spacing
  const p1 = await renderCVPdf(cv, photo, SPACIOUS, 1.0)
  if (p1.totalConsumed <= AVAIL) return Buffer.from(p1.buffer)

  // Pass 2: full scale, compact spacing (same font sizes, less whitespace)
  const p2 = await renderCVPdf(cv, photo, COMPACT, 1.0)
  if (p2.totalConsumed <= AVAIL) return Buffer.from(p2.buffer)

  // Pass 3: exact scale derived from pass-2 measurement, compact spacing
  // exactScale × p2.totalConsumed = AVAIL  →  guaranteed 1 page
  const exactScale = (AVAIL / p2.totalConsumed) * 0.985   // 1.5% safety for rounding
  const p3 = await renderCVPdf(cv, photo, COMPACT, exactScale)
  return Buffer.from(p3.buffer)
}
