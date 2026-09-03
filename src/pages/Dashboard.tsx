import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Files, ScanLine, TimerReset } from 'lucide-react'
import { DocumentCard } from '../components/DocumentCard'
import { DocumentScanner } from '../components/DocumentScanner'
import { Alert, Button, Card } from '../components/ui'
import { dashboardStats, expiryStatus } from '../lib/dates'
import { listDocuments } from '../lib/documents'
import { setPendingScan } from '../lib/pendingScan'
import { renewalPortal } from '../lib/renewal'
import type { DocumentRecord } from '../types'

export function Dashboard() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState<DocumentRecord[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [scanner, setScanner] = useState(false)

  useEffect(() => {
    listDocuments()
      .then(setDocs)
      .catch(() => setError('Could not load your documents.'))
      .finally(() => setLoading(false))
  }, [])

  const stats = dashboardStats(docs)
  const alerts = docs.filter((doc) => {
    const status = expiryStatus(doc.expiry_date)
    return status === 'expired' || status === 'soon'
  })
  const expired = alerts.filter((doc) => expiryStatus(doc.expiry_date) === 'expired')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted">A snapshot of your private document wallet.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setScanner(true)}>
            <ScanLine size={16} /> Scan document
          </Button>
          <Link to="/app/upload">
            <Button>Upload document</Button>
          </Link>
        </div>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {expired.length > 0 ? (
        <Alert tone="danger">
          {expired.length} document{expired.length === 1 ? '' : 's'} expired. Renew soon to avoid disruption.
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={Files} label="Total documents" value={loading ? '—' : String(stats.total)} />
        <Stat icon={AlertTriangle} label="Expired" value={loading ? '—' : String(stats.expired)} warn={stats.expired > 0} danger={stats.expired > 0} />
        <Stat icon={TimerReset} label="Expiring soon" value={loading ? '—' : String(stats.expiringSoon)} warn={stats.expiringSoon > 0} />
      </div>

      {alerts.length > 0 ? (
        <Card className={expired.length > 0 ? 'border-danger/40' : undefined}>
          <h2 className="font-semibold">Expiry alerts</h2>
          <p className="mt-1 text-sm text-muted">Documents that have expired or expire within 30 days.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {alerts.map((doc) => {
              const portal = renewalPortal(doc.category)
              return (
                <div key={doc.id} className="space-y-2">
                  <DocumentCard doc={doc} />
                  {portal ? (
                    <a
                      className="inline-flex text-xs font-semibold text-brand"
                      href={portal.url}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Renew via {portal.label}
                    </a>
                  ) : null}
                </div>
              )
            })}
          </div>
        </Card>
      ) : (
        <Card>
          <h2 className="font-semibold">Expiry alerts</h2>
          <p className="mt-1 text-sm text-muted">
            {loading ? 'Loading…' : 'No expired or soon-to-expire documents right now.'}
          </p>
        </Card>
      )}

      <DocumentScanner
        open={scanner}
        onClose={() => setScanner(false)}
        onComplete={(file) => {
          setPendingScan(file)
          navigate('/app/upload')
        }}
      />
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  warn,
  danger,
}: {
  icon: typeof Files
  label: string
  value: string
  warn?: boolean
  danger?: boolean
}) {
  return (
    <Card className={danger ? 'border-danger/50' : warn ? 'border-warn/40' : undefined}>
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-2 ${danger ? 'bg-danger/10 text-danger' : warn ? 'bg-warn/10 text-warn' : 'bg-brand-soft text-brand'}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  )
}
