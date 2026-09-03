import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categoryLabel } from '../lib/categories'
import { expiryCountdown, expiryStatus, formatDisplayDate } from '../lib/dates'
import { folderLabel } from '../lib/folders'
import { formatFileSize } from '../lib/validation'
import { maskDocumentNumber } from '../lib/ocr'
import type { DocumentRecord } from '../types'
import { Badge } from './ui'

function expiryBadge(status: ReturnType<typeof expiryStatus>) {
  if (status === 'expired') return <Badge tone="danger">Expired</Badge>
  if (status === 'soon') return <Badge tone="warn">Expiring soon</Badge>
  if (status === 'valid') return <Badge tone="ok">Valid</Badge>
  return <Badge>No expiry</Badge>
}

export function DocumentCard({ doc, onOpen }: { doc: DocumentRecord; onOpen?: () => void }) {
  const status = expiryStatus(doc.expiry_date)
  const expired = status === 'expired'
  const body = (
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            expired ? 'bg-danger/10 text-danger' : 'bg-brand-soft text-brand'
          }`}
        >
          <FileText size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold text-ink">{doc.name}</h3>
            {expiryBadge(status)}
          </div>
          <p className="mt-1 text-sm text-muted">
            {categoryLabel(doc.category)} · {folderLabel(String(doc.family_folder))}
          </p>
          {doc.holder_name ? <p className="mt-1 truncate text-sm text-ink">{doc.holder_name}</p> : null}
          <p className="mt-1 text-xs text-muted">
            {maskDocumentNumber(doc.document_number_last4)} · {formatFileSize(doc.file_size)} · {doc.mime_type.split('/')[1]?.toUpperCase()}
          </p>
          <p className={`mt-2 text-xs font-medium ${expired ? 'text-danger' : status === 'soon' ? 'text-warn' : 'text-muted'}`}>
            {doc.expiry_date ? expiryCountdown(doc.expiry_date) : `Issued ${formatDisplayDate(doc.issue_date)}`}
          </p>
        </div>
      </div>
  )
  const className = `block w-full rounded-2xl border bg-surface p-4 text-left shadow-sm transition hover:shadow ${
    expired ? 'border-danger ring-1 ring-danger/40' : 'border-line hover:border-brand/40'
  }`
  if (onOpen) {
    return (
      <button type="button" onClick={onOpen} className={className}>
        {body}
      </button>
    )
  }
  return (
    <Link to={`/app/documents/${doc.id}`} className={className}>
      {body}
    </Link>
  )
}
