import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

type Tab = "home" | "training" | "nutrition" | "profile";

const TABS: { key: Tab; href: string; label: string; icon: (p: { className?: string }) => React.ReactElement }[] = [
  { key: "home", href: "/", label: "Home", icon: HomeIcon },
  { key: "training", href: "/train", label: "Training", icon: DumbbellIcon },
  { key: "nutrition", href: "/nutrition", label: "Nutrition", icon: AppleIcon },
  { key: "profile", href: "/profile", label: "Profile", icon: UserIcon },
];

/** App shell for the signed-in client: top bar + desktop nav + mobile tab bar. */
export function ClientShell({ active, name, children }: { active: Tab; name?: string | null; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="border-b border-line">
        <div className="mx-auto max-w-2xl h-14 px-5 flex items-center justify-between gap-4">
          <span className="eyebrow shrink-0">4HR{name ? ` · ${name}` : ""}</span>
          <nav className="hidden md:flex items-center gap-6">
            {TABS.map((t) => (
              <Link key={t.key} href={t.href} className={`text-sm transition-colors ${active === t.key ? "text-brand font-semibold" : "text-fg-muted hover:text-fg"}`}>
                {t.label}
              </Link>
            ))}
          </nav>
          <UserButton appearance={{ elements: { userButtonAvatarBox: "w-9 h-9" } }} />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6">{children}</main>

      {/* Mobile bottom tab bar (thumb-reachable, safe-area aware) */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 border-t border-line bg-surface/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        <div className="mx-auto max-w-2xl grid grid-cols-4">
          {TABS.map((t) => {
            const on = active === t.key;
            const Icon = t.icon;
            return (
              <Link key={t.key} href={t.href} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${on ? "text-brand" : "text-fg-muted"}`} aria-current={on ? "page" : undefined}>
                <Icon className="h-5 w-5" />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/* ── Minimal inline icons (no dependency) ──────────────────────────────────── */
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 7v10M3.5 9v6M17.5 7v10M20.5 9v6M6.5 12h11" />
    </svg>
  );
}
function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 7c-1.5-2-4.5-2.5-6 0-1.8 3 .2 9 3 11 1 .7 2 .3 3-.2 1 .5 2 .9 3 .2 2.8-2 4.8-8 3-11-1.5-2.5-4.5-2-6 0Z" /><path d="M12 7V4.5M12 4.5c1-1.5 2.5-1.5 3.5-1" />
    </svg>
  );
}
function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </svg>
  );
}
