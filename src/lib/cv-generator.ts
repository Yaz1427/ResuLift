import {
  Document, Packer, Paragraph, TextRun, ImageRun,
  AlignmentType, BorderStyle, TabStopType, convertInchesToTwip,
  TextWrappingType,
} from 'docx'
import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib'
import type { GeneratedCV } from '@/types/analysis'

// ─── Photo ────────────────────────────────────────────────────────────────────

export interface PhotoData {
  buffer: Buffer
  type: 'jpg' | 'png'
}

export function detectPhotoType(buf: Buffer): 'jpg' | 'png' | null {
  if (buf[0] === 0xFF && buf[1] === 0xD8)                     return 'jpg'
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E)  return 'png'
  return null
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCX — Professional Design
// ═══════════════════════════════════════════════════════════════════════════════
//
// Design: Herman Walton reference style.
// Navy blue (#1F4E8C) for name and section headers.
// Black for body text. Gray for muted info (company, dates, contact).
// Clean horizontal separators. Native Word bullets.
//
// Unit notes:
//   docx `size`      = half-points  →  10pt = 20, 11.5pt = 23, 26pt = 52
//   docx spacing     = twips        →  1cm ≈ 567 twip, 1pt ≈ 20 twip
//   convertInchesToTwip(n) = n * 1440
// ═══════════════════════════════════════════════════════════════════════════════

const FONT    = 'Calibri'
const NAVY    = '1F4E8C'   // accent — name and section headers
const BLACK   = '111111'   // body text
const GRAY    = '555555'   // muted — company, dates, contact
const SEP_CLR = '1F4E8C'   // separator line under section headers

// 1cm in twips
const CM = (n: number) => Math.round(n * 567)
// Page content width: A4 (21cm) - 2cm left - 2cm right = 17cm → right tab
const TAB_RIGHT = CM(17)

// ─── Building blocks ──────────────────────────────────────────────────────────

/** Full-width line under the header block (name + contact) */
function headerSep(): Paragraph {
  return new Paragraph({
    spacing: { before: CM(0.15), after: CM(0.2) },
    border:  { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY, space: 0 } },
    children: [],
  })
}

/** Section header: bold caps with letter-spacing + underline */
function sectionHdr(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: CM(0.35), after: CM(0.12) },
    border:  { bottom: { style: BorderStyle.SINGLE, size: 4, color: SEP_CLR, space: 3 } },
    children: [new TextRun({
      text:             text.toUpperCase(),
      font:             FONT,
      size:             23,       // 11.5pt
      bold:             true,
      color:            NAVY,
      characterSpacing: 40,       // subtle letter-spacing
    })],
  })
}

/** Experience row: bold position + right-aligned gray dates */
function expRow(position: string, dates: string, firstInBlock: boolean): Paragraph {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TAB_RIGHT }],
    spacing:  { before: firstInBlock ? CM(0.1) : CM(0.25), after: CM(0.03) },
    children: [
      new TextRun({ text: position, font: FONT, size: 21, bold: true,  color: BLACK }),
      new TextRun({ text: '\t',     font: FONT, size: 21 }),
      new TextRun({ text: dates,    font: FONT, size: 21, bold: false, color: GRAY }),
    ],
  })
}

/** Company name: italic gray */
function companyRow(company: string): Paragraph {
  return new Paragraph({
    spacing: { before: 0, after: CM(0.08) },
    children: [new TextRun({ text: company, font: FONT, size: 21, italics: true, color: GRAY })],
  })
}

/** Bullet point: • character + hanging indent so text wraps neatly */
function bulletRow(text: string): Paragraph {
  return new Paragraph({
    indent:  { left: CM(0.55), hanging: CM(0.3) },
    spacing: { before: CM(0.03), after: CM(0.03) },
    children: [
      new TextRun({ text: '\u2022  ', font: FONT, size: 20, color: NAVY }),
      new TextRun({ text,            font: FONT, size: 20, color: BLACK }),
    ],
  })
}

/** Education row: bold degree — italic school + right-aligned year */
function eduRow(degree: string, school: string, year?: string, first = false): Paragraph {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TAB_RIGHT }],
    spacing:  { before: first ? CM(0.1) : CM(0.15), after: CM(0.03) },
    children: [
      new TextRun({ text: degree,        font: FONT, size: 20, bold: true,   color: BLACK }),
      new TextRun({ text: '  —  ',       font: FONT, size: 20, bold: false,  color: GRAY }),
      new TextRun({ text: school,        font: FONT, size: 20, italics: true, color: GRAY }),
      ...(year ? [
        new TextRun({ text: '\t', font: FONT, size: 20 }),
        new TextRun({ text: year, font: FONT, size: 20, color: GRAY }),
      ] : []),
    ],
  })
}

/** Skill group: "Category : skill · skill · skill" */
function skillGroupRow(category: string, skills: string[]): Paragraph {
  return new Paragraph({
    spacing: { before: CM(0.04), after: CM(0.04) },
    children: [
      new TextRun({ text: `${category} : `, font: FONT, size: 20, bold: true,  color: BLACK }),
      new TextRun({ text: skills.join('  ·  '),  font: FONT, size: 20, bold: false, color: BLACK }),
    ],
  })
}

/** Plain body text paragraph */
function bodyText(text: string, opts?: { italic?: boolean; gray?: boolean; center?: boolean }): Paragraph {
  return new Paragraph({
    alignment: opts?.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing:   { before: 0, after: CM(0.04) },
    children: [new TextRun({
      text,
      font:    FONT,
      size:    20,
      italics: opts?.italic ?? false,
      color:   opts?.gray ? GRAY : BLACK,
    })],
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main DOCX generator
// ═══════════════════════════════════════════════════════════════════════════════

export async function generateCVDocx(cv: GeneratedCV, photo?: PhotoData): Promise<Buffer> {
  const children: Paragraph[] = []

  const contactParts = [cv.contact.email, cv.contact.phone, cv.contact.location, cv.contact.linkedin, cv.contact.website]
    .filter(Boolean) as string[]
  const contactStr = contactParts.join('  |  ')
  const align = photo ? AlignmentType.LEFT : AlignmentType.CENTER

  // ── HEADER ────────────────────────────────────────────────────────────────

  // Name (with optional floating photo anchored here)
  children.push(new Paragraph({
    alignment: align,
    spacing:   { before: 0, after: CV_HALF(cv.title ? 10 : 20) },
    children: [
      new TextRun({
        text:             cv.fullName,
        font:             FONT,
        size:             52,       // 26pt
        bold:             true,
        color:            NAVY,
        characterSpacing: 20,       // 1pt letter-spacing
      }),
      ...(photo ? [new ImageRun({
        type: photo.type,
        data: photo.buffer,
        transformation: { width: 100, height: 122 },   // ≈ 2.65cm × 3.24cm
        floating: {
          horizontalPosition: { relative: 'margin', align: 'right' },
          verticalPosition:   { relative: 'margin', offset: 0 },
          wrap:               { type: TextWrappingType.SQUARE },
          margins:            { top: 0, bottom: CM(0.2), left: CM(0.25), right: 0 },
          allowOverlap:       false,
        },
      })] : []),
    ],
  }))

  // Professional title
  if (cv.title) {
    children.push(new Paragraph({
      alignment: align,
      spacing:   { before: 0, after: 20 },
      children: [new TextRun({ text: cv.title, font: FONT, size: 22, color: GRAY })],
    }))
  }

  // Contact line
  children.push(new Paragraph({
    alignment: align,
    spacing:   { before: 0, after: CM(0.15) },
    children: [new TextRun({ text: contactStr, font: FONT, size: 19, color: GRAY })],
  }))

  // Header separator
  children.push(headerSep())

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  if (cv.summary) {
    children.push(sectionHdr('Profil'))
    children.push(bodyText(cv.summary))
  }

  // ── EXPERIENCE ────────────────────────────────────────────────────────────
  if (cv.experience.length > 0) {
    children.push(sectionHdr('Expérience professionnelle'))
    for (let i = 0; i < cv.experience.length; i++) {
      const exp = cv.experience[i]
      children.push(expRow(exp.position, exp.dates, i === 0))
      children.push(companyRow(exp.company))
      for (const b of exp.bullets) children.push(bulletRow(b))
    }
  }

  // ── EDUCATION ─────────────────────────────────────────────────────────────
  if (cv.education.length > 0) {
    children.push(sectionHdr('Formation'))
    for (let i = 0; i < cv.education.length; i++) {
      const edu = cv.education[i]
      children.push(eduRow(edu.degree, edu.school, edu.year, i === 0))
    }
  }

  // ── SKILLS ────────────────────────────────────────────────────────────────
  const hasGroups = cv.skillGroups && cv.skillGroups.length > 0
  if (hasGroups || cv.skills.length > 0) {
    children.push(sectionHdr('Compétences'))
    if (hasGroups) {
      for (const g of cv.skillGroups!) children.push(skillGroupRow(g.category, g.skills))
    } else {
      children.push(bodyText(cv.skills.join('  ·  ')))
    }
  }

  // ── LANGUAGES ─────────────────────────────────────────────────────────────
  if (cv.languages && cv.languages.length > 0) {
    children.push(sectionHdr('Langues'))
    const langStr = cv.languages.map(l => `${l.name}  —  ${l.level}`).join('  ·  ')
    children.push(bodyText(langStr))
  }

  // ── CERTIFICATIONS ────────────────────────────────────────────────────────
  if (cv.certifications && cv.certifications.length > 0) {
    children.push(sectionHdr('Certifications'))
    for (const c of cv.certifications) children.push(bulletRow(c))
  }

  // ── ADDITIONAL INFO ───────────────────────────────────────────────────────
  if (cv.additionalInfo && cv.additionalInfo.length > 0) {
    children.push(sectionHdr('Informations complémentaires'))
    for (const info of cv.additionalInfo) children.push(bulletRow(info))
  }

  // ── DOCUMENT ──────────────────────────────────────────────────────────────
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top:    CM(1.5),
            bottom: CM(1.2),
            left:   CM(2.0),
            right:  CM(2.0),
          },
        },
      },
      children,
    }],
  })

  return Buffer.from(await Packer.toBuffer(doc))
}

/** Convert a "spacing" value (in half-points) for the `after` property */
function CV_HALF(n: number) { return n }   // identity — just for readability

// ═══════════════════════════════════════════════════════════════════════════════
// PDF EXPORT — 3-pass adaptive algorithm
// ═══════════════════════════════════════════════════════════════════════════════
//
// Pass 1 → scale=1.0, SPACIOUS: measure totalConsumed.
//           If fits (totalConsumed ≤ AVAIL) → return.
// Pass 2 → scale=1.0, COMPACT: measure.  If fits → return.
// Pass 3 → exactScale = max(MIN_SCALE, AVAIL/pass2.total * 0.985), COMPACT.
//
// MIN_SCALE = 0.82 → body text never drops below 7.4pt.
// Very long CVs spill to page 2 rather than becoming unreadable.
//
// Font sizes (base at scale=1.0):
const FS = {
  name:    22,
  title:   10,
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
  headerSep: 7,
  secPre:    14,
  secTitleH: 13,
  secPost:   7,
  expPre:    8,
  posH:      13,
  compH:     11,
  bulH:      12,
  expPost:   5,
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
  compH:     9,
  bulH:      10,
  expPost:   2,
  eduH:      18,
  skillsH:   10,
}

const PAGE_W   = 595.28
const PAGE_H   = 841.89
const MARGIN_X = 50
const MARGIN_Y = 40
const AVAIL    = PAGE_H - 2 * MARGIN_Y   // ≈ 761.89 pt

// PDF colors
const C_NAVY  = rgb(0.122, 0.306, 0.549)  // #1F4E8C
const C_BLACK = rgb(0.067, 0.067, 0.067)
const C_GRAY  = rgb(0.35,  0.35,  0.35)

interface PdfCtx {
  doc:     PDFDocument
  pages:   PDFPage[]
  bold:    Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>
  regular: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>
  oblique: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>
  y:       number
}

/**
 * pdf-lib uses WinAnsiEncoding. Replace characters outside that encoding
 * to prevent runtime glyph errors (e.g. Polish/Czech names).
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
    .replace(/[^\u0000-\u00FF]/g, '')
}

function newPage(ctx: PdfCtx): PDFPage {
  const p = ctx.doc.addPage([PAGE_W, PAGE_H])
  ctx.pages.push(p)
  ctx.y = PAGE_H - MARGIN_Y
  return p
}

function cur(ctx: PdfCtx) { return ctx.pages[ctx.pages.length - 1] }

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

  const ctx: PdfCtx = { doc, pages: [], bold, regular, oblique, y: PAGE_H - MARGIN_Y }
  newPage(ctx)

  const S = (n: number) => n * scale

  let totalConsumed = 0

  function advance(delta: number) {
    totalConsumed += delta
    ctx.y -= delta
    if (ctx.y < MARGIN_Y) { newPage(ctx) }
  }

  function guard(needed: number) {
    if (ctx.y - needed < MARGIN_Y) {
      totalConsumed += ctx.y - MARGIN_Y
      newPage(ctx)
    }
  }

  function drawT(
    text: string,
    opts: {
      size:    number
      bold?:   boolean
      italic?: boolean
      color?:  ReturnType<typeof rgb>
      x?:      number
      maxX?:   number
      align?:  'left' | 'center' | 'right'
    }
  ) {
    const t    = sanitizeForPdf(text)
    const font  = opts.italic ? oblique : opts.bold ? bold : regular
    const color = opts.color ?? C_BLACK
    const x     = opts.x ?? MARGIN_X
    const rEdge = opts.maxX ?? (PAGE_W - MARGIN_X)
    if (opts.align === 'center') {
      const w = font.widthOfTextAtSize(t, opts.size)
      cur(ctx).drawText(t, { x: (PAGE_W - w) / 2, y: ctx.y, size: opts.size, font, color })
    } else if (opts.align === 'right') {
      const w = font.widthOfTextAtSize(t, opts.size)
      cur(ctx).drawText(t, { x: rEdge - w, y: ctx.y, size: opts.size, font, color })
    } else {
      cur(ctx).drawText(t, { x, y: ctx.y, size: opts.size, font, color })
    }
  }

  function hLine(color = C_NAVY, thickness = 0.7) {
    cur(ctx).drawLine({
      start: { x: MARGIN_X, y: ctx.y },
      end:   { x: PAGE_W - MARGIN_X, y: ctx.y },
      thickness, color,
    })
  }

  function wrapText(text: string, maxW: number, fontSize: number, fontObj?: typeof bold): string[] {
    const font  = fontObj ?? regular
    const words = sanitizeForPdf(text).split(' ')
    const lines: string[] = []
    let   line  = ''
    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w
      if (font.widthOfTextAtSize(candidate, fontSize) > maxW && line) {
        lines.push(line); line = w
      } else { line = candidate }
    }
    if (line) lines.push(line)
    return lines.length > 0 ? lines : [text]
  }

  function drawWrapped(
    text: string,
    opts: { size: number; bold?: boolean; italic?: boolean; color?: ReturnType<typeof rgb>; x?: number; lineH: number }
  ) {
    const x       = opts.x ?? MARGIN_X
    const maxW    = PAGE_W - MARGIN_X - x
    const fontObj = opts.italic ? oblique : opts.bold ? bold : regular
    const lines   = wrapText(text, maxW, opts.size, fontObj)
    for (const line of lines) {
      guard(opts.lineH + 2)
      drawT(line, { size: opts.size, bold: opts.bold, italic: opts.italic, color: opts.color, x })
      advance(opts.lineH)
    }
  }

  /** Section header: UPPERCASE + underline */
  function section(title: string) {
    guard(S(sp.secPre + sp.secTitleH + sp.secPost + 16))
    advance(S(sp.secPre))
    drawT(title.toUpperCase(), { size: S(FS.sec), bold: true, color: C_NAVY })
    advance(S(sp.secTitleH))
    hLine(C_NAVY, 0.7)
    advance(S(sp.secPost))
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HEADER
  // ══════════════════════════════════════════════════════════════════════════
  const allContact = [cv.contact.email, cv.contact.phone, cv.contact.location, cv.contact.linkedin, cv.contact.website]
    .filter((v): v is string => Boolean(v))

  if (photo) {
    const imgW    = Math.round(S(72))
    const imgH    = Math.round(S(90))
    const imgX    = PAGE_W - MARGIN_X - imgW
    const imgTopY = ctx.y + 2

    const pdfImg = photo.type === 'jpg' ? await doc.embedJpg(photo.buffer) : await doc.embedPng(photo.buffer)
    cur(ctx).drawImage(pdfImg, { x: imgX, y: imgTopY - imgH, width: imgW, height: imgH })
    // Thin gray border around photo
    const p = cur(ctx)
    const borderColor = rgb(0.75, 0.75, 0.75)
    p.drawLine({ start: { x: imgX,        y: imgTopY        }, end: { x: imgX + imgW, y: imgTopY        }, thickness: 0.5, color: borderColor })
    p.drawLine({ start: { x: imgX,        y: imgTopY - imgH }, end: { x: imgX + imgW, y: imgTopY - imgH }, thickness: 0.5, color: borderColor })
    p.drawLine({ start: { x: imgX,        y: imgTopY - imgH }, end: { x: imgX,        y: imgTopY        }, thickness: 0.5, color: borderColor })
    p.drawLine({ start: { x: imgX + imgW, y: imgTopY - imgH }, end: { x: imgX + imgW, y: imgTopY        }, thickness: 0.5, color: borderColor })

    const textMaxX = imgX - 10

    // Name
    drawT(cv.fullName, { size: S(FS.name), bold: true, color: C_NAVY, maxX: textMaxX })
    advance(S(24))

    // Professional title
    if (cv.title) {
      drawT(cv.title, { size: S(FS.title), color: C_GRAY, maxX: textMaxX })
      advance(S(13))
    }

    // Contact
    const cSz  = S(FS.contact)
    const cMax = textMaxX - MARGIN_X
    const sep  = '  |  '
    const full = allContact.join(sep)
    if (regular.widthOfTextAtSize(full, cSz) <= cMax) {
      drawT(full, { size: cSz, color: C_GRAY })
      advance(S(12))
    } else {
      let line = ''
      for (const part of allContact) {
        const test = line ? `${line}${sep}${part}` : part
        if (regular.widthOfTextAtSize(test, cSz) > cMax && line) {
          drawT(line, { size: cSz, color: C_GRAY }); advance(S(11)); line = part
        } else { line = test }
      }
      if (line) { drawT(line, { size: cSz, color: C_GRAY }); advance(S(11)) }
    }

    // Drop cursor below photo if still higher
    const photoBtm = imgTopY - imgH - S(4)
    if (ctx.y > photoBtm) advance(ctx.y - photoBtm)
  } else {
    drawT(cv.fullName, { size: S(FS.name), bold: true, color: C_NAVY, align: 'center' })
    advance(S(24))
    if (cv.title) {
      drawT(cv.title, { size: S(FS.title), color: C_GRAY, align: 'center' })
      advance(S(13))
    }
    drawT(allContact.join('  |  '), { size: S(FS.contact), color: C_GRAY, align: 'center' })
    advance(S(10))
  }

  // Full-width header separator
  hLine(C_NAVY, 1.2)
  advance(S(sp.headerSep))

  // ══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════════════════
  if (cv.summary) {
    section('Profil')
    drawWrapped(cv.summary, { size: S(FS.summary), color: C_BLACK, lineH: S(sp.bulH) })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXPERIENCE
  // ══════════════════════════════════════════════════════════════════════════
  if (cv.experience.length > 0) {
    section('Expérience professionnelle')
    for (let i = 0; i < cv.experience.length; i++) {
      const exp = cv.experience[i]
      guard(S(sp.expPre + sp.posH + sp.compH + sp.bulH))
      if (i > 0) advance(S(sp.expPre))

      drawT(exp.position, { size: S(FS.pos), bold: true })
      drawT(exp.dates,    { size: S(FS.date), color: C_GRAY, align: 'right' })
      advance(S(sp.posH))

      drawT(exp.company, { size: S(FS.comp), italic: true, color: C_GRAY })
      advance(S(sp.compH))

      const bulX = MARGIN_X + S(10)
      for (const b of exp.bullets) {
        guard(S(sp.bulH) + 2)
        drawT('\u2022', { size: S(FS.bul), color: C_NAVY, x: MARGIN_X + S(2) })
        drawWrapped(b, { size: S(FS.bul), x: bulX, lineH: S(sp.bulH) })
      }
      advance(S(sp.expPost))
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EDUCATION
  // ══════════════════════════════════════════════════════════════════════════
  if (cv.education.length > 0) {
    section('Formation')
    for (const edu of cv.education) {
      guard(S(16))
      const degSz  = S(FS.degree)
      const schSz  = S(FS.school)
      const degW   = bold.widthOfTextAtSize(sanitizeForPdf(edu.degree), degSz)
      const dash   = '  —  '
      const dashW  = regular.widthOfTextAtSize(dash, schSz)
      drawT(edu.degree, { size: degSz, bold: true })
      drawT(dash,       { size: schSz, color: C_GRAY, x: MARGIN_X + degW })
      drawT(edu.school, { size: schSz, italic: true, color: C_GRAY, x: MARGIN_X + degW + dashW })
      if (edu.year) drawT(edu.year, { size: S(FS.date), color: C_GRAY, align: 'right' })
      advance(S(sp.eduH))
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SKILLS
  // ══════════════════════════════════════════════════════════════════════════
  const hasGroups = cv.skillGroups && cv.skillGroups.length > 0
  if (hasGroups || cv.skills.length > 0) {
    section('Compétences')
    if (hasGroups) {
      for (const g of cv.skillGroups!) {
        guard(S(sp.skillsH) + 2)
        const catW = bold.widthOfTextAtSize(sanitizeForPdf(`${g.category} : `), S(FS.skills))
        drawT(`${g.category} : `, { size: S(FS.skills), bold: true })
        drawWrapped(g.skills.join('  ·  '), { size: S(FS.skills), x: MARGIN_X + catW, lineH: S(sp.skillsH) })
      }
    } else {
      drawWrapped(cv.skills.join('  ·  '), { size: S(FS.skills), lineH: S(sp.skillsH) })
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LANGUAGES
  // ══════════════════════════════════════════════════════════════════════════
  if (cv.languages && cv.languages.length > 0) {
    section('Langues')
    const langText = cv.languages.map(l => `${l.name}  —  ${l.level}`).join('  ·  ')
    drawWrapped(langText, { size: S(FS.skills), lineH: S(sp.skillsH) })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CERTIFICATIONS
  // ══════════════════════════════════════════════════════════════════════════
  if (cv.certifications && cv.certifications.length > 0) {
    section('Certifications')
    const bulX = MARGIN_X + S(10)
    for (const cert of cv.certifications) {
      guard(S(sp.bulH) + 2)
      drawT('\u2022', { size: S(FS.bul), color: C_NAVY, x: MARGIN_X + S(2) })
      drawWrapped(cert, { size: S(FS.bul), x: bulX, lineH: S(sp.bulH) })
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL INFORMATION
  // ══════════════════════════════════════════════════════════════════════════
  if (cv.additionalInfo && cv.additionalInfo.length > 0) {
    section('Informations complémentaires')
    const bulX = MARGIN_X + S(10)
    for (const info of cv.additionalInfo) {
      guard(S(sp.bulH) + 2)
      drawT('\u2022', { size: S(FS.bul), color: C_NAVY, x: MARGIN_X + S(2) })
      drawWrapped(info, { size: S(FS.bul), x: bulX, lineH: S(sp.bulH) })
    }
  }

  return { buffer: await doc.save(), totalConsumed, pageCount: ctx.pages.length }
}

// ─── Public entry point ──────────────────────────────────────────────────────

export async function generateCVPdf(cv: GeneratedCV, photo?: PhotoData): Promise<Buffer> {
  const p1 = await renderCVPdf(cv, photo, SPACIOUS, 1.0)
  if (p1.totalConsumed <= AVAIL) return Buffer.from(p1.buffer)

  const p2 = await renderCVPdf(cv, photo, COMPACT, 1.0)
  if (p2.totalConsumed <= AVAIL) return Buffer.from(p2.buffer)

  // MIN_SCALE = 0.82 → minimum body text 7.4pt. Beyond that, allow page 2.
  const MIN_SCALE  = 0.82
  const exactScale = Math.max(MIN_SCALE, (AVAIL / p2.totalConsumed) * 0.985)
  const p3 = await renderCVPdf(cv, photo, COMPACT, exactScale)
  return Buffer.from(p3.buffer)
}
