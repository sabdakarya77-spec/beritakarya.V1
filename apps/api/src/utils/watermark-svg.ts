import fs from 'fs'
import path from 'path'

// Load font once at module init — lazy-loaded on first use
let fontBase64: string | null = null

function getFontBase64(): string {
  if (fontBase64) return fontBase64
  const fontPath = path.join(__dirname, '..', 'assets', 'fonts', 'Inter-Bold.ttf')
  fontBase64 = fs.readFileSync(fontPath).toString('base64')
  return fontBase64
}

/**
 * Creates an SVG buffer with embedded font for watermark text.
 * Works on Vercel serverless where system fonts are not available.
 */
export function createWatermarkSvg(
  text: string,
  options: {
    width: number
    height: number
    fontSize: number
    bgColor?: string
    textColor?: string
    borderRadius?: number
  }
): Buffer {
  const {
    width,
    height,
    fontSize,
    bgColor = 'rgba(0,0,0,0.65)',
    textColor = 'white',
    borderRadius = 4
  } = options

  const font = getFontBase64()

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'WatermarkFont';
        src: url("data:font/ttf;base64,${font}") format('truetype');
        font-weight: bold;
      }
    </style>
  </defs>
  <rect width="${width}" height="${height}" rx="${borderRadius}" fill="${bgColor}"/>
  <text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="central"
        fill="${textColor}" font-size="${fontSize}" font-weight="bold"
        font-family="WatermarkFont, Arial, sans-serif">${text}</text>
</svg>`

  return Buffer.from(svg)
}

/**
 * Creates a tiled watermark SVG buffer for KYC-style diagonal watermark.
 */
export function createTiledWatermarkSvg(
  text: string,
  options: {
    tileWidth: number
    tileHeight: number
    imageWidth: number
    imageHeight: number
    fontSize: number
    opacity?: number
    color?: string
  }
): Buffer {
  const {
    tileWidth,
    tileHeight,
    imageWidth,
    imageHeight,
    fontSize,
    opacity = 0.35,
    color = `rgba(220,38,38,${opacity})`
  } = options

  const font = getFontBase64()

  // Create a single tile
  const tileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileWidth}" height="${tileHeight}">
  <defs>
    <style>
      @font-face {
        font-family: 'WatermarkFont';
        src: url("data:font/ttf;base64,${font}") format('truetype');
        font-weight: bold;
      }
    </style>
  </defs>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="WatermarkFont, Arial, sans-serif" font-size="${fontSize}"
        font-weight="bold" fill="${color}"
        transform="rotate(-35, ${tileWidth / 2}, ${tileHeight / 2})">${text}</text>
</svg>`

  return Buffer.from(tileSvg)
}

/**
 * Creates a bottom-right stamp watermark SVG buffer.
 */
export function createStampWatermarkSvg(
  text: string,
  options: {
    width: number
    height: number
    boxWidth: number
    boxHeight: number
    fontSize?: number
    bgColor?: string
    textColor?: string
  }
): Buffer {
  const {
    width,
    height,
    boxWidth,
    boxHeight,
    fontSize = 13,
    bgColor = 'rgba(220,38,38,0.75)',
    textColor = 'white'
  } = options

  const font = getFontBase64()

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <style>
      @font-face {
        font-family: 'WatermarkFont';
        src: url("data:font/ttf;base64,${font}") format('truetype');
        font-weight: bold;
      }
    </style>
  </defs>
  <rect x="${width - boxWidth - 10}" y="${height - boxHeight - 8}"
        width="${boxWidth}" height="${boxHeight}" rx="4" fill="${bgColor}"/>
  <text x="${width - boxWidth / 2 - 10}" y="${height - boxHeight / 2 - 8}"
        dominant-baseline="middle" text-anchor="middle"
        font-family="WatermarkFont, Arial, sans-serif" font-size="${fontSize}"
        font-weight="bold" fill="${textColor}">${text}</text>
</svg>`

  return Buffer.from(svg)
}
