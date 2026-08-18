import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export function CoachHeader({ active }: { active?: "clients" | "exercises" | "programs" }) {
  const link = (href: string, key: string, label: string) => (
    <Link
      href={href}
      className={`text-sm transition-colors ${active === key ? "text-brand font-semibold" : "text-fg-muted hover:text-fg"}`}
    >
      {label}
    </Link>
  );
  return (
    <header className="flex items-center justify-between px-6 h-16 border-b border-line">
      <div className="flex items-center gap-6">
        <span className="eyebrow">4HR · Coach</span>
        <nav className="flex items-center gap-5">
          {link("/coach", "clients", "Clients")}
          {link("/coach/exercises", "exercises", "Exercises")}
          {link("/coach/programs", "programs", "Programs")}
        </nav>
      </div>
      <UserButton />
    </header>
  );
}
