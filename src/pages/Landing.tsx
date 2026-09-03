import { Link } from 'react-router-dom'
import { Shield, Smartphone, Timer } from 'lucide-react'
import { CreatorCredit } from '../components/CreatorCredit'
import { ThemeIconButton } from '../components/ThemeToggle'
import { Button, Card } from '../components/ui'
import { isSupabaseConfigured } from '../lib/supabase'

export function Landing() {
  return (
    <div className="min-h-svh bg-paper bg-[radial-gradient(circle_at_top,var(--color-brand-soft),var(--color-paper)_45%)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="h-9 w-9 rounded-lg" />
          <span className="text-lg font-bold text-brand">DocSphere</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeIconButton />
          <Link to="/signin">
            <Button variant="secondary">Sign in</Button>
          </Link>
          <Link to="/signup">
            <Button>Create account</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8">
        {!isSupabaseConfigured ? (
          <div className="mb-6 rounded-2xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
            Add your Supabase URL and anon key to a local <code className="font-mono">.env</code> file
            (see <code className="font-mono">.env.example</code>) before signing in.
          </div>
        ) : null}

        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">Personal document wallet</p>
            <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">
              Keep important documents organised and private to your account.
            </h1>
            <p className="mt-4 max-w-xl text-muted">
              DocSphere stores PDFs, JPGs and PNGs in a private bucket. Each signed-in user can only
              access their own files. Retrieval uses 60-second signed links — not public URLs.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/signup">
                <Button>Get started</Button>
              </Link>
              <Link to="/signin">
                <Button variant="secondary">I already have an account</Button>
              </Link>
            </div>
          </div>
          <Card className="bg-brand text-white">
            <p className="text-sm font-semibold text-gold">How access is limited</p>
            <ul className="mt-4 space-y-3 text-sm text-white/90">
              <li>Private storage with user-folder policies in Supabase.</li>
              <li>Row-level security so metadata is scoped to your user id.</li>
              <li>Optional PIN lock and idle auto-lock on this device.</li>
              <li>App shell may work offline; document files are not cached.</li>
            </ul>
          </Card>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Shield,
              title: 'Account-bound files',
              body: 'Uploads go to your folder. Other accounts cannot list or download them through the app policies.',
            },
            {
              icon: Timer,
              title: 'Short-lived access links',
              body: 'View and download request a signed URL that expires after 60 seconds.',
            },
            {
              icon: Smartphone,
              title: 'Ready for phones',
              body: 'Responsive layout, PWA manifest, and installable standalone display for later APK/PWA packaging.',
            },
          ].map((item) => (
            <Card key={item.title}>
              <item.icon className="text-brand" size={22} />
              <h2 className="mt-3 font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-muted">{item.body}</p>
            </Card>
          ))}
        </div>
        <CreatorCredit className="mt-12" />
      </main>
    </div>
  )
}
