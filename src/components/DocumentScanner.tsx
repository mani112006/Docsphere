import { useEffect, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { autoCrop, applyFilter, canvasToBlob, type ScanFilter } from '../lib/image'
import { imagesToPdf } from '../lib/pdf'
import { Alert, Button, Card } from './ui'

type Page = { canvas: HTMLCanvasElement }

export function DocumentScanner({
  open,
  onClose,
  onComplete,
}: {
  open: boolean
  onClose: () => void
  onComplete: (file: File) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState('')
  const [pages, setPages] = useState<Page[]>([])
  const [filter, setFilter] = useState<ScanFilter>('grayscale')
  const [crop, setCrop] = useState(true)
  const [output, setOutput] = useState<'png' | 'pdf'>('png')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function start() {
      setError('')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch {
        setError('Camera access was blocked. Allow camera permission or upload a file instead.')
      }
    }
    void start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [open])

  function capture() {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    setPages((prev) => (prev.length >= 2 ? [prev[0]!, { canvas }] : [...prev, { canvas }]))
  }

  async function finish() {
    if (pages.length === 0) {
      setError('Capture at least one side of the document.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const processed = pages.map((page) => {
        const cropped = crop ? autoCrop(page.canvas) : page.canvas
        return applyFilter(cropped, filter)
      })
      if (output === 'pdf' || processed.length > 1) {
        const images = await Promise.all(
          processed.map(async (canvas) => ({
            blob: await canvasToBlob(canvas, 'image/jpeg', 0.9),
            width: canvas.width,
            height: canvas.height,
          })),
        )
        const pdf = await imagesToPdf(images)
        onComplete(new File([pdf], `scan-${Date.now()}.pdf`, { type: 'application/pdf' }))
      } else {
        const blob = await canvasToBlob(processed[0]!, 'image/png')
        onComplete(new File([blob], `scan-${Date.now()}.png`, { type: 'image/png' }))
      }
      onClose()
    } catch {
      setError('Could not export the scan.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-ink/80 p-4">
      <Card className="mx-auto max-w-lg">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Scan document</h2>
          <button type="button" onClick={onClose} aria-label="Close scanner" className="text-muted">
            <X size={20} />
          </button>
        </div>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div className="mt-3 overflow-hidden rounded-xl bg-black">
          <video ref={videoRef} className="aspect-[3/4] w-full object-cover" playsInline muted autoPlay />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" onClick={capture}>
            <Camera size={16} /> Capture {pages.length === 0 ? 'front' : pages.length === 1 ? 'back' : 'replace back'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setPages([])}>
            Clear
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">{pages.length} page(s) captured. Front and back merge into one PDF.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            Filter
            <select
              className="mt-1 w-full rounded-xl border border-line bg-surface px-2 py-2 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value as ScanFilter)}
            >
              <option value="original">Original</option>
              <option value="contrast">Contrast</option>
              <option value="grayscale">Black &amp; white</option>
            </select>
          </label>
          <label className="text-sm">
            Auto-crop
            <select
              className="mt-1 w-full rounded-xl border border-line bg-surface px-2 py-2 text-sm"
              value={crop ? 'yes' : 'no'}
              onChange={(e) => setCrop(e.target.value === 'yes')}
            >
              <option value="yes">On</option>
              <option value="no">Off</option>
            </select>
          </label>
          <label className="text-sm">
            Export
            <select
              className="mt-1 w-full rounded-xl border border-line bg-surface px-2 py-2 text-sm"
              value={output}
              onChange={(e) => setOutput(e.target.value as 'png' | 'pdf')}
            >
              <option value="png">PNG</option>
              <option value="pdf">PDF</option>
            </select>
          </label>
        </div>
        {pages.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {pages.map((page, index) => (
              <img
                key={index}
                src={page.canvas.toDataURL('image/jpeg', 0.6)}
                alt={index === 0 ? 'Front' : 'Back'}
                className="h-28 w-full rounded-lg object-cover"
              />
            ))}
          </div>
        ) : null}
        <Button className="mt-4 w-full" type="button" disabled={busy} onClick={() => void finish()}>
          {busy ? 'Preparing…' : 'Use this scan'}
        </Button>
      </Card>
    </div>
  )
}
