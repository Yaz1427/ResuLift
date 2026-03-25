import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, convertInchesToTwip, PageOrientation,
} from 'docx'
import type { GeneratedCV } from '@/types/analysis'

const FONT = 'Calibri'
const FONT_SIZE_NORMAL = 22  // half-points (11pt)
const FONT_SIZE_NAME = 32    // 16pt
const FONT_SIZE_SECTION = 24 // 12pt
const COLOR_BLACK = '000000'
const COLOR_GRAY = '444444'

function hr(): Paragraph {
  return new Paragraph({
    border: {
      bottom: { color: 'CCCCCC', space: 1, style: BorderStyle.SINGLE, size: 6 },
    },
    spacing: { before: 80, after: 80 },
  })
}

function sectionHeader(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        font: FONT,
        size: FONT_SIZE_SECTION,
        color: COLOR_BLACK,
      }),
    ],
    spacing: { before: 240, after: 60 },
  })
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: FONT_SIZE_NORMAL, color: COLOR_GRAY })],
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 },
  })
}

function line(text: string, bold = false, size = FONT_SIZE_NORMAL, color = COLOR_BLACK): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold, font: FONT, size, color })],
    spacing: { before: 40, after: 40 },
  })
}

function contactLine(cv: GeneratedCV): Paragraph {
  const parts: string[] = []
  if (cv.contact.email) parts.push(cv.contact.email)
  if (cv.contact.phone) parts.push(cv.contact.phone)
  if (cv.contact.location) parts.push(cv.contact.location)
  if (cv.contact.linkedin) parts.push(cv.contact.linkedin)

  return new Paragraph({
    children: [new TextRun({ text: parts.join('  |  '), font: FONT, size: FONT_SIZE_NORMAL, color: COLOR_GRAY })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 120 },
  })
}

export async function generateCVDocx(cv: GeneratedCV): Promise<Buffer> {
  const children: Paragraph[] = []

  // === HEADER ===
  children.push(
    new Paragraph({
      children: [new TextRun({ text: cv.fullName, bold: true, font: FONT, size: FONT_SIZE_NAME, color: COLOR_BLACK })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
    })
  )
  children.push(contactLine(cv))

  // === RÉSUMÉ PROFESSIONNEL ===
  if (cv.summary) {
    children.push(sectionHeader('Résumé professionnel'))
    children.push(hr())
    children.push(line(cv.summary, false, FONT_SIZE_NORMAL, COLOR_GRAY))
  }

  // === EXPÉRIENCE ===
  if (cv.experience.length > 0) {
    children.push(sectionHeader('Expérience professionnelle'))
    children.push(hr())

    for (const exp of cv.experience) {
      // Entreprise — Poste | Dates
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.company, bold: true, font: FONT, size: FONT_SIZE_NORMAL, color: COLOR_BLACK }),
            new TextRun({ text: ` — ${exp.position}`, font: FONT, size: FONT_SIZE_NORMAL, color: COLOR_BLACK }),
            new TextRun({ text: `  |  ${exp.dates}`, font: FONT, size: FONT_SIZE_NORMAL, color: COLOR_GRAY }),
          ],
          spacing: { before: 120, after: 40 },
        })
      )
      for (const b of exp.bullets) {
        children.push(bullet(b))
      }
    }
  }

  // === FORMATION ===
  if (cv.education.length > 0) {
    children.push(sectionHeader('Formation'))
    children.push(hr())

    for (const edu of cv.education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.degree, bold: true, font: FONT, size: FONT_SIZE_NORMAL, color: COLOR_BLACK }),
            new TextRun({ text: ` — ${edu.school}`, font: FONT, size: FONT_SIZE_NORMAL, color: COLOR_GRAY }),
            ...(edu.year ? [new TextRun({ text: `  |  ${edu.year}`, font: FONT, size: FONT_SIZE_NORMAL, color: COLOR_GRAY })] : []),
          ],
          spacing: { before: 120, after: 40 },
        })
      )
    }
  }

  // === COMPÉTENCES ===
  if (cv.skills.length > 0) {
    children.push(sectionHeader('Compétences'))
    children.push(hr())
    children.push(
      new Paragraph({
        children: [new TextRun({ text: cv.skills.join('  •  '), font: FONT, size: FONT_SIZE_NORMAL, color: COLOR_GRAY })],
        spacing: { before: 40, after: 40 },
      })
    )
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  })

  return Buffer.from(await Packer.toBuffer(doc))
}
