"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, Bell, CalendarDays, Check, ChevronRight, CloudDrizzle, CloudSun, Droplets, MapPin, Menu, Plus, Shirt, Sparkles, Sun, Wind, X } from "lucide-react";
import { InstallPrompt } from "@/components/install-prompt";

type Day = { date: string; label: string; high: number; low: number; rain_probability: number; drying_window_rain_probability: number; condition: string; status: "WASH" | "CAUTION" | "AVOID"; drying_hours: number; rain_free_hours: number; reasons: string[] };
type Forecast = { location: string; updated_at: string; current: { temperature: number; feels_like: number; humidity: number; wind_speed: number; rain_probability: number; condition: string }; days: Day[] };
type Plan = { category: string; date: string; time: string; estimated_hours: number };

const API = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:8000/api/v1" : "/api/v1");
const categoryOptions = ["Daily clothes", "Office clothes", "College clothes", "School uniforms", "Towels", "Bedsheets", "Sports clothes", "Custom"];
const dayOfWeek = (value: string) => new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(`${value}T12:00:00`));
const shortDate = (value: string) => new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));
const localDateInput = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; };
const localNextHourInput = () => { const now = new Date(); now.setHours(now.getHours() + 1, 0, 0, 0); return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`; };
const defaultStartTime = (day: string) => day === localDateInput() ? localNextHourInput() : "08:00";

export default function Home() {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [notification, setNotification] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [active, setActive] = useState(false);
  const [category, setCategory] = useState(categoryOptions[0]);
  const [date, setDate] = useState(localDateInput);
  const [time, setTime] = useState(localNextHourInput);
  const [planCheck, setPlanCheck] = useState<Day | null>(null);
  const [planCheckError, setPlanCheckError] = useState("");
  const [checkingPlan, setCheckingPlan] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [completedLoads, setCompletedLoads] = useState(0);

  useEffect(() => {
    fetch(`${API}/weather/forecast?latitude=12.9716&longitude=77.5946&location=Bengaluru`)
      .then((res) => { if (!res.ok) throw new Error("Weather unavailable"); return res.json(); })
      .then((res) => { setForecast(res.data); setLoading(false); })
      .catch(() => { setLoadError(true); setLoading(false); });
  }, []);

  const recommended = useMemo(() => forecast?.days.find((d) => d.status === "WASH") ?? forecast?.days[0], [forecast]);
  const plannedDay = forecast?.days.find((d) => d.date === date);
  const checkPlan = async () => {
    setCheckingPlan(true); setPlanCheckError(""); setPlanCheck(null);
    try {
      const response = await fetch(`${API}/recommendations/evaluate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude: 12.9716, longitude: 77.5946, date, start_time: time, category }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Weather check failed. You can still start laundry.");
      setPlanCheck(result.data);
    } catch (error) { setPlanCheckError(error instanceof Error ? error.message : "Weather check failed. You can still start laundry."); }
    finally { setCheckingPlan(false); }
  };
  const startSession = () => { setPlan({ category, date, time, estimated_hours: planCheck?.drying_hours ?? plannedDay?.drying_hours ?? 4 }); setActive(true); setPlannerOpen(false); setNotification("Laundry session started in this preview. Sessions are not saved after closing the page."); window.setTimeout(() => setNotification(""), 4000); };
  const nav = [{ icon: Sun, label: "Dashboard", href: "/", active: true }, { icon: Sparkles, label: "Recommendations", href: "/recommendations" }, { icon: Shirt, label: "Laundry", href: "/laundry" }, { icon: CalendarDays, label: "Calendar", href: "/calendar" }, { icon: ArrowDownRight, label: "History", href: "/history" }];
  const forecastStatus = (status: Day["status"]) => status === "WASH" ? ["EXCELLENT", ""] : status === "CAUTION" ? ["CAUTION", "caution"] : ["AVOID", "avoid"];

  return <div className="app-shell">
    <aside className="sidebar">
      <Brand />
      <div className="nav-label">WORKSPACE</div>
      <nav className="nav-list" aria-label="Main navigation">{nav.map(({ icon: Icon, label, href, active: current }) => <a key={label} href={href} className={`nav-item${current ? " active" : ""}`} aria-current={current ? "page" : undefined}><Icon className="nav-icon" strokeWidth={1.8} />{label}</a>)}</nav>
      <div className="nav-label" style={{ marginTop: 28 }}>PREFERENCES</div>
      <nav className="nav-list"><a href="/notifications" className="nav-item"><Bell className="nav-icon" strokeWidth={1.8} />Notifications</a><a href="/settings" className="nav-item"><Menu className="nav-icon" strokeWidth={1.8} />Settings</a></nav>
      <div className="sidebar-bottom"><div className="location-card"><div className="location-top"><MapPin size={15} color="#527c63" />{forecast?.location ?? "Bengaluru"}</div><div className="location-small">Sample location for this preview</div></div><div className="profile"><div className="avatar">G</div><div><div className="profile-name">Guest</div><div className="profile-caption">Local preview</div></div></div></div>
    </aside>
    <header className="mobile-header"><Brand /><div className="mobile-header-actions"><button className="icon-button" aria-label="Notifications"><Bell size={17} /></button><button className="icon-button" aria-label="Open menu" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu size={18} /></button></div></header>
    {isMobileMenuOpen && <div className="mobile-menu">{nav.map(({ icon: Icon, label, href }) => <a key={label} href={href} className="nav-item"><Icon className="nav-icon" />{label}</a>)}<a href="/notifications" className="nav-item"><Bell className="nav-icon"/>Notifications</a><a href="/settings" className="nav-item"><Menu className="nav-icon"/>Settings</a></div>}
    <main className="main">
      <div className="topbar"><div className="greeting"><h1>Good morning <span aria-hidden="true">☀️</span></h1><p>Here’s your laundry forecast for today.</p></div><div className="top-actions"><div className="today-pill"><CalendarDays size={14} />{new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "short" }).format(new Date())}</div><a className="icon-button" href="/notifications" aria-label="Notifications"><Bell size={17} /></a></div></div>
      {loadError && <div className="weather-error" role="status">Weather information is temporarily unavailable. Check that the WishWash weather service is running, then refresh.</div>}
      <div className="dashboard-grid">
        <div className="left-stack">
          <section className="card hero-card" aria-labelledby="weather-heading"><div className="card-heading"><span className="eyebrow" id="weather-heading">CURRENT WEATHER</span><span className="location-inline"><MapPin size={13} />{forecast?.location ?? "Bengaluru"} · Sample location</span></div>
            {loading ? <div className="weather-main"><div className="sun-icon"><CloudSun size={34}/></div><div><div className="temperature">—°</div><div className="condition">Checking the forecast…</div></div></div> : forecast ? <><div className="weather-main"><div className="sun-icon"><CloudSun size={35} strokeWidth={1.7} /></div><div><div className="temperature">{Math.round(forecast.current.temperature)}°</div><div className="condition">{forecast.current.condition}</div><div className="feels">Feels like {Math.round(forecast.current.feels_like)}°</div></div></div><div className="weather-stats"><WeatherStat icon={<CloudDrizzle size={12}/>} label="RAIN" value={`${forecast.current.rain_probability}%`} /><WeatherStat icon={<Droplets size={12}/>} label="HUMIDITY" value={`${forecast.current.humidity}%`} /><WeatherStat icon={<Wind size={12}/>} label="WIND" value={`${Math.round(forecast.current.wind_speed)} km/h`} /><WeatherStat icon={<Sun size={12}/>} label="DRYING" value={recommended ? `~${recommended.drying_hours} hrs` : "—"} /></div><div className="updated">{Date.now() - new Date(forecast.updated_at).getTime() > 15 * 60 * 1000 ? "Cached forecast · last updated " : "Forecast updated "}{new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(forecast.updated_at))} · Open-Meteo</div></> : <div className="weather-main"><div className="sun-icon"><CloudSun size={34}/></div><div><div className="temperature">—°</div><div className="condition">Weather unavailable</div></div></div>}
          </section>
          <section className="card recommendation-card" aria-labelledby="recommendation-heading"><div className="recommendation-title"><Sparkles size={14} /> YOUR NEXT RECOMMENDED WASH</div>{recommended ? <><div className="recommendation-head"><div><h2>{dayOfWeek(recommended.date)}, {shortDate(recommended.date)}</h2><p>{recommended.status === "WASH" ? "The weather is on your side." : "A clearer window is coming soon."}</p></div><span className="badge"><Check size={12}/>{forecastStatus(recommended.status)[0]}</span></div><div className="recommendation-meta"><Meta label="EXPECTED DRYING" value={`~${recommended.drying_hours} hours`} /><Meta label="RAIN-FREE WINDOW" value={`${recommended.rain_free_hours} hours`} /><Meta label="RAIN RISK DURING DRYING" value={`${recommended.drying_window_rain_probability}%`} /></div><div className="reason-list">{recommended.reasons.slice(0, 3).map((reason) => <span key={reason} className="reason"><Check size={12}/>{reason}</span>)}</div><button className="primary-button" onClick={() => { setDate(recommended.date); setTime(defaultStartTime(recommended.date)); setPlanCheck(null); setPlanCheckError(""); setPlannerOpen(true); }}>Plan this wash <ArrowRight size={14}/></button></> : <div className="weather-error">{loadError ? "Recommendations will appear when forecast data is available." : "Loading your recommendation…"}</div>}</section>
          <section className="card forecast-card"><div className="section-heading"><h2>7-day outlook</h2><a className="text-link" href="#forecast">Full forecast <ChevronRight size={13}/></a></div><div className="forecast-list">{forecast?.days.map((d, i) => { const [status, cls] = forecastStatus(d.status); return <div key={d.date} className={`forecast-day${i === 0 ? " highlight" : ""}`}><div className="day-name">{i === 0 ? "Today" : dayOfWeek(d.date)}</div><div className="day-icon">{d.rain_probability > 40 ? <CloudDrizzle size={20}/> : <Sun size={19}/>}</div><div className="day-temps">{Math.round(d.high)}° <span style={{ color: "#aab3ad", fontWeight: 500 }}>{Math.round(d.low)}°</span></div><div className="day-rain">{d.rain_probability}% rain</div><div className={`day-status ${cls}`}>{status}</div></div>; }) ?? Array.from({ length: 7 }, (_, i) => <div key={i} className="forecast-day"><div className="day-name">—</div><div className="day-icon"><Sun size={19}/></div><div className="day-temps">—°</div><div className="day-rain">—</div><div className="day-status">—</div></div>)}</div></section>
        </div>
        <div className="right-stack">
          <section className="card alert-card"><div className="alert-title"><span className="alert-bell"><Bell size={15}/></span> Browser notifications</div><p className="alert-copy">Allow WishWash to show notifications on this device. Rain monitoring and background push are not connected yet.</p><button className="alert-action" onClick={async () => { if (!("Notification" in window)) { setNotification("This browser does not support notifications."); } else { const permission = await Notification.requestPermission(); setNotification(permission === "granted" ? "Browser notification permission granted on this device." : "Notifications are off. In-app messages remain available."); } window.setTimeout(() => setNotification(""), 4500); }}>Set notification permission <ArrowRight size={13}/></button></section>
          <section className="card session-card"><div className="section-heading"><h2>{active ? "Laundry drying" : "Active laundry"}</h2>{active && <span className="badge"><span className="stat-dot"/>IN PROGRESS</span>}</div>{active && plan ? <div className="active-session"><div className="empty-session"><div className="empty-icon"><Shirt size={18}/></div><div><div className="empty-title">{plan.category}</div><div className="empty-copy">Started {plan.time} · estimated {plan.estimated_hours} hours</div></div></div><div className="progress-track"><span/></div><div className="session-foot"><span>Drying window in progress</span><button className="quiet-button" onClick={() => { setActive(false); setPlan(null); setCompletedLoads((count) => count + 1); }}>Mark complete</button></div></div> : <div className="empty-session"><div className="empty-icon"><Shirt size={18}/></div><div><div className="empty-title">Nothing drying right now</div><div className="empty-copy">Start a session to keep an eye on the weather.</div></div><button className="quiet-button" onClick={() => { setPlanCheck(null); setPlanCheckError(""); setDate(localDateInput()); setTime(localNextHourInput()); setPlannerOpen(true); }}><Plus size={12}/> Start</button></div>}</section>
          <section className="card stats-card"><div className="stats-head"><div className="stats-title">This month</div><div className="stats-month"><CalendarDays size={12}/>{new Intl.DateTimeFormat("en", { month: "long" }).format(new Date())} <ChevronRight size={12}/></div></div><div className="stats-grid"><StatCell value={String((active ? 1 : 0) + completedLoads)} label="Loads"/><StatCell value={String(completedLoads)} label="Completed" color="green"/><StatCell value="0" label="Interrupted" color="yellow"/><StatCell value={active ? "1" : "0"} label="Pending" color="gray"/></div></section>
        </div>
      </div>
      {notification && <div className="toast" role="status">{notification}<button aria-label="Dismiss" onClick={() => setNotification("")}><X size={14}/></button></div>}
      <InstallPrompt />
    </main>
    <nav className="mobile-bottom" aria-label="Mobile navigation"><a href="/" className="bottom-item active"><Sun/><span>Home</span></a><a href="/laundry" className="bottom-item"><Sparkles/><span>Plan</span></a><a href="/calendar" className="bottom-item"><CalendarDays/><span>Calendar</span></a><a href="/history" className="bottom-item"><ArrowDownRight/><span>History</span></a></nav>
    {plannerOpen && <div className="modal-backdrop" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setPlannerOpen(false); }}><section className="planner-modal" role="dialog" aria-modal="true" aria-labelledby="planner-title"><div className="modal-heading"><div><span className="eyebrow">LAUNDRY PLANNER</span><h2 id="planner-title">Plan a wash</h2></div><button className="icon-button" aria-label="Close" onClick={() => setPlannerOpen(false)}><X size={18}/></button></div><label>Laundry type<select value={category} onChange={(e) => { setCategory(e.target.value); setPlanCheck(null); }}>{categoryOptions.map((option) => <option key={option}>{option}</option>)}</select></label><div className="form-row"><label>Date<input type="date" value={date} onChange={(e) => { setDate(e.target.value); setPlanCheck(null); }}/></label><label>Start time<input type="time" value={time} onChange={(e) => { setTime(e.target.value); setPlanCheck(null); }}/></label></div><button className="check-weather-button" disabled={checkingPlan} onClick={checkPlan}>{checkingPlan ? "Checking forecast…" : "Check weather"}<CloudSun size={14}/></button>{planCheck && <div className={`plan-advice ${planCheck.status.toLowerCase()}`}><div className="plan-advice-title">{planCheck.status === "WASH" ? "Good drying window" : planCheck.status === "CAUTION" ? "Weather caution" : "Rain may interrupt drying"}</div><div>{planCheck.reasons.join(" · ")} Drying estimate: {planCheck.drying_hours} hours. Rain risk during drying: {planCheck.drying_window_rain_probability}%.</div></div>}{planCheckError && <div className="plan-check-error" role="status">{planCheckError}</div>}<div className="modal-actions"><button className="quiet-button" onClick={() => setPlannerOpen(false)}>Cancel</button><button className="primary-button" onClick={startSession}>Start laundry <ArrowRight size={14}/></button></div><p className="modal-note">You can still start laundry on a caution day or when a forecast is unavailable.</p></section></div>}
  </div>;
}

function Brand() { return <div className="brand"><div className="brand-mark"><CloudSun size={20} strokeWidth={1.8}/></div><div><div className="brand-name">WishWash</div><div className="brand-caption">Wash when the weather works.</div></div></div>; }
function WeatherStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="weather-stat"><div className="stat-label">{icon}{label}</div><div className="stat-value">{value}</div></div>; }
function Meta({ label, value }: { label: string; value: string }) { return <div><div className="meta-label">{label}</div><div className="meta-value">{value}</div></div>; }
function StatCell({ value, label, color }: { value: string; label: string; color?: string }) { return <div className="stat-cell"><div className="big-stat">{value}</div><div className="small-stat">{color && <span className={`stat-dot ${color === "green" ? "" : color}`} />}{label}</div></div>; }
