import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Link, useLocation } from "wouter";
import { Bell, ClipboardList, Home, LogOut, MessageCircle, Plus, Search, ShieldCheck } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/matches", label: "Possible matches", icon: Search },
  { href: "/report/lost", label: "Report lost", icon: ClipboardList },
  { href: "/report/found", label: "Report found", icon: Plus },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, loading, logout } = useAuth();
  const initials = (user?.name ?? "Campus user").split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase();

  if (!user && !loading) {
    return (
      <main className="auth-gate">
        <div className="auth-gate-card">
          <div className="brand-mark"><span className="brand-dot" />FindBack <em>AI</em></div>
          <p className="eyebrow">Private campus network</p>
          <h1>Sign in to keep your reports and conversations safe.</h1>
          <p className="muted">Your email and phone number never appear on public item cards. FindBack keeps contact inside the app.</p>
          <button className="button button-primary button-wide" onClick={() => startLogin()}>Continue with campus sign-in <span>↗</span></button>
          <Link href="/" className="text-link">Back to FindBack AI</Link>
        </div>
      </main>
    );
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link href="/" className="brand-lockup" aria-label="FindBack AI home">
          <span className="brand-icon"><span className="brand-dot" /></span>
          <span>FindBack <em>AI</em></span>
        </Link>
        <div className="sidebar-label">Workspace</div>
        <nav className="side-nav" aria-label="Workspace navigation">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location === item.href || (item.href === "/dashboard" && location === "/");
            return <Link key={item.href} href={item.href} className={`side-link ${active ? "active" : ""}`}><Icon size={17} strokeWidth={1.8} />{item.label}</Link>;
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="privacy-note"><ShieldCheck size={17} /><div><strong>Private by design</strong><span>Contact details stay hidden.</span></div></div>
        <div className="sidebar-profile">
          <div className="avatar">{initials || "FB"}</div>
          <div className="profile-copy"><strong>{user?.name ?? "Campus user"}</strong><span>{user?.email ?? "Signed in"}</span></div>
          <button className="icon-button" aria-label="Sign out" onClick={() => void logout()}><LogOut size={16} /></button>
        </div>
      </aside>
      <main className="workspace">
        <header className="mobile-topbar">
          <Link href="/" className="brand-lockup"><span className="brand-icon"><span className="brand-dot" /></span><span>FindBack <em>AI</em></span></Link>
          <button className="icon-button" aria-label="Notifications"><Bell size={18} /></button>
        </header>
        <div className="workspace-inner">{children}</div>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.slice(0, 4).map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} className={location === item.href ? "active" : ""}><Icon size={18} /><span>{item.label.split(" ")[0]}</span></Link>; })}
        </nav>
      </main>
    </div>
  );
}
