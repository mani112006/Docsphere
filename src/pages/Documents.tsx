import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mic } from 'lucide-react'
import { DocumentCard } from '../components/DocumentCard'
import { UnlockPrompt } from '../components/UnlockPrompt'
import { Alert, Button, Input, Select } from '../components/ui'
import { useVaultLock } from '../context/VaultLockContext'
import { CATEGORIES, categoryLabel } from '../lib/categories'
import { expiryStatus } from '../lib/dates'
import { listDocuments } from '../lib/documents'
import { FAMILY_FOLDERS, folderLabel } from '../lib/folders'
import { speechSupported, startVoiceSearch } from '../lib/voice'
import type { DocumentRecord, ExpiryStatus } from '../types'

type ExpiryFilter = 'all' | ExpiryStatus

export function Documents() {
  const navigate = useNavigate()
  const { isLocked, unlock } = useVaultLock()
  const [docs, setDocs] = useState<DocumentRecord[]>([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [folder, setFolder] = useState('all')
  const [expiry, setExpiry] = useState<ExpiryFilter>('all')
  const [loading, setLoading] = useState(true)
  const [listening, setListening] = useState(false)
  const [voiceLang, setVoiceLang] = useState<'en-IN' | 'ta-IN'>('en-IN')
  const [gate, setGate] = useState<{ kind: 'folder' | 'category'; key: string; id: string } | null>(null)

  useEffect(() => {
    listDocuments()
      .then(setDocs)
      .catch(() => setError('Could not load your documents.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return docs.filter((doc) => {
      const haystack = `${doc.name} ${doc.category} ${categoryLabel(doc.category)} ${doc.holder_name ?? ''} ${doc.document_number_last4 ?? ''} ${folderLabel(String(doc.family_folder))}`.toLowerCase()
      if (q && !haystack.includes(q)) return false
      if (category !== 'all' && doc.category !== category) return false
      if (folder !== 'all' && doc.family_folder !== folder) return false
      if (expiry !== 'all' && expiryStatus(doc.expiry_date) !== expiry) return false
      return true
    })
  }, [docs, query, category, folder, expiry])

  function listen() {
    if (!speechSupported()) {
      setError('Voice search needs Chrome or Edge, with microphone permission.')
      return
    }
    setError('')
    setListening(true)
    try {
      startVoiceSearch(voiceLang, (text) => {
        setQuery(text)
        setListening(false)
      })
    } catch {
      setListening(false)
      setError('Could not start the microphone.')
    }
  }

  function openDoc(doc: DocumentRecord) {
    if (isLocked('folder', String(doc.family_folder))) {
      setGate({ kind: 'folder', key: String(doc.family_folder), id: doc.id })
      return
    }
    if (isLocked('category', doc.category) || (doc.pin_locked && isLocked('category', 'bank'))) {
      setGate({ kind: 'category', key: doc.pin_locked ? (isLocked('category', doc.category) ? doc.category : 'bank') : doc.category, id: doc.id })
      return
    }
    navigate(`/app/documents/${doc.id}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-muted">Search by name, holder, type, or last 4 digits.</p>
        </div>
        <Link to="/app/upload">
          <Button>Upload</Button>
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search name, holder, type…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search documents"
          />
          <Button type="button" variant="secondary" onClick={listen} aria-label="Voice search">
            <Mic size={16} />
            {listening ? '…' : ''}
          </Button>
        </div>
        <Select value={voiceLang} onChange={(e) => setVoiceLang(e.target.value as 'en-IN' | 'ta-IN')} aria-label="Voice language">
          <option value="en-IN">Voice: English</option>
          <option value="ta-IN">Voice: Tamil</option>
        </Select>
        <Select value={folder} onChange={(e) => setFolder(e.target.value)} aria-label="Family folder">
          <option value="all">All folders</option>
          {FAMILY_FOLDERS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
        <Select
          className="md:col-span-2 xl:col-span-4"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value as ExpiryFilter)}
          aria-label="Filter by expiry status"
        >
          <option value="all">All expiry statuses</option>
          <option value="valid">Valid</option>
          <option value="soon">Expiring soon</option>
          <option value="expired">Expired</option>
          <option value="none">No expiry date</option>
        </Select>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading ? <p className="text-sm text-muted">Loading…</p> : null}
      {!loading && filtered.length === 0 ? (
        <p className="text-sm text-muted">No documents match these filters.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onOpen={() => openDoc(doc)} />
          ))}
        </div>
      )}

      {gate ? (
        <UnlockPrompt
          title={`Unlock ${gate.kind === 'folder' ? folderLabel(gate.key) : categoryLabel(gate.key)}`}
          onUnlock={async (pin) => {
            const ok = await unlock(gate.kind, gate.key, pin)
            if (ok) {
              const id = gate.id
              setGate(null)
              navigate(`/app/documents/${id}`)
            }
            return ok
          }}
          onCancel={() => setGate(null)}
        />
      ) : null}
    </div>
  )
}
