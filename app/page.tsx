"use client";

import { useEffect, useMemo, useState } from "react";

type Rule = { id: number; title: string; description: string; minutes: number; emoji: string; active: boolean; days: number[] };
const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKEND = [0, 6];
const initialRules: Rule[] = [
  { id: 1, title: "Geen straf op school", description: "Iedere schooldag: goed gedrag op school en geen straf.", minutes: 10, emoji: "🏫", active: true, days: WEEKDAYS },
  { id: 2, title: "Ochtendroutine", description: "Opstaan, tanden poetsen, aankleden, ontbijten en goed meewerken.", minutes: 10, emoji: "🌞", active: true, days: WEEKDAYS },
  { id: 3, title: "Avondroutine", description: "Spullen opruimen, tafel afruimen, bord leeg eten en goed meewerken.", minutes: 10, emoji: "🌙", active: true, days: [0, 1, 2, 3, 4, 5, 6] },
  { id: 4, title: "Goed luisteren", description: "Goed luisteren naar papa, mama en andere volwassenen.", minutes: 10, emoji: "👂", active: true, days: WEEKDAYS },
  { id: 5, title: "Kleine huishoudelijke taken", description: "Een kleine taak thuis doen zonder gedoe en goed meewerken.", minutes: 10, emoji: "🧹", active: true, days: [1, 2, 4] },
  { id: 6, title: "Goed luisteren bij voetbaltraining", description: "Op woensdag en vrijdag goed luisteren naar de trainer en je best doen.", minutes: 10, emoji: "⚽", active: true, days: [3, 5] },
  { id: 7, title: "Kamer opruimen", description: "In het weekend je kamer netjes opruimen.", minutes: 10, emoji: "🧸", active: true, days: WEEKEND },
  { id: 8, title: "Koffie halen in de ochtend", description: "In het weekend 's ochtends koffie halen voor papa en mama.", minutes: 10, emoji: "☕", active: true, days: WEEKEND },
  { id: 9, title: "Ontbijt maken", description: "In het weekend helpen om het ontbijt klaar te maken.", minutes: 10, emoji: "🥣", active: true, days: WEEKEND },
  { id: 10, title: "Goed luisteren tijdens het voetballen", description: "Op zaterdag goed luisteren tijdens het voetballen.", minutes: 10, emoji: "⚽", active: true, days: [6] },
  { id: 11, title: "Schermvrij spelen", description: "Leg telefoon, tablet en tv weg. Speel met speelgoed, maak een puzzel, bouw LEGO of verzin zelf iets leuks zonder scherm.", minutes: 10, emoji: "🧩", active: true, days: WEEKDAYS },
];
type DailyLog = { date: string; rules: Rule[]; checked: number[]; earnedMinutes: number; completedCount: number; totalCount: number; bedtime: string };
type Tab = "today" | "goals" | "overview" | "logbook";

function timeToMinutes(time: string) { const [h, m] = time.split(":").map(Number); return h * 60 + m; }
function formatTime(minutes: number) { const m = ((minutes % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }

export default function Home() {
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [todayKey, setTodayKey] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; });
  const [checked, setChecked] = useState<number[]>([]);
  const [history, setHistory] = useState<DailyLog[]>([]);
  const [baseTime, setBaseTime] = useState("19:00");
  const [maxTime, setMaxTime] = useState("20:00");
  const [parentOpen, setParentOpen] = useState(false);
  const [parentCode, setParentCode] = useState("");
  const [codeEntry, setCodeEntry] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [newTitle, setNewTitle] = useState("");
  const [newMinutes, setNewMinutes] = useState(10);
  const [celebration, setCelebration] = useState(false);
  const [lastScored, setLastScored] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState("");

  const [remoteHydrated, setRemoteHydrated] = useState(false);

  function applySavedData(data: any) {
    if (Array.isArray(data.rules) && data.rules.some((r: Rule) => Array.isArray(r.days))) {
      const savedRules = data.rules as Rule[];
      setRules([...savedRules, ...initialRules.filter(defaultRule => !savedRules.some(savedRule => savedRule.id === defaultRule.id))]);
    }
    const d = new Date();
    const currentKey = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    if (Array.isArray(data.history)) setHistory(data.history as DailyLog[]);
    if (data.checkedDate === currentKey && Array.isArray(data.checked)) setChecked(data.checked);
    if (data.baseTime) setBaseTime(data.baseTime);
    if (data.maxTime) setMaxTime(data.maxTime);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        if (!response.ok) throw new Error("Shared storage unavailable");
        const remote = await response.json();
        if (cancelled) return;
        if (remote.state) {
          applySavedData(remote.state);
          localStorage.setItem("tobi-voetbalmissie-v3", JSON.stringify(remote.state));
        } else {
          const saved = localStorage.getItem("tobi-voetbalmissie-v3");
          const localData = saved ? JSON.parse(saved) : {
            rules: initialRules, checked: [], checkedDate: todayKey, baseTime: "19:00", maxTime: "20:00", history: [], todayRules: initialRules
          };
          if (saved) applySavedData(localData);
          const init = await fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: localData, initialize: true }) });
          if (!init.ok) throw new Error("Could not initialize shared storage");
        }
      } catch (error) {
        console.error("Shared state unavailable; using this device's saved data", error);
        try {
          const saved = localStorage.getItem("tobi-voetbalmissie-v3");
          if (saved) applySavedData(JSON.parse(saved));
        } catch { /* Use default state when local data is unavailable. */ }
      } finally {
        if (!cancelled) { setLoaded(true); setRemoteHydrated(true); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loaded || !remoteHydrated) return;
    const state = { rules, checked, checkedDate: todayKey, baseTime, maxTime, history, todayRules: activeRules };
    localStorage.setItem("tobi-voetbalmissie-v3", JSON.stringify(state));
    const timeout = window.setTimeout(() => {
      fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state }) })
        .then(response => { if (!response.ok) throw new Error("Opslaan mislukt"); })
        .catch(error => { console.error("Shared save failed", error); setToast("Let op: synchroniseren is tijdelijk niet gelukt."); });
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [rules, checked, todayKey, baseTime, maxTime, history, loaded, remoteHydrated, activeRules]);

  useEffect(() => {
    if (!loaded || !remoteHydrated) return;
    const syncFromServer = async () => {
      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        if (!response.ok) return;
        const remote = await response.json();
        if (!remote.state) return;
        const current = { rules, checked, checkedDate: todayKey, baseTime, maxTime, history, todayRules: activeRules };
        if (JSON.stringify(remote.state) === JSON.stringify(current)) return;
        const d = new Date();
        const currentKey = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        if (remote.state.checkedDate !== currentKey) return;
        applySavedData(remote.state);
        localStorage.setItem("tobi-voetbalmissie-v3", JSON.stringify(remote.state));
      } catch (error) { console.error("Shared refresh failed", error); }
    };
    const interval = window.setInterval(syncFromServer, 5000);
    window.addEventListener("focus", syncFromServer);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", syncFromServer); };
  }, [loaded, remoteHydrated, rules, checked, todayKey, baseTime, maxTime, history, activeRules]);

  // At midnight, archive the finished day and start fresh for the new date.
  useEffect(() => {
    const refreshDay = () => {
      const now = new Date();
      const currentKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      const savedRaw = localStorage.getItem("tobi-voetbalmissie-v3");
      if (savedRaw) {
        try {
          const data = JSON.parse(savedRaw);
          const previousDate = data.checkedDate as string | undefined;
          if (previousDate && previousDate !== currentKey) {
            const oldHistory: DailyLog[] = Array.isArray(data.history) ? data.history : [];
            const archived = new Set(oldHistory.map(log => log.date));
            const oldRules: Rule[] = Array.isArray(data.todayRules) ? data.todayRules : (Array.isArray(data.rules) ? data.rules : initialRules);
            const oldChecked: number[] = Array.isArray(data.checked) ? data.checked : [];
            const doneRules = oldRules.filter(rule => oldChecked.includes(rule.id));
            const earnedMinutes = doneRules.reduce((sum, rule) => sum + rule.minutes, 0) + (oldRules.length === 5 && oldChecked.filter(id => oldRules.some(rule => rule.id === id)).length === 5 ? 10 : 0);
            const maxBonus = Math.max(0, timeToMinutes(data.maxTime || "20:00") - timeToMinutes(data.baseTime || "19:00"));
            const log: DailyLog = {
              date: previousDate,
              rules: oldRules,
              checked: oldChecked,
              earnedMinutes: Math.min(earnedMinutes, maxBonus),
              completedCount: doneRules.length,
              totalCount: oldRules.length,
              bedtime: formatTime(timeToMinutes(data.baseTime || "19:00") + Math.min(earnedMinutes, maxBonus))
            };
            const updatedHistory = [...oldHistory.filter(item => item.date !== previousDate), log].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 365);
            localStorage.setItem("tobi-voetbalmissie-v3", JSON.stringify({ ...data, history: updatedHistory }));
            setHistory(updatedHistory);
          }
        } catch { /* Preserve the app if older saved data cannot be archived. */ }
      }
      setTodayKey(previousKey => {
        if (previousKey !== currentKey) {
          setChecked([]);
          setCelebration(false);
          setToast("Een nieuwe dag begint! Je uitdagingen zijn weer klaar.");
          return currentKey;
        }
        return previousKey;
      });
    };
    refreshDay();
    const intervalId = window.setInterval(refreshDay, 15_000);
    window.addEventListener("focus", refreshDay);
    document.addEventListener("visibilitychange", refreshDay);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshDay);
      document.removeEventListener("visibilitychange", refreshDay);
    };
  }, []);

  const today = new Date();
  const dayNumber = today.getDay();
  const rotationDay = dayNumber >= 1 && dayNumber <= 5 && today.getDate() % 2 === 0;
  const activeRules = rules.filter(r => {
    if (!r.active || !r.days?.includes(dayNumber)) return false;
    if (r.title === "Kleine huishoudelijke taken" && rotationDay) return false;
    if (r.title === "Schermvrij spelen" && !rotationDay) return false;
    return true;
  }).slice(0, 5);
  const checkedCount = activeRules.filter(r => checked.includes(r.id)).length;
  const baseEarned = useMemo(() => activeRules.filter(r => checked.includes(r.id)).reduce((sum, r) => sum + r.minutes, 0), [activeRules, checked]);
  const perfectRoundBonus = activeRules.length === 5 && checkedCount === 5 ? 10 : 0;
  const earned = baseEarned + perfectRoundBonus;
  const maxBonus = Math.max(0, timeToMinutes(maxTime) - timeToMinutes(baseTime));
  const credited = Math.min(earned, maxBonus);
  const bedtime = formatTime(timeToMinutes(baseTime) + credited);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("tobi-voetbalmissie-v3", JSON.stringify({ rules, checked, checkedDate: todayKey, baseTime, maxTime, history, todayRules: activeRules }));
  }, [rules, checked, todayKey, baseTime, maxTime, history, loaded, activeRules]);

  function toggleRule(rule: Rule) {
    if (!rule.active) return;
    if (checked.includes(rule.id)) {
      setChecked(old => old.filter(id => id !== rule.id));
      setToast("Vinkje aangepast. Je score is bijgewerkt.");
      return;
    }
    setChecked(old => [...old, rule.id]);
    setLastScored(rule.title);
    setCelebration(true);
    setToast(`GOAL! +${rule.minutes} minuten verdiend!${checkedCount === 4 && activeRules.length === 5 ? " En 10 bonusminuten voor alle 5 doelen!" : ""}`);
    window.setTimeout(() => setCelebration(false), 1800);
    window.setTimeout(() => setToast(""), 2600);
  }

  function openParent() {
    if (parentOpen) { setParentOpen(false); return; }
    setCodeEntry(true);
  }

  function addRule() {
    if (!newTitle.trim()) return;
    if (rules.length >= 15) { setToast("Je kunt maximaal 15 uitdagingen instellen in totaal."); return; }
    setRules(old => [...old, { id: Math.max(0, ...old.map(r => r.id)) + 1, title: newTitle.trim(), description: newTitle.trim(), minutes: 10, emoji: "⚽", active: true, days: [0,1,2,3,4,5,6] }]);
    setNewTitle("");
    setNewMinutes(10);
    setToast("Nieuwe spelregel toegevoegd!");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Tobi's Voetbalmissie">
          <span className="brand-ball">⚽</span><span className="brand-copy"><b>Tobi’s</b><strong>VOETBALMISSIE</strong></span>
        </a>
        <nav className="main-nav" aria-label="Hoofdnavigatie">
          <button className={tab === "today" ? "nav-item selected" : "nav-item"} onClick={() => setTab("today")}>⌂ <span>Vandaag</span></button>
          <button className={tab === "goals" ? "nav-item selected" : "nav-item"} onClick={() => setTab("goals")}>🏆 <span>Mijn goals</span></button>
          <button className={tab === "overview" ? "nav-item selected" : "nav-item"} onClick={() => setTab("overview")}>▥ <span>Overzicht</span></button>\n          <button className={tab === "logbook" ? "nav-item selected" : "nav-item"} onClick={() => setTab("logbook")}>📖 <span>Logboek</span></button>
        </nav>
        <button className="parent-button" onClick={openParent}>⚙ <span>Ouderinstellingen</span></button>
      </header>

      {tab === "today" && <>
        <section className="hero">
          <div className="hero-art">
            <div className="stadium-lights">✦ ✧ ✦ ✧ ✦</div>
            <div className="speech-bubble">Elke goede actie<br />is een doelpunt! 💪</div>
            <div className="hero-player" aria-hidden="true"><img src="/tobi-avatar.svg" alt="" /></div>
            <div className="kick-ball" aria-hidden="true">⚽</div>
            <div className="goal-burst" aria-hidden="true">GOAL! <span>★</span></div>
            <div className="pitch-lines" />
            <div className="hero-caption"><span className="caption-tag">DE MISSIE VAN VANDAAG</span><h1>Klaar om te scoren, Tobi?</h1><p>Elke goede actie brengt je dichter bij je beloning.</p></div>
          </div>
          <aside className="bedtime-card">
            <div className="bedtime-label">🌙 Jouw bedtijd vanavond</div>
            <div className="bedtime-time">{bedtime}</div>
            <div className="bedtime-progress"><span style={{ width: `${maxBonus ? Math.min(100, credited / maxBonus * 100) : 0}%` }} /></div>
            <div className="bedtime-earned">◷ <b>+ {credited} minuten verdiend!</b></div>{perfectRoundBonus > 0 && <div className="perfect-bonus">🏆 Perfecte ronde: +10 bonusminuten!</div>}
            <div className="bedtime-foot">Standaard: {baseTime} <span>•</span> Maximaal: {maxTime}</div>{perfectRoundBonus > 0 && <div className="perfect-bonus">🏆 Perfecte ronde: +10 bonusminuten!</div>}
          </aside>
        </section>

        <section className="dashboard-grid">
          <div className="actions-panel panel">
            <div className="section-heading"><div><span className="heading-ball">⚽</span><div><h2>Wat heb je vandaag goed gedaan?</h2><p>Tik op een kaart als je deze actie hebt verdiend.</p></div></div><span className="score-pill">{checkedCount}/{activeRules.length} gescoord</span></div>
            <div className="action-grid">
              {activeRules.map((rule, index) => {
                const isChecked = checked.includes(rule.id);
                return <button key={rule.id} className={`action-card ${isChecked ? "completed" : ""} ${celebration && lastScored === rule.title ? "scoring" : ""}`} onClick={() => toggleRule(rule)} style={{ animationDelay: `${index * 65}ms` }}>
                  <span className="action-emoji">{rule.emoji}</span><strong>{rule.title}</strong><span className="action-description">{rule.description}</span><span className="action-minutes">◷ + {rule.minutes} minuten</span>
                  <span className="action-check">{isChecked ? "✓" : "+"}</span>
                  {isChecked && <span className="mini-confetti">✦</span>}
                </button>;
              })}
              {activeRules.length === 0 && <p className="empty-state">Papa mag eerst een paar spelregels toevoegen.</p>}
            </div>
          </div>

          <aside className="reward-column">
            <div className="balls-card panel">
              <div className="section-heading compact"><h2>Mijn voetbalballen</h2><span className="score-pill">{checkedCount}</span></div>
              <p className="muted">{`Vandaag: ${["zondag","maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag"][dayNumber]}`} • Maximaal 5 uitdagingen • 10 minuten per goal</p>
              <div className="ball-tray">{Array.from({ length: 5 }, (_, i) => <span key={i} className={i < checkedCount ? "earned-ball" : "empty-ball"}>{i < checkedCount ? "⚽" : "◯"}</span>)}</div>
              <div className="reward-message"><div className="training-kid">🏃🏻‍♂️⚽</div><div><b>{checkedCount >= 5 ? "Wat een kampioen!" : checkedCount >= 3 ? "Je bent lekker bezig!" : "Op naar de volgende goal!"}</b><p>{Math.max(0, 5 - checkedCount)} {Math.max(0, 5 - checkedCount) === 1 ? "bal" : "ballen"} tot jouw mini-overwinning.</p></div></div>
            </div>
            <div className="pep-talk panel"><span className="trophy">🏆</span><div><b>Jij kunt dit, Tobi!</b><p>“Kleine goede daden maken grote doelpunten.”</p></div><span className="pep-ball">⚽</span></div>
          </aside>
        </section>
      </>}

      {tab === "goals" && <section className="subpage panel"><span className="big-emoji">🏆</span><h1>Mijn goals</h1><p className="muted">Elke dag kun je nieuwe voetbalballen verdienen door goede acties te doen.</p><div className="goal-summary"><b>{checkedCount} / 5</b><span>uitdagingen vandaag gescoord</span><small>Bij alle vijf krijg je 10 bonusminuten!</small></div><div className="big-ball-row">{Array.from({ length: 5 }, (_, i) => <span key={i} className={i < checkedCount ? "earned-ball" : "empty-ball"}>{i < checkedCount ? "⚽" : "◯"}</span>)}</div><h2>De missie</h2><p>Er zijn maximaal vijf uitdagingen per dag. Elke goal levert 10 minuten op. Haal je alle vijf, dan scoor je 10 bonusminuten: samen 60 minuten extra bedtijd!</p><button className="primary-button" onClick={() => setTab("today")}>Terug naar het veld ⚽</button></section>}

      {tab === "overview" && <section className="subpage panel"><span className="big-emoji">📋</span><h1>Dagoverzicht</h1><p className="muted">Dit is je score voor vandaag op dit apparaat.</p><div className="overview-stats"><div><span>Verdiende minuten</span><b>+{credited}</b></div><div><span>Bedtijd</span><b>{bedtime}</b></div><div><span>Acties afgevinkt</span><b>{checkedCount}/{activeRules.length}</b></div></div><h2>Jouw acties</h2>{activeRules.map(r => <div className="overview-row" key={r.id}><span>{r.emoji} {r.title}</span><b className={checked.includes(r.id) ? "green-text" : "muted"}>{checked.includes(r.id) ? `✓ +${r.minutes} min` : "Nog te doen"}</b></div>)}<button className="primary-button" onClick={() => setTab("today")}>Terug naar het veld ⚽</button></section>}

      {tab === "logbook" && <section className="subpage panel"><span className="big-emoji">📖</span><h1>Dagboek van Tobi</h1><p className="muted">Afgesloten dagen met de uitdagingen die golden, de goals die je haalde en je verdiende minuten. Een dag wordt automatisch afgesloten om 00:00 uur.</p>{history.length === 0 ? <p className="empty-state">Er zijn nog geen afgesloten dagen. Je eerste dag verschijnt hier na middernacht.</p> : <div className="logbook-list">{history.map(log => <article className="overview-row" key={log.date} style={{ display: "block", padding: "14px 0" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><strong>{log.date}</strong><b className="green-text">+{log.earnedMinutes} minuten · {log.completedCount}/{log.totalCount} goals</b></div><p className="muted">Berekende bedtijd: {log.bedtime}</p>{log.rules.map(rule => <div key={rule.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 5 }}><span>{rule.emoji} {rule.title}</span><span>{log.checked.includes(rule.id) ? `✓ +${rule.minutes} min` : "Niet behaald"}</span></div>)}</article>)}</div>}<button className="primary-button" onClick={() => setTab("today")}>Terug naar het veld ⚽</button></section>}

      <footer className="footer-note"><span>⚽</span> Kleine goede daden maken grote doelpunten <span>⚽</span><small>© Iselto</small></footer>

      {toast && <div className="toast" role="status">{toast}</div>}
      {celebration && <div className="celebration-layer" aria-live="polite"><div className="celebration-card"><div className="celebration-ball">⚽</div><div className="celebration-word">GOOOOAL!</div><h2>TOP GESCOORD, TOBI!</h2><p>{lastScored}</p><strong>+ extra bedtijd verdiend!</strong><div className="confetti-rain">🎉 ✨ 🎊 ⚽ ✨ 🎉</div></div></div>}

      {codeEntry && <div className="modal-backdrop"><div className="parent-modal panel"><button className="modal-close" onClick={() => setCodeEntry(false)}>×</button><span className="big-emoji">🔐</span><h2>Ouderinstellingen</h2><p className="muted">Voer de oudercode in om de regels te beheren.</p><form onSubmit={e => { e.preventDefault(); if (parentCode === "2019") { setParentOpen(true); setCodeEntry(false); setParentCode(""); } else { setToast("Dat is niet de juiste code. Probeer opnieuw."); } }}><input aria-label="Oudercode" type="password" inputMode="numeric" value={parentCode} onChange={e => setParentCode(e.target.value)} placeholder="Oudercode" autoFocus /><button className="primary-button" type="submit">Ontgrendelen</button></form><small>Startcode demo: 2019. Verander deze in de echte, beveiligde versie.</small></div></div>}

      {parentOpen && <div className="modal-backdrop"><div className="parent-modal settings-modal panel"><button className="modal-close" onClick={() => setParentOpen(false)}>×</button><span className="big-emoji">⚙️</span><h2>Spelregels van papa</h2><p className="muted">Pas de bedtijd en de beloningen aan.</p><div className="settings-fields"><label>Standaard bedtijd<select value={baseTime} onChange={e => setBaseTime(e.target.value)}><option>18:30</option><option>19:00</option><option>19:30</option><option>20:00</option></select></label><label>Uiterste bedtijd<select value={maxTime} onChange={e => setMaxTime(e.target.value)}><option>19:30</option><option>20:00</option></select></label></div><h3>Uitdagingen per dag</h3><p className="settings-warning">De app kiest automatisch maximaal vijf uitdagingen voor vandaag. Zet een regel uit om die niet meer op de ingeplande dagen te tonen.</p><div className="rule-editor">{rules.map(r => <div className="rule-editor-row" key={r.id}><label className="rule-toggle"><input type="checkbox" checked={r.active} onChange={e => setRules(old => old.map(x => x.id === r.id ? { ...x, active: e.target.checked } : x))}/><span>{r.emoji} <b>{r.title}</b><small>{r.description} · {r.days.map(d => ["zo","ma","di","wo","do","vr","za"][d]).join(", ")}</small></span></label><div className="minute-stepper"><b>{r.minutes} min</b></div><button className="delete-rule" onClick={() => { setRules(old => old.filter(x => x.id !== r.id)); setChecked(old => old.filter(id => id !== r.id)); }} aria-label={`Verwijder ${r.title}`}>×</button></div>)}</div><h3>Nieuwe uitdaging ({rules.length}/15)</h3>{rules.length < 15 ? <form className="add-rule-form" onSubmit={e => { e.preventDefault(); addRule(); }}><input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Bijv. vriendelijk tegen iedereen" aria-label="Naam nieuwe spelregel"/><select value={newMinutes} onChange={e => setNewMinutes(Number(e.target.value))} aria-label="Minuten"><option value={10}>10 min</option></select><button className="primary-button" type="submit">Toevoegen +</button></form> : <p className="settings-warning">Je hebt alle 15 uitdagingen ingesteld. Verwijder eerst een regel om een andere toe te voegen.</p>}<button className="save-button" onClick={() => { setParentOpen(false); setToast("Instellingen opgeslagen op dit apparaat."); }}>Opslaan en sluiten ✓</button><p className="settings-warning">Demo-opslag is lokaal op dit apparaat. De productieversie heeft een echte ouderlogin en gedeelde database nodig.</p></div></div>}
    </main>
  );
}
