import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AUTO_LOCK_MS, SESSION_IDLE_SIGNOUT_MS } from '../types'
import { fetchProfile, verifyPin } from '../lib/pin'
import { useAuth } from './AuthContext'

type PinContextValue = {
  ready: boolean
  pinEnabled: boolean
  locked: boolean
  salt: string | null
  lockedUntil: string | null
  lockNow: () => void
  unlock: (pin: string) => Promise<{ ok: boolean; message: string }>
  refreshProfile: () => Promise<void>
}

const PinContext = createContext<PinContextValue | undefined>(undefined)

export function PinLockProvider({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const [ready, setReady] = useState(false)
  const [pinEnabled, setPinEnabled] = useState(false)
  const [locked, setLocked] = useState(false)
  const [salt, setSalt] = useState<string | null>(null)
  const [lockedUntil, setLockedUntil] = useState<string | null>(null)
  const lastActivity = useRef(Date.now())
  const sessionLockApplied = useRef(false)

  const refreshProfile = useCallback(async () => {
    if (!user) {
      sessionLockApplied.current = false
      setPinEnabled(false)
      setLocked(false)
      setSalt(null)
      setLockedUntil(null)
      setReady(true)
      return
    }
    const profile = await fetchProfile()
    const enabled = Boolean(profile?.pin_enabled && profile.pin_salt)
    setPinEnabled(enabled)
    setSalt(profile?.pin_salt ?? null)
    setLockedUntil(profile?.pin_locked_until ?? null)
    if (!enabled) {
      setLocked(false)
    } else if (!sessionLockApplied.current) {
      setLocked(true)
      sessionLockApplied.current = true
    }
    setReady(true)
  }, [user])

  useEffect(() => {
    void refreshProfile().catch(() => setReady(true))
  }, [refreshProfile])

  const lockNow = useCallback(() => {
    if (pinEnabled) setLocked(true)
  }, [pinEnabled])

  const unlock = useCallback(
    async (pin: string) => {
      if (!salt) return { ok: false, message: 'PIN is not set up.' }
      const result = await verifyPin(pin, salt)
      if (result.ok === false) {
        if (result.locked && result.until) {
          setLockedUntil(result.until)
          return { ok: false, message: 'Too many attempts. Try again after the lockout ends.' }
        }
        if (typeof result.remaining === 'number') {
          return { ok: false, message: `Incorrect PIN. ${result.remaining} attempt(s) remaining.` }
        }
        return { ok: false, message: 'Incorrect PIN.' }
      }
      setLocked(false)
      setLockedUntil(null)
      lastActivity.current = Date.now()
      return { ok: true, message: '' }
    },
    [salt],
  )

  useEffect(() => {
    if (!user) return

    const mark = () => {
      lastActivity.current = Date.now()
    }

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'scroll']
    events.forEach((event) => window.addEventListener(event, mark, { passive: true }))

    const timer = window.setInterval(() => {
      const idle = Date.now() - lastActivity.current
      if (document.visibilityState === 'hidden') return
      if (pinEnabled && idle >= AUTO_LOCK_MS) {
        setLocked(true)
      }
      if (!pinEnabled && idle >= SESSION_IDLE_SIGNOUT_MS) {
        void signOut()
      }
    }, 5000)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        const idle = Date.now() - lastActivity.current
        if (pinEnabled && idle >= AUTO_LOCK_MS) setLocked(true)
        if (!pinEnabled && idle >= SESSION_IDLE_SIGNOUT_MS) void signOut()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      events.forEach((event) => window.removeEventListener(event, mark))
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [user, pinEnabled, signOut])

  const value = useMemo(
    () => ({
      ready,
      pinEnabled,
      locked: Boolean(user) && pinEnabled && locked,
      salt,
      lockedUntil,
      lockNow,
      unlock,
      refreshProfile,
    }),
    [ready, pinEnabled, locked, user, salt, lockedUntil, lockNow, unlock, refreshProfile],
  )

  return <PinContext.Provider value={value}>{children}</PinContext.Provider>
}

export function usePinLock() {
  const ctx = useContext(PinContext)
  if (!ctx) throw new Error('usePinLock must be used within PinLockProvider')
  return ctx
}
