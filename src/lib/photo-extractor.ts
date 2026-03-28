import { detectPhotoType, type PhotoData } from './cv-generator'

// ─── DOCX Photo Extraction ──────────────────────────────────────────────────
// DOCX files are ZIP archives with images in word/media/.
// We use mammoth's image conversion to capture them during HTML conversion.

export async function extractPhotoFromDocx(buffer: Buffer): Promise<PhotoData | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mammoth = await import('mammoth') as any
    let best: { buffer: Buffer; type: 'jpg' | 'png'; size: number } | null = null

    await mammoth.convertToHtml({ buffer }, {
      convertImage: mammoth.images.inline(async (element: any) => {
        try {
          const raw = await element.read()
          const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw)
          const type = detectPhotoType(buf)
          // Keep the largest valid image — most likely the profile photo
          if (type && buf.length > (best?.size ?? 2048)) {
            best = { buffer: buf, type, size: buf.length }
          }
        } catch { /* skip unreadable images */ }
        return { src: '' }
      }),
    })

    return best ? { buffer: (best as any).buffer, type: (best as any).type } : null
  } catch (err) {
    console.warn('[photo-extractor] DOCX extraction failed:', err)
    return null
  }
}

// ─── PDF Photo Extraction ───────────────────────────────────────────────────
// Scans all indirect objects for Image XObjects with DCTDecode (JPEG) filter.
// The raw stream contents of DCTDecode images ARE the JPEG bytes.

export async function extractPhotoFromPdf(buffer: Buffer): Promise<PhotoData | null> {
  try {
    const { PDFDocument, PDFName } = await import('pdf-lib')
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })

    let best: { data: Uint8Array; size: number } | null = null

    for (const [, obj] of doc.context.enumerateIndirectObjects()) {
      const stream = obj as any
      if (!stream?.dict?.get || !stream?.contents) continue

      const subtype = stream.dict.get(PDFName.of('Subtype'))
      if (!subtype || subtype.toString() !== '/Image') continue

      const filter = stream.dict.get(PDFName.of('Filter'))
      if (!filter || !filter.toString().includes('DCTDecode')) continue

      const contents: Uint8Array = stream.contents
      if (contents.length < 2048) continue // skip tiny images (icons, logos)

      // Verify JPEG SOI marker
      if (contents[0] !== 0xFF || contents[1] !== 0xD8) continue

      if (contents.length > (best?.size ?? 0)) {
        best = { data: contents, size: contents.length }
      }
    }

    return best ? { buffer: Buffer.from(best.data), type: 'jpg' } : null
  } catch (err) {
    console.warn('[photo-extractor] PDF extraction failed:', err)
    return null
  }
}

// ─── Dispatch ───────────────────────────────────────────────────────────────

export async function extractPhotoFromResume(
  buffer: Buffer,
  filename: string,
): Promise<PhotoData | null> {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'docx') return extractPhotoFromDocx(buffer)
  if (ext === 'pdf') return extractPhotoFromPdf(buffer)
  return null
}
