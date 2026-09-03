function pad(offset: number): string {
  return String(offset).padStart(10, '0')
}

function concatBytes(parts: Array<Uint8Array | string>): Uint8Array {
  const encoded = parts.map((part) => (typeof part === 'string' ? new TextEncoder().encode(part) : part))
  const total = encoded.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of encoded) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

export async function imagesToPdf(images: Array<{ blob: Blob; width: number; height: number }>): Promise<Blob> {
  if (images.length === 0) throw new Error('No pages to convert.')

  const pages: Array<{ jpeg: Uint8Array; width: number; height: number }> = []
  for (const image of images) {
    const bitmap = await createImageBitmap(image.blob)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not prepare the PDF page.')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()
    const jpegBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('JPEG encode failed.'))), 'image/jpeg', 0.88)
    })
    pages.push({
      jpeg: new Uint8Array(await jpegBlob.arrayBuffer()),
      width: canvas.width,
      height: canvas.height,
    })
  }

  const objects: Uint8Array[] = []
  const add = (value: Uint8Array | string) => {
    objects.push(typeof value === 'string' ? new TextEncoder().encode(value) : value)
    return objects.length
  }

  const pageCount = pages.length
  const kids = pages.map((_, index) => `${3 + index * 3} 0 R`).join(' ')

  add(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`)
  add(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>\nendobj\n`)

  pages.forEach((page, index) => {
    const pageObj = 3 + index * 3
    const contentObj = pageObj + 1
    const imageObj = pageObj + 2
    const content = `q ${page.width} 0 0 ${page.height} 0 0 cm /Im${index} Do Q\n`
    add(
      `${pageObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Contents ${contentObj} 0 R /Resources << /XObject << /Im${index} ${imageObj} 0 R >> >> >>\nendobj\n`,
    )
    add(`${contentObj} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`)
    add(
      concatBytes([
        `${imageObj} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`,
        page.jpeg,
        `\nendstream\nendobj\n`,
      ]),
    )
  })

  const header = new TextEncoder().encode('%PDF-1.4\n')
  const bodyParts = [header, ...objects]
  const offsets = [0]
  let cursor = header.length
  for (const part of objects) {
    offsets.push(cursor)
    cursor += part.length
  }
  const xrefStart = cursor
  const xrefLines = [`xref\n0 ${objects.length + 1}\n`, `0000000000 65535 f \n`]
  for (let i = 1; i <= objects.length; i += 1) {
    xrefLines.push(`${pad(offsets[i] ?? 0)} 00000 n \n`)
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`
  return new Blob([concatBytes([...bodyParts, xrefLines.join(''), trailer])], { type: 'application/pdf' })
}
