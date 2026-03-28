import { detectPhotoType, type PhotoData } from './cv-generator'
import { inflateSync, deflateSync } from 'zlib'

// ═══════════════════════════════════════════════════════════════════════════════
// DOCX Photo Extraction
// ═══════════════════════════════════════════════════════════════════════════════

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
          if (type && buf.length > (best?.size ?? 2048)) {
            best = { buffer: buf, type, size: buf.length }
          }
        } catch { /* skip */ }
        return { src: '' }
      }),
    })

    return best ? { buffer: (best as any).buffer, type: (best as any).type } : null
  } catch (err) {
    console.warn('[photo-extractor] DOCX extraction failed:', err)
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PDF Photo Extraction — 3-pronged approach
// ═══════════════════════════════════════════════════════════════════════════════
//
// 1. pdf-lib object model: find Image XObjects with DCTDecode → raw JPEG
// 2. pdf-lib object model: find FlateDecode images → inflate → JPEG or PNG recon
// 3. Brute-force byte scan: scan raw PDF buffer for JPEG SOI/EOI markers
//

export async function extractPhotoFromPdf(buffer: Buffer): Promise<PhotoData | null> {
  // Strategy 1+2: pdf-lib object model
  const fromLib = await extractViaPdfLib(buffer)
  if (fromLib) return fromLib

  // Strategy 3: brute-force JPEG byte scan on raw PDF bytes
  return extractJpegByteScan(buffer)
}

// ─── Strategy 1+2: pdf-lib ──────────────────────────────────────────────────

async function extractViaPdfLib(buffer: Buffer): Promise<PhotoData | null> {
  try {
    const { PDFDocument, PDFName } = await import('pdf-lib')
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })

    let bestJpeg: { data: Uint8Array; size: number } | null = null
    let bestRaw: { data: Uint8Array; w: number; h: number; ch: number; size: number } | null = null

    for (const [, obj] of doc.context.enumerateIndirectObjects()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stream = obj as any
      if (!stream?.dict?.get || !stream?.contents) continue

      const subtype = stream.dict.get(PDFName.of('Subtype'))
      if (!subtype || subtype.toString() !== '/Image') continue

      const contents: Uint8Array = stream.contents
      if (!contents || contents.length < 1024) continue

      const filter = stream.dict.get(PDFName.of('Filter'))
      const filterStr = filter?.toString() ?? ''

      // ── DCTDecode = JPEG ──
      if (filterStr.includes('DCTDecode')) {
        if (contents[0] === 0xFF && contents[1] === 0xD8 && contents.length > (bestJpeg?.size ?? 0)) {
          bestJpeg = { data: contents, size: contents.length }
        }
        continue
      }

      // ── FlateDecode = zlib-compressed (could be raw pixels OR compressed JPEG) ──
      if (filterStr.includes('FlateDecode')) {
        try {
          const inflated = inflateSync(Buffer.from(contents))

          // If the decompressed data is actually JPEG
          if (inflated[0] === 0xFF && inflated[1] === 0xD8) {
            if (inflated.length > (bestJpeg?.size ?? 0)) {
              bestJpeg = { data: inflated, size: inflated.length }
            }
            continue
          }

          // Otherwise it's raw pixel data — extract dimensions from dict
          const w = pdfNum(stream.dict.get(PDFName.of('Width')))
          const h = pdfNum(stream.dict.get(PDFName.of('Height')))
          if (!w || !h || w < 50 || h < 50) continue

          const cs = stream.dict.get(PDFName.of('ColorSpace'))?.toString() ?? ''
          const ch = cs.includes('RGB') ? 3 : cs.includes('CMYK') ? 4 : cs.includes('Gray') ? 1 : 3
          const expected = w * h * ch

          // Sanity check: decompressed size ≈ expected raw pixel count
          if (inflated.length >= expected * 0.9 && inflated.length <= expected * 1.1) {
            if (inflated.length > (bestRaw?.size ?? 0)) {
              bestRaw = { data: inflated, w, h, ch, size: inflated.length }
            }
          }
        } catch { /* inflate failed — skip */ }
      }
    }

    // Prefer JPEG (already a valid image file)
    if (bestJpeg) return { buffer: Buffer.from(bestJpeg.data), type: 'jpg' }

    // Reconstruct PNG from raw pixel data
    if (bestRaw) {
      const png = rawPixelsToPng(bestRaw.data, bestRaw.w, bestRaw.h, bestRaw.ch)
      if (png) return { buffer: png, type: 'png' }
    }
  } catch (err) {
    console.warn('[photo-extractor] pdf-lib extraction failed:', err)
  }
  return null
}

/** Safely extract a number from a pdf-lib object */
function pdfNum(obj: unknown): number | null {
  if (!obj) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = obj as any
  if (typeof o.asNumber === 'function') return o.asNumber()
  if (typeof o.numberValue === 'number') return o.numberValue
  const n = Number(o.toString())
  return isNaN(n) ? null : n
}

// ─── Strategy 3: brute-force JPEG byte scan ─────────────────────────────────

function extractJpegByteScan(buffer: Buffer): PhotoData | null {
  let bestStart = -1
  let bestEnd = -1
  let bestSize = 0

  for (let i = 0; i < buffer.length - 3; i++) {
    // JPEG SOI marker: FF D8 FF
    if (buffer[i] === 0xFF && buffer[i + 1] === 0xD8 && buffer[i + 2] === 0xFF) {
      // Find the corresponding EOI marker: FF D9
      for (let j = i + 3; j < buffer.length - 1; j++) {
        if (buffer[j] === 0xFF && buffer[j + 1] === 0xD9) {
          const size = j + 2 - i
          if (size > bestSize && size > 5000) { // >5KB = likely a real photo
            bestStart = i
            bestEnd = j + 2
            bestSize = size
          }
          i = j + 1 // skip past this JPEG
          break
        }
      }
    }
  }

  if (bestStart >= 0 && bestEnd > bestStart) {
    return { buffer: buffer.slice(bestStart, bestEnd), type: 'jpg' }
  }
  return null
}

// ═══════════════════════════════════════════════════════════════════════════════
// PNG reconstruction from raw pixel data
// ═══════════════════════════════════════════════════════════════════════════════

function rawPixelsToPng(
  rawPixels: Uint8Array,
  width: number,
  height: number,
  channels: number,
): Buffer | null {
  try {
    const rowBytes = width * channels
    if (rawPixels.length < rowBytes * height) return null

    // Prepend PNG filter byte (0 = None) to each row
    const filtered = Buffer.alloc((rowBytes + 1) * height)
    for (let y = 0; y < height; y++) {
      filtered[y * (rowBytes + 1)] = 0 // filter type None
      Buffer.from(rawPixels.buffer, rawPixels.byteOffset + y * rowBytes, rowBytes)
        .copy(filtered, y * (rowBytes + 1) + 1)
    }

    const compressed = deflateSync(filtered)

    // PNG signature
    const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])

    // IHDR: width(4) height(4) bitDepth(1) colorType(1) compression(1) filter(1) interlace(1)
    const ihdr = Buffer.alloc(13)
    ihdr.writeUInt32BE(width, 0)
    ihdr.writeUInt32BE(height, 4)
    ihdr[8] = 8 // 8 bits per channel
    ihdr[9] = channels === 4 ? 6 : channels === 3 ? 2 : 0 // RGBA / RGB / Grayscale

    return Buffer.concat([
      sig,
      pngChunk('IHDR', ihdr),
      pngChunk('IDAT', compressed),
      pngChunk('IEND', Buffer.alloc(0)),
    ])
  } catch {
    return null
  }
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.concat([t, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcBuf), 0)
  return Buffer.concat([len, t, data, crc])
}

// ─── CRC32 (PNG spec) ──────────────────────────────────────────────────────
const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
  crcTable[n] = c
}
function crc32(buf: Buffer): number {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

// ═══════════════════════════════════════════════════════════════════════════════
// Dispatch
// ═══════════════════════════════════════════════════════════════════════════════

export async function extractPhotoFromResume(
  buffer: Buffer,
  filename: string,
): Promise<PhotoData | null> {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'docx') return extractPhotoFromDocx(buffer)
  if (ext === 'pdf') return extractPhotoFromPdf(buffer)
  return null
}
