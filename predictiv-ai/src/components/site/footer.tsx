import { Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/site/logo-mark";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <LogoMark size={32} />
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Safe<span className="text-brand">Factory</span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Built for modern industrial maintenance.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground/70">
            Decision support powered by historical operational data, maintenance intelligence and documented maintenance knowledge.
          </p>
        </div>

        {/* Platform */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-foreground">Platform</div>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              { to: "/app/prediction", label: "Failure Prediction" },
              { to: "/app/diagnosis", label: "Failure Diagnosis" },
              { to: "/app/risk", label: "Risk Assessment" },
              { to: "/app/priority", label: "Maintenance Priority" },
              { to: "/app/assistant", label: "Maintenance Copilot" },
              { to: "/app/report", label: "Executive Report" },
            ].map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-muted-foreground transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-foreground">Company</div>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              { href: "#about", label: "About" },
              { href: "#", label: "Customers" },
              { href: "#", label: "Careers" },
              { href: "#", label: "Contact" },
              { href: "#", label: "Privacy Policy" },
              { href: "#", label: "Terms of Service" },
            ].map((item) => (
              <li key={item.label}>
                <a href={item.href} className="text-muted-foreground transition-colors hover:text-foreground">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} SafeFactory Intelligence. All rights reserved.</div>
          <div className="flex items-center gap-5">
            <span>SOC 2 Ready</span>
            <span>ISO 27001 Aligned</span>
            <span>On-prem available</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
