import { useMemo, useState } from 'react'
import { Delete, Lock } from 'lucide-react'
import { PIN_MAX_LENGTH, PIN_MIN_LENGTH } from '../types'
import { usePinLock } from '../context/PinLockContext'
import { CreatorCredit } from './CreatorCredit'
import { Alert, Button } from './ui'

export function PinLockScreen() {
  const { unlock, lockedUntil } = usePinLock()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const lockoutLabel = useMemo(() => {
    if (!lockedUntil) return null
    const until = new Date(lockedUntil)
    if (Number.isNaN(until.getTime()) || until.getTime() <= Date.now()) return null
    return until.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }, [lockedUntil])

  async function submit(value: string) {
    setBusy(true)
    setError('')
    try {
      const result = await unlock(value)
      if (!result.ok) setError(result.message)
      else setPin('')
    } catch {
      setError('Could not verify PIN. Try again.')
    } finally {
      setBusy(false)
    }
  }
// பயோமெட்ரிக் (கைரேகை) சரிபார்ப்பைச் செயல்படுத்துவதற்கான கோடு
async function handleBiometricAuth() {
  try {
    const available = window.PublicKeyCredential && 
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    
    if (available) {
      // மொபைலின் சொந்த கைரேகை பாப்-அப்பைத் தூண்டுதல்
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: window.crypto.getRandomValues(new Uint8Array(32)),
          timeout: 60000,
          userVerification: "required"
        }
      });
      if (credential) {
        // கைரேகை வெற்றிகரமாக உறுதிப்படுத்தப்பட்டால் ஆப் திறக்கும்
        unlock();
      }
    } else {
      alert("இந்தச் சாதனத்தில் கைரேகை பாதுகாப்பு வசதி கிடைக்கவில்லை.");
    }
  } catch (error) {
    console.error("Biometric authentication failed", error);
  }
}
  function press(digit: string) {
    if (busy || lockoutLabel) return
    const next = (pin + digit).slice(0, PIN_MAX_LENGTH)
    setPin(next)
    if (next.length >= PIN_MIN_LENGTH && next.length === PIN_MAX_LENGTH) {
      void submit(next)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/95 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-surface p-6 text-ink shadow-xl">
        <div className="mb-4 flex flex-col items-center text-center">
          <div onClick={handleBiometricAuth} className="mb-3 h-12 w-12 items-center justify-center rounded-3xl bg-brand-soft text-brand cursor-pointer">
            <Lock size={22} />
          </div>
          <h1 className="text-xl font-semibold">DocSphere is locked</h1>
          <p className="mt-1 text-sm text-muted">Enter your PIN to continue this session.</p>
        </div>

        {lockoutLabel ? (
          <Alert tone="warn">Temporarily locked. Try again after {lockoutLabel}.</Alert>
        ) : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <div className="my-5 flex justify-center gap-2">
          {Array.from({ length: PIN_MAX_LENGTH }).map((_, index) => (
            <span
              key={index}
              className={`h-3 w-3 rounded-full ${index < pin.length ? 'bg-brand' : 'bg-line'}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
            if (key === '') return <span key="empty" />
            if (key === 'del') {
              return (
                <button
                  key="del"
                  type="button"
                  className="flex h-14 items-center justify-center rounded-2xl bg-paper text-ink"
                  onClick={() => setPin((value) => value.slice(0, -1))}
                  aria-label="Delete"
                >
                  <Delete size={20} />
                </button>
              )
            }
            return (
              <button
                key={key}
                type="button"
                className="h-14 rounded-2xl bg-paper text-lg font-semibold text-ink active:bg-brand-soft"
                onClick={() => press(key)}
              >
                {key}
              </button>
            )
          })}
        </div>

        <Button
          className="mt-4 w-full"
          disabled={busy || pin.length < PIN_MIN_LENGTH || Boolean(lockoutLabel)}
          onClick={() => void submit(pin)}
        >
          Unlock
        </Button>
        <footer className="mt-4">
          <CreatorCredit />
        </footer>
      </div>
    </div>
  )
}
