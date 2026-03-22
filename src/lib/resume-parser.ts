import { detectLang } from './lang-detect'

interface ParseResult {
  text: string
  language: 'en' | 'fr' | 'unknown'
  wordCount: number
}

function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  // Dynamic import to avoid SSR issues with pdf-parse
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string; numpages: number }>
  const data = await pdfParse(buffer)

  if (!data.text || data.text.trim().length < 50) {
    throw new Error('Could not extract text from PDF. The file may be image-based or corrupted.')
  }

  const text = cleanText(data.text)
  const words = text.split(/\s+/).filter(Boolean)

  return {
    text,
    language: detectLang(text),
    wordCount: words.length,
  }
}

export async function parseDocx(buffer: Buffer): Promise<ParseResult> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })

  if (!result.value || result.value.trim().length < 50) {
    throw new Error('Could not extract text from DOCX. The file may be empty or corrupted.')
  }

  const text = cleanText(result.value)
  const words = text.split(/\s+/).filter(Boolean)

  return {
    text,
    language: detectLang(text),
    wordCount: words.length,
  }
}

export async function parseResume(
  buffer: Buffer,
  filename: string
): Promise<ParseResult> {
  const ext = filename.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') return parsePdf(buffer)
  if (ext === 'docx') return parseDocx(buffer)

  throw new Error(`Unsupported file format: .${ext}. Please upload a PDF or DOCX file.`)
}
