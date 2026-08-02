"use client";

import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/site/logo-mark";

const ORANGE = "#D97A2B";

const links = [
  { href: "#snapshot", label: "Industry" },
  { href: "#journey", label: "How It Works" },
  { href: "#platform", label: "Platform" },
  { href: "#modules", label: "Modules" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full px-4 pt-4">
      <div
        className="group mx-auto flex max-w-6xl items-center justify-between rounded-full px-5 py-2.5 transition-all duration-500 md:px-7"
        style={{
          background: scrolled ? "rgba(248,246,242,0.55)" : "rgba(248,246,242,0.20)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${scrolled ? "rgba(196,190,181,0.42)" : "rgba(196,190,181,0.22)"}`,
          boxShadow: scrolled ? "0 4px 40px -10px rgba(13,17,23,0.08)" : "none",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,246,242,0.97)")}
        onMouseLeave={e => (e.currentTarget.style.background = scrolled ? "rgba(248,246,242,0.55)" : "rgba(248,246,242,0.20)")}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark size={28} />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-[#0D1117]">
              Safe<span style={{ color: ORANGE }}>Factory</span>
            </span>
            <span className="text-[9px] font-medium uppercase tracking-widest text-[#9A9690]">
              Intelligence
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-[#5A5650] transition-colors hover:bg-black/[0.05] hover:text-[#0D1117]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            to="/app"
            className="hidden text-sm font-medium text-[#5A5650] transition-colors hover:text-[#0D1117] md:inline"
          >
            Sign in
          </Link>
          <Link
            to="/app"
            className="inline-flex h-8 items-center rounded-full px-5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
            style={{ background: "#0D1117" }}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
