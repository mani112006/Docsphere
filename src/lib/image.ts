export type ScanFilter = 'original' | 'contrast' | 'grayscale'

export type BlurCheck = { ok: true } | { ok: false; score: number }

function loadImage(source: Blob | HTMLCanvasElement): Promise<HTMLCanvasElement> {
  if (source instanceof HTMLCanvasElement) {
    const copy = document.createElement('canvas')
    copy.width = source.width
    copy.height = source.height
    copy.getContext('2d')?.drawImage(source, 0, 0)
    return Promise.resolve(copy)
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Could not read this image.'))
        return
      }
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      resolve(canvas)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read this image.'))
    }
    img.src = url
  })
}

export async function canvasFromFile(file: Blob): Promise<HTMLCanvasElement> {
  return loadImage(file)
}

export function applyFilter(source: HTMLCanvasElement, filter: ScanFilter): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return source
  ctx.drawImage(source, 0, 0)
  if (filter === 'original') return canvas

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = image.data
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] ?? 0
    let g = data[i + 1] ?? 0
    let b = data[i + 2] ?? 0
    if (filter === 'contrast' || filter === 'grayscale') {
      r = Math.min(255, Math.max(0, (r - 128) * 1.35 + 128))
      g = Math.min(255, Math.max(0, (g - 128) * 1.35 + 128))
      b = Math.min(255, Math.max(0, (b - 128) * 1.35 + 128))
    }
    if (filter === 'grayscale') {
      const y = 0.299 * r + 0.587 * g + 0.114 * b
      const bw = y > 168 ? 255 : y < 90 ? 0 : y
      r = g = b = bw
    }
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

export function autoCrop(source: HTMLCanvasElement, padding = 12): HTMLCanvasElement {
  const ctx = source.getContext('2d')
  if (!ctx) return source
  const { width, height } = source
  const { data } = ctx.getImageData(0, 0, width, height)
  const threshold = 18
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4
      const r = data[i] ?? 255
      const g = data[i + 1] ?? 255
      const b = data[i + 2] ?? 255
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const isContent = max - min > threshold || max < 235
      if (isContent) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX - minX < width * 0.25 || maxY - minY < height * 0.25) return source

  minX = Math.max(0, minX - padding)
  minY = Math.max(0, minY - padding)
  maxX = Math.min(width, maxX + padding)
  maxY = Math.min(height, maxY + padding)
  const cropW = maxX - minX
  const cropH = maxY - minY
  const out = document.createElement('canvas')
  out.width = cropW
  out.height = cropH
  out.getContext('2d')?.drawImage(source, minX, minY, cropW, cropH, 0, 0, cropW, cropH)
  return out
}

export function blurScore(source: HTMLCanvasElement): number {
  const sample = document.createElement('canvas')
  const maxW = 320
  const scale = Math.min(1, maxW / Math.max(1, source.width))
  sample.width = Math.max(16, Math.round(source.width * scale))
  sample.height = Math.max(16, Math.round(source.height * scale))
  const ctx = sample.getContext('2d', { willReadFrequently: true })
  if (!ctx) return 999
  ctx.drawImage(source, 0, 0, sample.width, sample.height)
  const { data, width, height } = ctx.getImageData(0, 0, sample.width, sample.height)
  const gray = new Float32Array(width * height)
  for (let i = 0; i < gray.length; i += 1) {
    const p = i * 4
    gray[i] = 0.299 * (data[p] ?? 0) + 0.587 * (data[p + 1] ?? 0) + 0.114 * (data[p + 2] ?? 0)
  }
  let sum = 0
  let sumSq = 0
  let count = 0
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x
      const lap =
        -gray[i - width - 1]! -
        gray[i - width]! -
        gray[i - width + 1]! -
        gray[i - 1]! +
        8 * gray[i]! -
        gray[i + 1]! -
        gray[i + width - 1]! -
        gray[i + width]! -
        gray[i + width + 1]!
      sum += lap
      sumSq += lap * lap
      count += 1
    }
  }
  const mean = sum / count
  return sumSq / count - mean * mean
}

export async function checkImageBlur(file: Blob): Promise<BlurCheck> {
  if (!file.type.startsWith('image/')) return { ok: true }
  try {
    const canvas = await loadImage(file)
    const score = blurScore(canvas)
    if (score < 48) return { ok: false, score }
    return { ok: true }
  } catch {
    return { ok: true }
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: 'image/png' | 'image/jpeg', quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not export the scan.'))), type, quality)
  })
}
