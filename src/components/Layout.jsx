import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, BarChart2, Settings, Sun, Moon } from "lucide-react";
import { clsx } from "clsx";

// ── Dark-mode hook ─────────────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    // Light-mode first: only go dark if user has explicitly chosen it
    const stored = localStorage.getItem("kavach-theme");
    return stored === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else       root.classList.remove("dark");
    localStorage.setItem("kavach-theme", dark ? "dark" : "light");
  }, [dark]);

  return [dark, setDark];
}

// ── Nav items ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: "/",         label: "Home",    icon: Home      },
  { to: "/analyze",  label: "Analyze", icon: BarChart2 },
  { to: "/settings", label: "Settings",icon: Settings  },
];

function NavItem({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        clsx(
          "flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all duration-200 min-w-[64px]",
          isActive
            ? "text-kavach-teal dark:text-kavach-blue bg-kavach-teal/10 dark:bg-kavach-blue/10"
            : "text-kavach-silver dark:text-slate-500 hover:text-kavach-navy dark:hover:text-slate-300"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={21} strokeWidth={isActive ? 2.2 : 1.6} className="transition-all duration-200" />
          <span className="text-[10px] font-medium tracking-wide">{label}</span>
        </>
      )}
    </NavLink>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const [dark, setDark] = useDarkMode();
  const location = useLocation();

  const pageTitle =
    location.pathname === "/"         ? "DASHBOARD" :
    location.pathname === "/analyze"  ? "FORENSICS" :
    location.pathname === "/settings" ? "SETTINGS"  : "KAVACH";

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ backgroundColor: dark ? '#071829' : '#F4F6F9' }}
    >

      {/* Subtle bg gradient */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            dark
              ? "radial-gradient(ellipse at 0% 0%, rgba(35,91,126,0.12) 0%, transparent 50%)"
              : "radial-gradient(ellipse at 0% 0%, rgba(110,176,220,0.15) 0%, transparent 50%)," +
                "radial-gradient(ellipse at 100% 100%, rgba(13,59,102,0.05) 0%, transparent 50%)",
        }}
      />

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-kavach-navy/95 backdrop-blur-md border-b border-kavach-silver/20 dark:border-white/10 shadow-card">
        <div className="flex items-center justify-between px-4 py-2.5 max-w-md mx-auto">

          {/* Logo */}
          <img
            src="/kavach-logo.png"
            alt="Kavach"
            className="h-8 w-auto object-contain"
            onError={e => { e.target.style.display = "none"; }}
          />

          {/* Page label */}
          <span className="hidden sm:block text-[10px] font-semibold tracking-[0.22em] text-kavach-silver dark:text-slate-400 uppercase">
            {pageTitle}
          </span>

          {/* Right: status + toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 border border-kavach-teal/30 dark:border-kavach-blue/25 bg-kavach-teal/6 dark:bg-kavach-blue/10">
              <span className="w-1.5 h-1.5 rounded-full bg-kavach-success animate-pulse" />
              <span className="text-[9px] font-semibold tracking-widest text-kavach-teal dark:text-kavach-blue uppercase">
                Protected
              </span>
            </div>
            <button
              onClick={() => setDark(d => !d)}
              aria-label="Toggle dark mode"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-kavach-silver hover:text-kavach-navy hover:bg-kavach-silver/12 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/8 transition-all duration-200"
            >
              {dark ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ───────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pb-28 max-w-md mx-auto w-full">
        <div className="animate-fade-in">{children}</div>
      </main>

      {/* ── BOTTOM NAV ─────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-md mx-auto bg-white/95 dark:bg-kavach-navy/98 backdrop-blur-xl border-t border-kavach-silver/15 dark:border-white/8 shadow-card">
          <div className="flex justify-around items-center px-2 py-2">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavItem key={to} to={to} label={label} Icon={Icon} />
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
