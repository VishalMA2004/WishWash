"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowDownRight, Bell, CalendarDays, Check, CloudSun, Menu, Shirt, Sparkles, Sun, X } from "lucide-react";

const api = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:8000/api/v1" : "/api/v1");
const currentDate = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; };
const navigation = [
  { href: "/", label: "Dashboard", icon: Sun },
  { href: "/recommendations", label: "Recommendations", icon: Sparkles },
  { href: "/laundry", label: "Laundry", icon: Shirt },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/history", label: "History", icon: ArrowDownRight },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Menu },
];

export function WorkspacePage({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="app-shell">
    <aside className="sidebar"><Brand /><div className="nav-label">WORKSPACE</div><nav className="nav-list" aria-label="Main navigation">{navigation.slice(0, 5).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-item${pathname === href ? " active" : ""}`} aria-current={pathname === href ? "page" : undefined}><Icon className="nav-icon" strokeWidth={1.8} />{label}</Link>)}</nav><div className="nav-label" style={{ marginTop: 28 }}>PREFERENCES</div><nav className="nav-list" aria-label="Preferences">{navigation.slice(5).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-item${pathname === href ? " active" : ""}`} aria-current={pathname === href ? "page" : undefined}><Icon className="nav-icon" strokeWidth={1.8} />{label}</Link>)}</nav><div className="sidebar-bottom"><div className="location-card"><div className="location-top">Bengaluru</div><div className="location-small">Weather location</div></div><div className="profile"><div className="avatar">G</div><div><div className="profile-name">Guest</div><div className="profile-caption">Local preview</div></div></div></div></aside>
    <header className="mobile-header"><Brand /><div className="mobile-header-actions"><Link className="icon-button" href="/notifications" aria-label="Notifications"><Bell size={17} /></Link><button className="icon-button" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}><Menu size={18} /></button></div></header>
    {menuOpen && <nav className="mobile-menu" aria-label="Mobile navigation">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`nav-item${pathname === href ? " active" : ""}`}><Icon className="nav-icon" />{label}</Link>)}</nav>}
    <main className="main"><div className="topbar"><div className="greeting"><h1>{title}</h1><p>{subtitle}</p></div><div className="top-actions"><div className="today-pill"><CalendarDays size={14} />{new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "short" }).format(new Date())}</div><Link className="icon-button" href="/notifications" aria-label="Notifications"><Bell size={17} /></Link></div></div>{children}</main>
    <nav className="mobile-bottom" aria-label="Mobile navigation"><MobileLink href="/" label="Home" icon={Sun} active={pathname === "/"} /><MobileLink href="/laundry" label="Plan" icon={Sparkles} active={pathname === "/laundry"} /><MobileLink href="/calendar" label="Calendar" icon={CalendarDays} active={pathname === "/calendar"} /><MobileLink href="/history" label="History" icon={ArrowDownRight} active={pathname === "/history"} /></nav>
  </div>;
}

function MobileLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Sun; active: boolean }) { return <Link href={href} className={`bottom-item${active ? " active" : ""}`}><Icon /><span>{label}</span></Link>; }
function Brand() { return <div className="brand"><div className="brand-mark"><CloudSun size={20} strokeWidth={1.8} /></div><div><div className="brand-name">WishWash</div><div className="brand-caption">Wash when the weather works.</div></div></div>; }
function Panel({ title, children }: { title: string; children: ReactNode }) { return <section className="card workspace-panel"><h2>{title}</h2>{children}</section>; }
function LoadMessage({ error }: { error: string }) { return <p className="page-message" role="status">{error}</p>; }

type ForecastDay = { date: string; status: "WASH" | "CAUTION" | "AVOID"; drying_hours: number; rain_probability: number; rain_free_hours: number; reasons: string[]; high: number; low: number; label: string };
type Forecast = { days: ForecastDay[] };

function useForecast() {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { fetch(`${api}/weather/forecast?latitude=12.9716&longitude=77.5946&location=Bengaluru`).then((response) => { if (!response.ok) throw new Error("Weather forecast is unavailable."); return response.json(); }).then((result) => setForecast(result.data)).catch(() => setError("Weather information is temporarily unavailable. Try again shortly.")); }, []);
  return { forecast, error };
}

export function RecommendationsPage() {
  const { forecast, error } = useForecast();
  return <WorkspacePage title="Recommendations" subtitle="Choose a rain-free drying window for your next load."><Panel title="Next 7 days">{error ? <LoadMessage error={error} /> : !forecast ? <p className="page-message">Loading forecast…</p> : <div className="page-list">{forecast.days.map((day) => <article className="forecast-row" key={day.date}><div><strong>{new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</strong><p>{day.reasons.join(" · ")}</p></div><div className="forecast-row-meta"><span className={`status-pill ${day.status.toLowerCase()}`}>{day.status === "WASH" ? "GOOD TO WASH" : day.status}</span><span>Drying ~{day.drying_hours}h</span><Link className="text-link" href={`/laundry?date=${day.date}`}>Plan this day →</Link></div></article>)}</div>}</Panel></WorkspacePage>;
}

export function LaundryPage() {
  const [category, setCategory] = useState("Daily clothes");
  const [date, setDate] = useState(currentDate);
  const [time, setTime] = useState("08:00");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  useEffect(() => { const selectedDate = new URLSearchParams(window.location.search).get("date"); if (selectedDate) setDate(selectedDate); }, []);
  const check = async () => { setChecking(true); setMessage(""); try { const response = await fetch(`${api}/recommendations/evaluate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude: 12.9716, longitude: 77.5946, date, start_time: time, category }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error?.message ?? "Could not check this time."); setMessage(`${result.data.status}: ${result.data.reasons.join(" · ")} Estimated drying time: ${result.data.drying_hours} hours.`); } catch (error) { setMessage(error instanceof Error ? error.message : "Weather check failed."); } finally { setChecking(false); } };
  return <WorkspacePage title="Laundry planner" subtitle="Choose when and what you want to wash."><div className="workspace-columns"><Panel title="Plan a wash"><label className="field-label">Laundry type<select value={category} onChange={(event) => setCategory(event.target.value)}>{["Daily clothes", "Office clothes", "College clothes", "School uniforms", "Towels", "Bedsheets", "Sports clothes", "Custom"].map((item) => <option key={item}>{item}</option>)}</select></label><div className="field-grid"><label className="field-label">Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="field-label">Start time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label></div><button className="primary-button" onClick={check} disabled={checking}>{checking ? "Checking…" : "Check weather"}<CloudSun size={15} /></button>{message && <p className="page-message result-message" role="status">{message}</p>}</Panel><Panel title="Active laundry"><div className="empty-session"><div className="empty-icon"><Shirt size={18} /></div><div><div className="empty-title">No active drying session</div><div className="empty-copy">A session can be started from the dashboard planner.</div></div></div><Link href="/" className="primary-button">Go to dashboard</Link></Panel></div></WorkspacePage>;
}

export function CalendarPage() {
  const { forecast, error } = useForecast();
  return <WorkspacePage title="Laundry calendar" subtitle="See the upcoming forecast at a glance."><Panel title={new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date())}>{error ? <LoadMessage error={error} /> : !forecast ? <p className="page-message">Loading forecast…</p> : <div className="calendar-grid">{forecast.days.map((day) => <Link href={`/laundry?date=${day.date}`} className={`calendar-day ${day.status.toLowerCase()}`} key={day.date}><span>{new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</span><strong>{new Date(`${day.date}T12:00:00`).getDate()}</strong><small>{day.status === "WASH" ? "Good" : day.status}</small></Link>)}</div>}</Panel></WorkspacePage>;
}

export function HistoryPage() { return <WorkspacePage title="Laundry history" subtitle="Review completed and interrupted loads."><Panel title="Recent loads"><div className="empty-session"><div className="empty-icon"><Check size={18} /></div><div><div className="empty-title">No completed loads yet</div><div className="empty-copy">Once you complete or record a laundry session, it will appear here.</div></div></div><p className="page-message">History sync is not connected in this preview.</p></Panel></WorkspacePage>; }

export function NotificationsPage() {
  const [permission, setPermission] = useState("Checking browser support…");
  useEffect(() => { setPermission(typeof Notification === "undefined" ? "Not supported in this browser" : Notification.permission); }, []);
  const enable = async () => { if (typeof Notification === "undefined") return setPermission("Not supported in this browser"); setPermission(await Notification.requestPermission()); };
  return <WorkspacePage title="Notifications" subtitle="Choose how WishWash should reach you."><Panel title="Browser alerts"><p className="page-message">Permission status: <strong>{permission}</strong></p><p className="page-message">Rain alerts and background push delivery are not connected yet. In-app messages remain available.</p><button className="primary-button" onClick={enable}>Enable browser notifications<Bell size={15} /></button></Panel><Panel title="Alert preferences"><Preference label="Rain risk alerts" description="Get a warning when rain may reach drying clothes." /><Preference label="Laundry reminders" description="A reminder for planned laundry times." /><Preference label="Drying estimates" description="A notice when your estimated drying window ends." /></Panel></WorkspacePage>;
}

function Preference({ label, description }: { label: string; description: string }) { const [enabled, setEnabled] = useState(true); return <label className="preference-row"><span><strong>{label}</strong><small>{description}</small></span><input aria-label={label} type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /></label>; }

export function SettingsPage() {
  const [saved, setSaved] = useState(false);
  return <WorkspacePage title="Settings" subtitle="Set your location and laundry preferences."><div className="workspace-columns"><Panel title="Location"><label className="field-label">City or area<input defaultValue="Bengaluru" /></label><p className="page-message">Location is used to request local weather forecasts.</p></Panel><Panel title="Laundry preferences"><label className="field-label">How often do you wash?<select defaultValue="2× per week"><option>Daily</option><option>Every 2 days</option><option>2× per week</option><option>3× per week</option><option>Weekly</option></select></label><label className="field-label">Drying method<select defaultValue="Outdoor line"><option>Outdoor line</option><option>Indoor rack</option><option>Dryer</option></select></label><button className="primary-button" onClick={() => setSaved(true)}>Save preferences</button>{saved && <p className="page-message" role="status">Preferences saved for this session.</p>}</Panel></div></WorkspacePage>;
}
