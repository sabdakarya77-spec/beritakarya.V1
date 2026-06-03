import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { requireAuth } from '../../middleware/auth.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { env } from '../../lib/env'
import * as repo from './media.repository'
import { AppError } from '../../utils/AppError'
import { logger } from '../../lib/logger'

export const mediaRouter: Router = Router()

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
const THUMB_DIR = path.join(UPLOAD_DIR, 'thumbs')

// [H-007] Path Traversal Protection
function isPathSafe(baseDir: string, targetPath: string): boolean {
  const normalizedBase = path.normalize(baseDir)
  const normalizedTarget = path.normalize(targetPath)
  return normalizedTarget.startsWith(normalizedBase)
}

// Ensure directories exist with better error handling
function ensureDirectories() {
  const dirs = [UPLOAD_DIR, THUMB_DIR]
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        logger.info(`[Media] Created directory: ${dir}`)
      }
    } catch (err) {
      logger.error(`[Media] Failed to create directory ${dir}:`, err)
      throw new AppError(`Failed to create upload directory: ${dir}`, 500)
    }
  }
}

// Initialize directories on module load
ensureDirectories()

const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','image/gif','application/pdf']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new AppError('Tipe file tidak didukung. Gunakan JPG, PNG, WebP, GIF, atau PDF', 400, 'INVALID_FILE_TYPE'))
  }
})

async function processImage(buffer: Buffer, filename: string, options: { skipWatermark?: boolean } = {}) {
  // Import sharp with better error handling
  let sharp: any
  try {
    sharp = (await import('sharp')).default
  } catch (err) {
    logger.error('[Media] Failed to import sharp:', err)
    throw new Error('Sharp library not available. Please install sharp: npm install sharp')
  }

  let meta: any
  try {
    meta = await sharp(buffer).metadata()
  } catch (err) {
    logger.error('[Media] Failed to read image metadata:', err)
    throw new Error('Invalid image file or corrupted data')
  }

  const maxW = 1920
  const needResize = (meta.width ?? 0) > maxW

  // Resize jika perlu
  let processedBuffer = buffer
  if (needResize) {
    processedBuffer = await sharp(buffer).resize(maxW).toBuffer()
  }

  // Full size → Composite Watermark (Optional) → WebP
  const fullName = `${filename}.webp`
  const fullPath = path.join(UPLOAD_DIR, fullName)

  if (!isPathSafe(UPLOAD_DIR, fullPath)) {
    throw new Error('Path upload tidak aman')
  }

  try {
    let pipeline = sharp(processedBuffer)

    if (!options.skipWatermark) {
      // Generate SVG Watermark - Corner Badge with background box
      const currentMeta = await sharp(processedBuffer).metadata()
      const currentW = currentMeta.width || maxW
      const currentH = currentMeta.height || maxW
      const fontSize = Math.max(14, Math.floor(currentW * 0.02))
      const boxWidth = Math.max(180, fontSize * 12)
      const boxHeight = Math.max(32, fontSize * 2.2)
      const padding = fontSize * 0.6

      // Corner Badge Watermark — inline SVG attributes for Sharp/librsvg compatibility
      // Previously used CSS classes which caused rx/ry to be ignored (not valid CSS props)
      // and fill/font properties to not render properly in Sharp's SVG renderer
      // NOTE: font-noto + fontconfig are installed in the Docker image (api.Dockerfile),
      // so "Noto Sans" is available to librsvg. Arial/Helvetica do NOT exist on Alpine Linux.
      const watermarkSvg = `<svg width="${boxWidth}" height="${boxHeight}" xmlns="http://www.w3.org/2000/svg">
<rect width="${boxWidth}" height="${boxHeight}" rx="4" ry="4" fill="rgba(0,0,0,0.65)" />
<text x="${boxWidth / 2}" y="${boxHeight / 2}" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.95)" font-size="${fontSize}px" font-weight="700" font-family="Noto Sans, DejaVu Sans, Liberation Sans, sans-serif">© BERITAKARYA 2026</text>
</svg>`

      pipeline = pipeline.composite([{ input: Buffer.from(watermarkSvg), gravity: 'southeast' }])
    }

    await pipeline.webp({ quality: 82 }).toFile(fullPath)
  } catch (err) {
    logger.error('[Media] Failed to save full image:', err)
    throw new Error('Failed to save processed image')
  }

  // Thumbnail 400px → WebP
  const thumbName = `${filename}_thumb.webp`
  const thumbPath = path.join(THUMB_DIR, thumbName)

  if (!isPathSafe(THUMB_DIR, thumbPath)) {
    throw new Error('Path thumbnail tidak aman')
  }

  let blurHash = ''
  let dominantColor = ''
  try {
    await sharp(buffer).resize(400).webp({ quality: 70 }).toFile(thumbPath)

    // Generate blur hash (10x10 WebP base64 URI)
    const blurBuffer = await sharp(buffer)
      .resize(10, 10, { fit: 'inside' })
      .webp({ quality: 20 })
      .toBuffer()
    blurHash = `data:image/webp;base64,${blurBuffer.toString('base64')}`

    // Extract dominant color
    const stats = await sharp(buffer).stats()
    const dominant = stats.dominant
    if (dominant) {
      const r = dominant.r.toString(16).padStart(2, '0')
      const g = dominant.g.toString(16).padStart(2, '0')
      const b = dominant.b.toString(16).padStart(2, '0')
      dominantColor = `#${r}${g}${b}`.toUpperCase()
    }
  } catch (err) {
    logger.error('[Media] Failed to save thumbnail, generate blurHash or extract color:', err)
    // Clean up full image if thumbnail fails
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
    } catch (cleanupErr) {
      logger.error('[Media] Failed to cleanup after thumbnail error:', cleanupErr)
    }
    throw new Error('Failed to save thumbnail')
  }

  const finalMeta = await sharp(fullPath).metadata()
  return {
    fullName, thumbName, blurHash, dominantColor,
    width: finalMeta.width ?? meta.width ?? 0,
    height: finalMeta.height ?? meta.height ?? 0,
    originalFormat: meta.format ?? 'unknown'
  }
}

mediaRouter.post(
  '/upload',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'File tidak ditemukan' }
      })
    }

    const isLogo = req.query.type === 'logo'
    const skipWatermark = isLogo || req.query.skipWatermark === 'true' || req.query.purpose === 'editorial'

    logger.info(`[Media] Uploading file: ${req.file.originalname} (${req.file.size} bytes), Type: ${req.query.type || 'standard'}`)
    const id = uuidv4()
    let processed;
    let url = ''
    let thumbUrl = ''
    let blurHash = ''
    let width = 0
    let height = 0
    let originalFormat = ''
    let dominantColor = ''

    if (req.file.mimetype === 'application/pdf') {
      const fullName = `${id}.pdf`
      const fullPath = path.join(UPLOAD_DIR, fullName)
      if (!isPathSafe(UPLOAD_DIR, fullPath)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Path upload tidak aman' }
        })
      }
      try {
        fs.writeFileSync(fullPath, req.file.buffer)
        url = `${env.API_URL}/api/v1/media/uploads/${fullName}`
        thumbUrl = url
        originalFormat = 'pdf'
      } catch (err: any) {
        logger.error('[Media] PDF save failed:', err)
        return res.status(500).json({
          success: false,
          error: { message: `Gagal menyimpan berkas PDF: ${err.message}` }
        })
      }
    } else {
      try {
        processed = await processImage(req.file.buffer, id, { skipWatermark })
        url = `${env.API_URL}/api/v1/media/uploads/${processed.fullName}`
        thumbUrl = `${env.API_URL}/api/v1/media/uploads/thumbs/${processed.thumbName}`
        blurHash = processed.blurHash
        width = processed.width
        height = processed.height
        originalFormat = processed.originalFormat
        dominantColor = processed.dominantColor
      } catch (err: any) {
        logger.error('[Media] Image processing failed:', err)
        return res.status(500).json({
          success: false,
          error: { message: `Gagal memproses gambar: ${err.message}` }
        })
      }
    }

    // Save to database
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
      dominantColor
    })

    res.status(201).json({
      success: true,
      data: media
    })
  })
)

// GET /api/v1/media — list media
mediaRouter.get(
  '/',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 100)

    // Role-based isolation: reporter/kontributor only see their own media
    const restrictedRoles = ['reporter', 'kontributor']
    const userId = restrictedRoles.includes(req.user!.role)
      ? req.user!.userId
      : undefined

    const result = await repo.findMediaBySite(req.site!, page, limit, userId)
    res.json({ success: true, data: result })
  })
)

// PATCH /api/v1/media/:id — update metadata
mediaRouter.patch(
  '/:id',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const media = await repo.findMediaById(req.params.id)
    if (!media) return res.status(404).json({ success: false, error: { message: 'Media tidak ditemukan' } })

    // Hanya pemilik atau admin/wapimred yang bisa mengupdate
    const isAdmin = ['superadmin','wapimred'].includes(req.user!.role)
    if (media.userId !== req.user!.userId && !isAdmin) {
      return res.status(403).json({ success: false, error: { message: 'Akses ditolak' } })
    }

    const { altText, caption, credit } = req.body
    const updated = await repo.updateMedia(req.params.id, { altText, caption, credit })
    res.json({ success: true, data: updated })
  })
)

// DELETE /api/v1/media/:id
mediaRouter.delete(
  '/:id',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const media = await repo.findMediaById(req.params.id)
    if (!media) return res.status(404).json({ success: false, error: { message: 'Media tidak ditemukan' } })

    // Hanya pemilik atau admin/wapimred yang bisa menghapus
    const isAdmin = ['superadmin','wapimred'].includes(req.user!.role)
    if (media.userId !== req.user!.userId && !isAdmin) {
      return res.status(403).json({ success: false, error: { message: 'Akses ditolak' } })
    }

    await repo.deleteMedia(req.params.id)
    res.json({ success: true, message: 'Media berhasil dihapus' })
  })
)

// Serve static files
const express = require('express')
mediaRouter.use('/uploads/thumbs', express.static(THUMB_DIR))
mediaRouter.use('/uploads', express.static(UPLOAD_DIR))