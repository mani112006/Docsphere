import { useEffect, useState } from 'react'
import { fetchDocumentBlob } from '../lib/documents'
import type { DocumentRecord } from '../types'
import { Button } from './ui'

export function DocumentViewer({
  doc,
  onClose,
}: {
  doc: DocumentRecord
  onClose: () => void
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let revoked = false
    let url: string | null = null

    fetchDocumentBlob(doc.storage_path)
      .then((blob) => {
        if (revoked) return
        url = URL.createObjectURL(blob)
        setObjectUrl(url)
      })
      .catch(() => {
        if (!revoked) setError('Could not open this file.')
      })

    return () => {
      revoked = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [doc.storage_path])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/70 p-4">
      <div className="flex max-h-[90svh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface text-ink">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="truncate pr-3 text-sm font-semibold">{doc.name}</p>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="min-h-64 flex-1 bg-paper">
          {error ? <p className="p-6 text-sm text-danger">{error}</p> : null}
          {!error && !objectUrl ? <p className="p-6 text-sm text-muted">Opening a short-lived private link…</p> : null}
          {objectUrl && doc.mime_type === 'application/pdf' ? (
            <iframe title={doc.name} src={objectUrl} className="h-[70svh] w-full border-0" />
          ) : null}
          {objectUrl && doc.mime_type !== 'application/pdf' ? (
            <img src={objectUrl} alt="" className="max-h-[70svh] w-full object-contain" />
          ) : null}
        </div>
        <p className="px-4 py-2 text-[11px] text-muted">
          Preview uses a 60-second signed URL and is not stored in the app cache.
        </p>
      </div>
    </div>
  )
}
