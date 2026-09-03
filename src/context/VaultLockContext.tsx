import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { listVaultLocks, verifyVaultLock } from '../lib/shares'
import { useAuth } from './AuthContext'

type LockRow = { lock_type: 'folder' | 'category'; lock_key: string; pin_salt: string }

type VaultLockValue = {
  ready: boolean
  locks: LockRow[]
  isLocked: (kind: 'folder' | 'category', key: string) => boolean
  unlock: (kind: 'folder' | 'category', key: string, pin: string) => Promise<boolean>
  refresh: () => Promise<void>
}

const VaultLockContext = createContext<VaultLockValue | undefined>(undefined)

export function VaultLockProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [locks, setLocks] = useState<LockRow[]>([])
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set())
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setLocks([])
      setUnlocked(new Set())
      setReady(true)
      return
    }
    try {
      const rows = await listVaultLocks()
      setLocks(rows)
    } catch {
      setLocks([])
    } finally {
      setReady(true)
    }
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const isLocked = useCallback(
    (kind: 'folder' | 'category', key: string) => {
      const has = locks.some((row) => row.lock_type === kind && row.lock_key === key)
      if (!has) return false
      return !unlocked.has(`${kind}:${key}`)
    },
    [locks, unlocked],
  )

  const unlock = useCallback(
    async (kind: 'folder' | 'category', key: string, pin: string) => {
      const lock = locks.find((row) => row.lock_type === kind && row.lock_key === key)
      if (!lock) return true
      const ok = await verifyVaultLock(lock, pin)
      if (ok) {
        setUnlocked((prev) => new Set(prev).add(`${kind}:${key}`))
      }
      return ok
    },
    [locks],
  )

  const value = useMemo(
    () => ({ ready, locks, isLocked, unlock, refresh }),
    [ready, locks, isLocked, unlock, refresh],
  )

  return <VaultLockContext.Provider value={value}>{children}</VaultLockContext.Provider>
}

export function useVaultLock() {
  const ctx = useContext(VaultLockContext)
  if (!ctx) throw new Error('useVaultLock must be used within VaultLockProvider')
  return ctx
}
