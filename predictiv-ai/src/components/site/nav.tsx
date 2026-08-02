import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/site/logo-mark";

const links = [
  { href: "#challenge", label: "The Challenge" },
  { href: "#workflow", label: "How It Works" },
  { href: "#analysis", label: "Platform" },
  { href: "#vision", label: "Vision 2030" },
];

export function SiteNav() {
  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="mx-auto mt-4 flex max-w-7xl items-center justify-between rounded-full border border-border bg-background/90 px-5 py-2.5 shadow-[0_4px_32px_-8px_oklch(0_0_0_/_0.08)] backdrop-blur-md md:px-7">
        <Link to="/" className="flex items-center gap-3">
          <LogoMark size={34} />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Safe<span className="text-brand">Factory</span>
            </span>
            <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
              Intelligence
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/app"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            Sign in
          </Link>
          <Button
            asChild
            size="sm"
            className="h-9 rounded-full bg-foreground px-5 text-sm text-background shadow-sm hover:bg-foreground/90"
          >
            <Link to="/app">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
