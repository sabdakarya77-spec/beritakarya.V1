import { Router, Request, Response } from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { requireAuth } from '../../middleware/auth.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import * as repo from './media.repository'
import { AppError } from '../../utils/AppError'
import { logger } from '../../lib/logger'
import { StorageService } from '../../services/storage.service'

export const mediaRouter: Router = Router()

// ─── Multer (memory storage — no local disk writes) ───────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new AppError('Tipe file tidak didukung. Gunakan JPG, PNG, WebP, GIF, atau PDF', 400, 'INVALID_FILE_TYPE'))
  },
})

// ─── Image Processing (Sharp) ─────────────────────────────────────────────────

interface ProcessResult {
  fullBuffer: Buffer
  thumbBuffer: Buffer
  blurHash: string
  dominantColor: string
  width: number
  height: number
  originalFormat: string
}

async function processImage(
  buffer: Buffer,
  options: { skipWatermark?: boolean } = {}
): Promise<ProcessResult> {
  let sharp: any
  try {
    sharp = (await import('sharp')).default
  } catch (err) {
    logger.error('[Media] Failed to import sharp:', err)
    throw new Error('Sharp library not available')
  }

  let meta: any
  try {
    meta = await sharp(buffer).metadata()
  } catch (err) {
    logger.error('[Media] Failed to read image metadata:', err)
    throw new Error('Invalid image file or corrupted data')
  }

  const maxW = 1920
  let processedBuffer = buffer
  if ((meta.width ?? 0) > maxW) {
    processedBuffer = await sharp(buffer).resize(maxW).toBuffer()
  }

  // ── Full-size image (with optional watermark) ──
  let pipeline = sharp(processedBuffer)

  if (!options.skipWatermark) {
    const currentMeta = await sharp(processedBuffer).metadata()
    const currentW = currentMeta.width || maxW
    const currentH = currentMeta.height || maxW
    const fontSize = Math.max(14, Math.floor(currentW * 0.02))
    const boxWidth = Math.max(180, fontSize * 12)
    const boxHeight = Math.max(32, fontSize * 2.2)

    const watermarkSvg = `<svg width="${boxWidth}" height="${boxHeight}" xmlns="http://www.w3.org/2000/svg">
<rect width="${boxWidth}" height="${boxHeight}" rx="4" ry="4" fill="rgba(0,0,0,0.65)" />
<text x="${boxWidth / 2}" y="${boxHeight / 2}" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.95)" font-size="${fontSize}px" font-weight="700" font-family="Noto Sans, DejaVu Sans, Liberation Sans, sans-serif">© BERITAKARYA 2026</text>
</svg>`

    pipeline = pipeline.composite([{ input: Buffer.from(watermarkSvg), gravity: 'southeast' }])
  }

  const fullBuffer: Buffer = await pipeline.webp({ quality: 82 }).toBuffer()

  // ── Thumbnail 400px ──
  const thumbBuffer: Buffer = await sharp(buffer).resize(400).webp({ quality: 70 }).toBuffer()

  // ── BlurHash (tiny 10×10 WebP base64) ──
  const blurBuffer: Buffer = await sharp(buffer)
    .resize(10, 10, { fit: 'inside' })
    .webp({ quality: 20 })
    .toBuffer()
  const blurHash = `data:image/webp;base64,${blurBuffer.toString('base64')}`

  // ── Dominant color ──
  let dominantColor = ''
  try {
    const stats = await sharp(buffer).stats()
    const d = stats.dominant
    if (d) {
      dominantColor = `#${d.r.toString(16).padStart(2, '0')}${d.g.toString(16).padStart(2, '0')}${d.b.toString(16).padStart(2, '0')}`.toUpperCase()
    }
  } catch { /* non-critical */ }

  // ── Final dimensions from the processed full image ──
  const finalMeta = await sharp(fullBuffer).metadata()

  return {
    fullBuffer,
    thumbBuffer,
    blurHash,
    dominantColor,
    width: finalMeta.width ?? meta.width ?? 0,
    height: finalMeta.height ?? meta.height ?? 0,
    originalFormat: meta.format ?? 'unknown',
  }
}

// ─── POST /api/v1/media/upload ────────────────────────────────────────────────

mediaRouter.post(
  '/upload',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: 'File tidak ditemukan' } })
    }

    const isLogo = req.query.type === 'logo'
    const skipWatermark =
      isLogo || req.query.skipWatermark === 'true' || req.query.purpose === 'editorial'

    logger.info(
      `[Media] Uploading: ${req.file.originalname} (${req.file.size} bytes), type=${req.query.type || 'standard'}`
    )

    const id = uuidv4()
    const mediaBucket = StorageService.mediaBucket

    let url = ''
    let thumbUrl = ''
    let blurHash = ''
    let width = 0
    let height = 0
    let originalFormat = ''
    let dominantColor = ''

    if (req.file.mimetype === 'application/pdf') {
      // ── PDF: upload buffer directly ──
      const key = `${id}.pdf`
      try {
        await StorageService.uploadBuffer(req.file.buffer, key, 'application/pdf', mediaBucket, {
          isPublic: true,
        })
        url = StorageService.getPublicUrl(mediaBucket, key)
        thumbUrl = url
        originalFormat = 'pdf'
      } catch (err: any) {
        logger.error('[Media] PDF upload failed:', err)
        return res
          .status(500)
          .json({ success: false, error: { message: `Gagal mengunggah PDF: ${err.message}` } })
      }
    } else {
      // ── Image: process then upload two versions ──
      let processed: ProcessResult
      try {
        processed = await processImage(req.file.buffer, { skipWatermark })
      } catch (err: any) {
        logger.error('[Media] Image processing failed:', err)
        return res
          .status(500)
          .json({ success: false, error: { message: `Gagal memproses gambar: ${err.message}` } })
      }

      const fullKey = `${id}.webp`
      const thumbKey = `thumbs/${id}_thumb.webp`

      try {
        await Promise.all([
          StorageService.uploadBuffer(processed.fullBuffer, fullKey, 'image/webp', mediaBucket, {
            isPublic: true,
          }),
          StorageService.uploadBuffer(processed.thumbBuffer, thumbKey, 'image/webp', mediaBucket, {
            isPublic: true,
          }),
        ])

        url = StorageService.getPublicUrl(mediaBucket, fullKey)
        thumbUrl = StorageService.getPublicUrl(mediaBucket, thumbKey)
        blurHash = processed.blurHash
        width = processed.width
        height = processed.height
        originalFormat = processed.originalFormat
        dominantColor = processed.dominantColor
      } catch (err: any) {
        logger.error('[Media] Upload to Supabase Storage failed:', err)
        return res
          .status(500)
          .json({ success: false, error: { message: `Gagal mengunggah ke storage: ${err.message}` } })
      }
    }

    const media = await repo.createMedia({
      url,
      thumbUrl,
      blurHash,
      width,
      height,
      originalFormat,
      size: req.file.size,
      userId: req.user!.userId,
      siteId: req.site,
      altText: req.body.altText || (isLogo ? 'Logo Situs' : ''),
      caption: req.body.caption,
      credit: req.body.credit,
      dominantColor,
    })

    res.status(201).json({ success: true, data: media })
  })
)

// ─── GET /api/v1/media — list media ──────────────────────────────────────────

mediaRouter.get(
  '/',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 100)

    // Reporter/kontributor hanya bisa lihat media milik sendiri
    const restrictedRoles = ['reporter', 'kontributor']
    const userId = restrictedRoles.includes(req.user!.role) ? req.user!.userId : undefined

    const result = await repo.findMediaBySite(req.site!, page, limit, userId)
    res.json({ success: true, data: result })
  })
)

// ─── PATCH /api/v1/media/:id — update metadata ───────────────────────────────

mediaRouter.patch(
  '/:id',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const media = await repo.findMediaById(req.params.id)
    if (!media)
      return res.status(404).json({ success: false, error: { message: 'Media tidak ditemukan' } })

    const isAdmin = ['superadmin', 'wapimred'].includes(req.user!.role)
    if (media.userId !== req.user!.userId && !isAdmin) {
      return res.status(403).json({ success: false, error: { message: 'Akses ditolak' } })
    }

    const { altText, caption, credit } = req.body
    const updated = await repo.updateMedia(req.params.id, { altText, caption, credit })
    res.json({ success: true, data: updated })
  })
)

// ─── DELETE /api/v1/media/:id ─────────────────────────────────────────────────

mediaRouter.delete(
  '/:id',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const media = await repo.findMediaById(req.params.id)
    if (!media)
      return res.status(404).json({ success: false, error: { message: 'Media tidak ditemukan' } })

    const isAdmin = ['superadmin', 'wapimred'].includes(req.user!.role)
    if (media.userId !== req.user!.userId && !isAdmin) {
      return res.status(403).json({ success: false, error: { message: 'Akses ditolak' } })
    }

    // Hapus dari Supabase Storage juga (best-effort)
    try {
      const urlObj = new URL(media.url)
      // Path biasanya: /storage/v1/object/public/media/<key>
      const parts = urlObj.pathname.split(`/${StorageService.mediaBucket}/`)
      if (parts.length === 2) {
        const key = parts[1]
        const thumbKey = `thumbs/${key.replace('.webp', '_thumb.webp')}`
        await Promise.allSettled([
          StorageService.deleteFile(key, StorageService.mediaBucket),
          StorageService.deleteFile(thumbKey, StorageService.mediaBucket),
        ])
      }
    } catch (storageErr) {
      logger.warn('[Media] Could not delete from storage (non-fatal):', storageErr)
    }

    await repo.deleteMedia(req.params.id)
    res.json({ success: true, message: 'Media berhasil dihapus' })
  })
)