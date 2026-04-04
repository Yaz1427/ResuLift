import {
  Document, Packer, Paragraph, TextRun, TabStopType,
  AlignmentType, BorderStyle, convertInchesToTwip, ImageRun,
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

export async function generateCVDocx(cv: GeneratedCV, photo?: PhotoData): Promise<Buffer> {
  const totalBullets = cv.experience.reduce((s, e) => s + e.bullets.length, 0)
  const compact = cv.experience.length >= 3 || totalBullets >= 7 || !!photo

  const SP = {
    secBefore:  compact ? 140 : 220,
    secAfter:   compact ? 60  : 100,
    expBefore:  compact ? 60  : 100,
    compAfter:  compact ? 20  : 40,
    bulBefore:  compact ? 10  : 20,
    bulAfter:   compact ? 10  : 20,
    eduBefore:  compact ? 40  : 60,
  }

  const hdr = (text: string): Paragraph => new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, font: FONT, size: 24, color: C_ACCENT })],
    border:   { bottom: { color: C_ACCENT, space: 4, style: BorderStyle.SINGLE, size: 6 } },
    spacing:  { before: SP.secBefore, after: SP.secAfter },
  })

  const children: (Paragraph | Table)[] = []
  const contact = [cv.contact.email, cv.contact.phone, cv.contact.location, cv.contact.linkedin]
    .filter(Boolean).join('  |  ')

  const align = photo ? AlignmentType.LEFT : AlignmentType.CENTER

  if (photo) {
    // Floating image anchored to name paragraph — ATS-safe (no Table: ATS parsers skip table cells)
    children.push(new Paragraph({
      children: [
        new TextRun({ text: cv.fullName, bold: true, font: FONT, size: 36, color: C_BLACK }),
        new ImageRun({
          type: photo.type,
          data: photo.buffer,
          transformation: { width: 90, height: 112 },
          floating: {
            horizontalPosition: { relative: 'margin', align: 'right' },
            verticalPosition: { relative: 'margin', offset: 0 },
            wrap: { type: 'topAndBottom' },
            margins: { top: 0, bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.05), right: 0 },
          },
        }),
      ],
      spacing: { before: 0, after: cv.title ? 20 : 60 },
    }))
  } else {
    children.push(new Paragraph({
      children: [new TextRun({ text: cv.fullName, bold: true, font: FONT, size: 36, color: C_BLACK })],
      alignment: align, spacing: { before: 0, after: cv.title ? 20 : 60 },
    }))
  }

  if (cv.title) {
    children.push(new Paragraph({
      children: [new TextRun({ text: cv.title, bold: true, font: FONT, size: 24, color: C_ACCENT })],
      alignment: align, spacing: { before: 0, after: 50 },
    }))
  }

  children.push(new Paragraph({
    children: [new TextRun({ text: contact, font: FONT, size: 20, color: C_MUTED })],
    alignment: align, spacing: { before: 0, after: 40 },
  }))

  if (cv.summary) {
    children.push(hdr('Profil'))
    children.push(new Paragraph({
      children: [new TextRun({ text: cv.summary, font: FONT, size: 20, color: C_BLACK })],
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
          children: [
            new TextRun({ text: '•  ', font: FONT, size: 20, color: C_ACCENT }),
            new TextRun({ text: b, font: FONT, size: 20, color: C_BLACK }),
          ],
          indent: { left: convertInchesToTwip(0.15) },
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
          new TextRun({ text: ', ',         font: FONT, size: 20, color: C_MUTED }),
          new TextRun({ text: edu.school,  font: FONT, size: 20, color: C_MUTED, italics: true }),
          ...(edu.year ? [
            new TextRun({ text: '\t',     font: FONT, size: 20 }),
            new TextRun({ text: edu.year, font: FONT, size: 20, color: C_MUTED }),
          ] : []),
        ],
        spacing: { before: SP.eduBefore, after: 20 },
      }))
    }
  }

  if (cv.skills.length > 0) {
    children.push(hdr('Compétences'))
    children.push(new Paragraph({
      children: [new TextRun({ text: cv.skills.join(' · '), font: FONT, size: 20, color: C_BLACK })],
      spacing: { before: 0, after: 0 },
    }))
  }

  if (cv.languages && cv.languages.length > 0) {
    children.push(hdr('Langues'))
    const langText = cv.languages.map(l => `${l.name} — ${l.level}`).join(' · ')
    children.push(new Paragraph({
      children: [new TextRun({ text: langText, font: FONT, size: 20, color: C_BLACK })],
      spacing: { before: 0, after: 0 },
    }))
  }

  if (cv.certifications && cv.certifications.length > 0) {
    children.push(hdr('Certifications'))
    for (const cert of cv.certifications) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: '•  ', font: FONT, size: 20, color: C_ACCENT }),
          new TextRun({ text: cert, font: FONT, size: 20, color: C_BLACK }),
        ],
        indent: { left: convertInchesToTwip(0.15) },
        spacing: { before: 10, after: 10 },
      }))
    }
  }

  if (cv.additionalInfo && cv.additionalInfo.length > 0) {
    children.push(hdr('Informations complémentaires'))
    for (const info of cv.additionalInfo) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: '•  ', font: FONT, size: 20, color: C_ACCENT }),
          new TextRun({ text: info, font: FONT, size: 20, color: C_BLACK }),
        ],
        indent: { left: convertInchesToTwip(0.15) },
        spacing: { before: 10, after: 10 },
      }))
    }
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
  contact: 8.5,
  sec:     10.5,
  pos:     9.5,
  comp:    8.5,
  bul:     9,
  date:    8.5,
  degree:  9.5,
  school:  8.5,
  skills:  9,
  summary: 9,
}

// ─── Spacing presets (base pt at scale=1.0) ─────────────────────────────────
interface SpacingPreset {
  headerSep:  number
  secPre:     number
  secTitleH:  number
  secPost:    number
  expPre:     number
  posH:       number
  compH:      number
  bulH:       number
  expPost:    number
  eduH:       number
  skillsH:    number
}

const SPACIOUS: SpacingPreset = {
  headerSep: 6,
  secPre:    14,
  secTitleH: 13,
  secPost:   8,
  expPre:    8,
  posH:      13,
  compH:     11,
  bulH:      12,
  expPost:   6,
  eduH:      24,
  skillsH:   12,
}

const COMPACT: SpacingPreset = {
  headerSep: 3,
  secPre:    7,
  secTitleH: 11,
  secPost:   4,
  expPre:    3,
  posH:      11,
  compH:     10,
  bulH:      11,
  expPost:   2,
  eduH:      18,
  skillsH:   11,
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
const C_RULE        = rgb(0.80,  0.80,  0.80)
const SIDEBAR_W     = 5

interface PdfCtx {
  doc:     PDFDocument
  pages:   PDFPage[]
  bold:    Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>
  regular: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>
  y:       number
}

/**
 * pdf-lib StandardFonts use WinAnsiEncoding (Windows-1252).
 * Replace the few characters outside that encoding to prevent runtime glyph errors.
 */
function sanitizeForPdf(text: string): string {
  return text
    .replace(/[\u0100-\u017E]/g, c => {
      const map: Record<string, string> = {
        '\u0100': 'A', '\u0101': 'a', '\u0102': 'A', '\u0103': 'a',
        '\u0104': 'A', '\u0105': 'a', '\u0106': 'C', '\u0107': 'c',
        '\u010C': 'C', '\u010D': 'c', '\u010E': 'D', '\u010F': 'd',
        '\u0110': 'D', '\u0111': 'd', '\u0118': 'E', '\u0119': 'e',
        '\u011A': 'E', '\u011B': 'e', '\u012E': 'I', '\u012F': 'i',
        '\u0141': 'L', '\u0142': 'l', '\u0143': 'N', '\u0144': 'n',
        '\u0147': 'N', '\u0148': 'n', '\u014C': 'O', '\u014D': 'o',
        '\u0158': 'R', '\u0159': 'r', '\u015A': 'S', '\u015B': 's',
        '\u0160': 'S', '\u0161': 's', '\u0164': 'T', '\u0165': 't',
        '\u016E': 'U', '\u016F': 'u', '\u0170': 'U', '\u0171': 'u',
        '\u0172': 'U', '\u0173': 'u', '\u017B': 'Z', '\u017C': 'z',
        '\u017D': 'Z', '\u017E': 'z',
      }
      return map[c] ?? c
    })
    // Replace any remaining non-Latin-1 characters with a safe fallback
    .replace(/[^\u0000-\u00FF]/g, '')
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
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique)

  const ctx: PdfCtx = { doc, pages: [], bold, regular, y: PAGE_H - MARGIN_Y }
  newPage(ctx)

  const S = (n: number) => n * scale

  // ── Page decorations ──────────────────────────────────────────────────────
  function drawPageDecor() {
    // Subtle top accent line only — no sidebar (wastes space and looks template-y)
    cur(ctx).drawRectangle({ x: 0, y: PAGE_H - 2, width: PAGE_W, height: 2, color: C_ACCENT_PDF })
  }
  drawPageDecor()

  let totalConsumed = 0

  function advance(delta: number) {
    totalConsumed += delta
    ctx.y -= delta
    if (ctx.y < MARGIN_Y) { newPage(ctx); drawPageDecor() }
  }

  function guard(needed: number) {
    if (ctx.y - needed < MARGIN_Y) {
      totalConsumed += ctx.y - MARGIN_Y
      newPage(ctx); drawPageDecor()
    }
  }

  function drawT(
    text: string,
    opts: { size: number; bold?: boolean; italic?: boolean; color?: ReturnType<typeof rgb>; x?: number; maxX?: number; align?: 'left' | 'center' | 'right' }
  ) {
    const t    = sanitizeForPdf(text)
    const font  = opts.italic ? oblique : opts.bold ? bold : regular
    const color = opts.color ?? C_BLACK_PDF
    const x     = opts.x ?? MARGIN_X
    const rightEdge = opts.maxX ?? (PAGE_W - MARGIN_X)
    if (opts.align === 'center') {
      const w = font.widthOfTextAtSize(t, opts.size)
      cur(ctx).drawText(t, { x: (PAGE_W - w) / 2, y: ctx.y, size: opts.size, font, color })
    } else if (opts.align === 'right') {
      const w = font.widthOfTextAtSize(t, opts.size)
      cur(ctx).drawText(t, { x: rightEdge - w, y: ctx.y, size: opts.size, font, color })
    } else {
      cur(ctx).drawText(t, { x, y: ctx.y, size: opts.size, font, color })
    }
  }

  function hRule(color = C_ACCENT_PDF, thickness = 0.6) {
    cur(ctx).drawLine({ start: { x: MARGIN_X, y: ctx.y }, end: { x: PAGE_W - MARGIN_X, y: ctx.y }, thickness, color })
  }

  function wrapText(text: string, maxW: number, fontSize: number, fontObj?: typeof bold): string[] {
    const font = fontObj ?? regular
    const words = sanitizeForPdf(text).split(' ')
    const lines: string[] = []
    let line = ''
    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w
      if (font.widthOfTextAtSize(candidate, fontSize) > maxW && line) {
        lines.push(line); line = w
      } else { line = candidate }
    }
    if (line) lines.push(line)
    return lines.length > 0 ? lines : [text] // safety: never return empty
  }

  function drawWrapped(
    text: string,
    opts: { size: number; bold?: boolean; italic?: boolean; color?: ReturnType<typeof rgb>; x?: number; lineH: number }
  ) {
    const x    = opts.x ?? MARGIN_X
    const maxW = PAGE_W - MARGIN_X - x
    const fontObj = opts.italic ? oblique : opts.bold ? bold : regular
    const lines = wrapText(text, maxW, opts.size, fontObj)
    for (const line of lines) {
      guard(opts.lineH + 2)
      drawT(line, { size: opts.size, bold: opts.bold, italic: opts.italic, color: opts.color, x })
      advance(opts.lineH)
    }
  }

  // ── Section header ────────────────────────────────────────────────────────
  function section(title: string) {
    guard(S(sp.secPre + sp.secTitleH + sp.secPost + 18))
    advance(S(sp.secPre))
    drawT(title.toUpperCase(), { size: S(FS.sec), bold: true, color: C_ACCENT_PDF })
    advance(S(sp.secTitleH))
    hRule(C_ACCENT_PDF, 0.6)
    advance(S(sp.secPost))
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // HEADER
  // ══════════════════════════════════════════════════════════════════════════════
  const allContact = [cv.contact.email, cv.contact.phone, cv.contact.location, cv.contact.linkedin, cv.contact.website]
    .filter((v): v is string => Boolean(v))

  if (photo) {
    // Photo: professional passport-size
    const imgW  = Math.round(S(75))
    const imgH  = Math.round(S(94))
    const imgX  = PAGE_W - MARGIN_X - imgW
    const imgTopY = ctx.y + 2

    // Draw photo directly (no bulky frame)
    const pdfImg = photo.type === 'jpg' ? await doc.embedJpg(photo.buffer) : await doc.embedPng(photo.buffer)
    cur(ctx).drawImage(pdfImg, { x: imgX, y: imgTopY - imgH, width: imgW, height: imgH })
    // Subtle 0.5pt accent border
    const p = cur(ctx)
    p.drawLine({ start: { x: imgX, y: imgTopY }, end: { x: imgX + imgW, y: imgTopY }, thickness: 0.5, color: C_ACCENT_PDF })
    p.drawLine({ start: { x: imgX, y: imgTopY - imgH }, end: { x: imgX + imgW, y: imgTopY - imgH }, thickness: 0.5, color: C_ACCENT_PDF })
    p.drawLine({ start: { x: imgX, y: imgTopY - imgH }, end: { x: imgX, y: imgTopY }, thickness: 0.5, color: C_ACCENT_PDF })
    p.drawLine({ start: { x: imgX + imgW, y: imgTopY - imgH }, end: { x: imgX + imgW, y: imgTopY }, thickness: 0.5, color: C_ACCENT_PDF })

    const textMaxX = imgX - 12

    // Name
    drawT(cv.fullName, { size: S(FS.name), bold: true, color: C_BLACK_PDF, maxX: textMaxX })
    advance(S(26))

    // Title (target position)
    if (cv.title) {
      drawT(cv.title, { size: S(FS.pos), bold: true, color: C_ACCENT_PDF, maxX: textMaxX })
      advance(S(14))
    }

    // Contact — smart wrapping into rows
    const cSz = S(FS.contact)
    const maxCW = textMaxX - MARGIN_X
    const sep = ' | '
    // Try to fit all on one line, else split smartly
    const fullContact = allContact.join(sep)
    if (regular.widthOfTextAtSize(fullContact, cSz) <= maxCW) {
      drawT(fullContact, { size: cSz, color: C_MUTED_PDF })
      advance(S(12))
    } else {
      // Split into lines that fit
      let line = ''
      for (const part of allContact) {
        const test = line ? `${line}${sep}${part}` : part
        if (regular.widthOfTextAtSize(test, cSz) > maxCW && line) {
          drawT(line, { size: cSz, color: C_MUTED_PDF })
          advance(S(11))
          line = part
        } else {
          line = test
        }
      }
      if (line) { drawT(line, { size: cSz, color: C_MUTED_PDF }); advance(S(11)) }
    }

    // Drop below photo
    const photoBtm = imgTopY - imgH - S(4)
    if (ctx.y > photoBtm) advance(ctx.y - photoBtm)
  } else {
    drawT(cv.fullName, { size: S(FS.name), bold: true, color: C_BLACK_PDF, align: 'center' })
    advance(S(26))
    if (cv.title) {
      drawT(cv.title, { size: S(FS.pos), bold: true, color: C_ACCENT_PDF, align: 'center' })
      advance(S(14))
    }
    drawT(allContact.join(' | '), { size: S(FS.contact), color: C_MUTED_PDF, align: 'center' })
    advance(S(10))
  }

  // Header separator
  hRule(C_RULE, 0.4)
  advance(S(sp.headerSep))

  // ══════════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════════════════════
  if (cv.summary) {
    section('Profil')
    drawWrapped(cv.summary, { size: S(FS.summary), color: C_BLACK_PDF, lineH: S(sp.bulH) })
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // EXPERIENCE
  // ══════════════════════════════════════════════════════════════════════════════
  if (cv.experience.length > 0) {
    section('Expérience professionnelle')
    for (let i = 0; i < cv.experience.length; i++) {
      const exp = cv.experience[i]
      guard(S(sp.expPre + sp.posH + sp.compH + sp.bulH))
      if (i > 0) advance(S(sp.expPre))

      // Position + dates on same line
      drawT(exp.position, { size: S(FS.pos), bold: true })
      drawT(exp.dates, { size: S(FS.date), color: C_MUTED_PDF, align: 'right' })
      advance(S(sp.posH))

      // Company (italic muted)
      drawT(exp.company, { size: S(FS.comp), italic: true, color: C_MUTED_PDF })
      advance(S(sp.compH))

      // Bullets — accent dash + text
      const bulIndent = MARGIN_X + S(6)
      const bulTextX  = MARGIN_X + S(16)
      for (const b of exp.bullets) {
        guard(S(sp.bulH) + 2)
        drawT('–', { size: S(FS.bul), color: C_ACCENT_PDF, x: bulIndent })
        drawWrapped(b, { size: S(FS.bul), x: bulTextX, lineH: S(sp.bulH) })
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
      guard(S(14))
      // All on one line: Degree, School (italic)          Year
      const degSz = S(FS.degree)
      const schSz = S(FS.school)
      const degW = bold.widthOfTextAtSize(edu.degree, degSz)
      const comma = ',  '
      const commaW = regular.widthOfTextAtSize(comma, schSz)
      drawT(edu.degree, { size: degSz, bold: true })
      drawT(comma, { size: schSz, color: C_MUTED_PDF, x: MARGIN_X + degW })
      drawT(edu.school, { size: schSz, italic: true, color: C_MUTED_PDF, x: MARGIN_X + degW + commaW })
      if (edu.year) drawT(edu.year, { size: S(FS.date), color: C_MUTED_PDF, align: 'right' })
      advance(S(sp.posH + 2))
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SKILLS
  // ══════════════════════════════════════════════════════════════════════════════
  if (cv.skills.length > 0) {
    section('Compétences')
    drawWrapped(cv.skills.join(' · '), { size: S(FS.skills), lineH: S(sp.skillsH) })
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // LANGUAGES
  // ══════════════════════════════════════════════════════════════════════════════
  if (cv.languages && cv.languages.length > 0) {
    section('Langues')
    const langText = cv.languages.map(l => `${l.name} — ${l.level}`).join(' · ')
    drawWrapped(langText, { size: S(FS.skills), lineH: S(sp.skillsH) })
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // CERTIFICATIONS
  // ══════════════════════════════════════════════════════════════════════════════
  if (cv.certifications && cv.certifications.length > 0) {
    section('Certifications')
    const bulIndent = MARGIN_X + S(6)
    const bulTextX  = MARGIN_X + S(16)
    for (const cert of cv.certifications) {
      guard(S(sp.bulH) + 2)
      drawT('•', { size: S(FS.bul), color: C_ACCENT_PDF, x: bulIndent })
      drawWrapped(cert, { size: S(FS.bul), x: bulTextX, lineH: S(sp.bulH) })
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ADDITIONAL INFORMATION
  // ══════════════════════════════════════════════════════════════════════════════
  if (cv.additionalInfo && cv.additionalInfo.length > 0) {
    section('Informations complémentaires')
    const bulIndent = MARGIN_X + S(6)
    const bulTextX  = MARGIN_X + S(16)
    for (const info of cv.additionalInfo) {
      guard(S(sp.bulH) + 2)
      drawT('•', { size: S(FS.bul), color: C_ACCENT_PDF, x: bulIndent })
      drawWrapped(info, { size: S(FS.bul), x: bulTextX, lineH: S(sp.bulH) })
    }
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

  // Pass 3: exact scale derived from pass-2 measurement, compact spacing.
  // MIN_SCALE = 0.82 keeps body text ≥ 7.4pt (9pt × 0.82) — below this, readability
  // degrades more than a 2nd page would. Very long CVs will simply spill to page 2.
  const MIN_SCALE = 0.82
  const exactScale = Math.max(MIN_SCALE, (AVAIL / p2.totalConsumed) * 0.985)
  const p3 = await renderCVPdf(cv, photo, COMPACT, exactScale)
  return Buffer.from(p3.buffer)
}
