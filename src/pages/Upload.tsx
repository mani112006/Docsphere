import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DocumentScanner } from '../components/DocumentScanner'
import { ExtractedReviewCard } from '../components/ExtractedReviewCard'
import { Alert, Button, Card } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { checkImageBlur } from '../lib/image'
import { recognizeDocument } from '../lib/ocr'
import { uploadDocument } from '../lib/documents'
import { takePendingScan } from '../lib/pendingScan'
import { formatFileSize, validateCategory, validateDescription, validateDocumentName, validateFamilyFolder, validateUploadFile } from '../lib/validation'
import type { ExtractedDetails } from '../types'

const emptyDetails = (): ExtractedDetails => ({
  name: '',
  category: 'other',
  holderName: '',
  documentNumber: '',
  issueDate: '',
  expiryDate: '',
  familyFolder: 'my_vault',
  description: '',
  pinLocked: false,
})

export function Upload() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [details, setDetails] = useState<ExtractedDetails>(emptyDetails)
  const [error, setError] = useState('')
  const [warn, setWarn] = useState('')
  const [busy, setBusy] = useState(false)
  const [ocrBusy, setOcrBusy] = useState(false)
  const [scanner, setScanner] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const pending = takePendingScan()
    if (pending) void ingest(pending)
  }, [])

  async function ingest(next: File) {
    setError('')
    setWarn('')
    const check = await validateUploadFile(next)
    if (check.ok === false) {
      setError(check.error)
      setFile(null)
      setReady(false)
      return
    }
    const blur = await checkImageBlur(next)
    if (blur.ok === false) {
      setWarn('This image looks blurry or low contrast. OCR may miss dates — recapture or type the fields.')
    }
    setFile(next)
    setReady(true)
    setOcrBusy(true)
    try {
      const parsed = await recognizeDocument(next)
      setDetails((prev) => ({
        ...prev,
        name: parsed.name || next.name.replace(/\.[^.]+$/, ''),
        category: parsed.category,
        holderName: parsed.holderName,
        documentNumber: parsed.documentNumber,
        issueDate: parsed.issueDate,
        expiryDate: parsed.expiryDate,
      }))
    } catch {
      setDetails((prev) => ({ ...prev, name: prev.name || next.name.replace(/\.[^.]+$/, '') }))
      setWarn((value) => value || 'OCR could not read this file. Enter the details manually.')
    } finally {
      setOcrBusy(false)
    }
  }

  async function save() {
    if (!user || !file) return
    const nameError = validateDocumentName(details.name)
    const categoryError = validateCategory(details.category)
    const folderError = validateFamilyFolder(details.familyFolder)
    const descriptionError = validateDescription(details.description)
    if (nameError || categoryError || folderError || descriptionError) {
      setError(nameError ?? categoryError ?? folderError ?? descriptionError ?? '')
      return
    }
    if (details.issueDate && details.expiryDate && details.expiryDate < details.issueDate) {
      setError('Expiry date cannot be before the issue date.')
      return
    }
    const check = await validateUploadFile(file)
    if (check.ok === false) {
      setError(check.error)
      return
    }
    setBusy(true)
    setError('')
    try {
      const created = await uploadDocument({
        userId: user.id,
        name: details.name,
        category: details.category,
        description: details.description.trim() || null,
        issueDate: details.issueDate || null,
        expiryDate: details.expiryDate || null,
        holderName: details.holderName || null,
        documentNumber: details.documentNumber,
        familyFolder: details.familyFolder,
        pinLocked: details.pinLocked,
        file,
        mime: check.mime,
        ext: check.ext,
      })
      navigate(`/app/documents/${created.id}`)
    } catch {
      setError('Upload failed. Confirm Storage policies and the latest document columns are applied in Supabase.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Upload document</h1>
          <p className="text-sm text-muted">PDF, JPG or PNG. Maximum 10 MB. OCR runs on this device.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setScanner(true)}>
          Scan document
        </Button>
      </div>

      <Card>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {warn ? <Alert tone="warn">{warn}</Alert> : null}
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">File</span>
          <input
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm"
            type="file"
            accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              const next = e.target.files?.[0]
              if (next) void ingest(next)
            }}
          />
          {file ? (
            <span className="block text-xs text-muted">
              {file.name} · {formatFileSize(file.size)} · {file.type}
            </span>
          ) : null}
        </label>
      </Card>

      {ready && file ? (
        <ExtractedReviewCard
          details={details}
          onChange={setDetails}
          file={file}
          ocrBusy={ocrBusy || busy}
          onConfirm={() => void save()}
          confirmLabel={busy ? 'Saving…' : 'Confirm and save'}
        />
      ) : null}

      <DocumentScanner
        open={scanner}
        onClose={() => setScanner(false)}
        onComplete={(scanned) => {
          void ingest(scanned)
        }}
      />
    </div>
  )
}
