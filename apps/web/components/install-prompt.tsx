"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    setHidden(localStorage.getItem("wishwash-install-dismissed") === "true");
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);
  if (!installEvent || hidden) return null;
  const dismiss = () => { localStorage.setItem("wishwash-install-dismissed", "true"); setHidden(true); };
  const install = async () => {
    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === "accepted" || result.outcome === "dismissed") dismiss();
    setInstallEvent(null);
  };
  return <aside className="install-card" aria-label="Install WishWash"><div className="install-icon"><Download size={16}/></div><div className="install-copy"><strong>Install WishWash</strong><span>Keep your laundry planner close at hand.</span></div><button onClick={install}>Install</button><button className="install-dismiss" aria-label="Dismiss install prompt" onClick={dismiss}><X size={14}/></button></aside>;
}
