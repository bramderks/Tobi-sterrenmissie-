"use client";

import { useEffect, useMemo, useState } from "react";

type Rule = { id: number; title: string; minutes: number; emoji: string; active: boolean };
const initialRules: Rule[] = [
  { id: 1, title: "Goed geluisterd naar papa en mama", minutes: 10, emoji: "👂", active: true },
  { id: 2, title: "Niet op het bord gestaan op school", minutes: 10, emoji: "🏫", active: true },
  { id: 3, title: "Goed geholpen thuis", minutes: 10, emoji: "🤝", active: true },
  { id: 4, title: "Netjes mijn spullen opgeruimd", minutes: 10, emoji: "🧹", active: true },
  { id: 5, title: "Goed mijn best gedaan met voetbal", minutes: 10, emoji: "⚽", active: true },
];
type Tab = "today" | "goals" | "overview";

function timeToMinutes(time: string) { const [h, m] = time.split(":").map(Number); return h * 60 + m; }
function formatTime(minutes: number) { const m = ((minutes % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }

export default function Home() {
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [checked, setChecked] = useState<number[]>([]);
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tobi-voetbalmissie-v2");
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data.rules)) setRules(data.rules);
        if (Array.isArray(data.checked)) setChecked(data.checked);
        if (data.baseTime) setBaseTime(data.baseTime);
        if (data.maxTime) setMaxTime(data.maxTime);
      }
    } catch { /* Start with the default setup if saved data is unavailable. */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("tobi-voetbalmissie-v2", JSON.stringify({ rules, checked, baseTime, maxTime }));
  }, [rules, checked, baseTime, maxTime, loaded]);

  const activeRules = rules.filter(r => r.active).slice(0, 5);
  const checkedCount = activeRules.filter(r => checked.includes(r.id)).length;
  const baseEarned = useMemo(() => activeRules.filter(r => checked.includes(r.id)).reduce((sum, r) => sum + r.minutes, 0), [activeRules, checked]);
  const perfectRoundBonus = activeRules.length === 5 && checkedCount === 5 ? 10 : 0;
  const earned = baseEarned + perfectRoundBonus;
  const maxBonus = Math.max(0, timeToMinutes(maxTime) - timeToMinutes(baseTime));
  const credited = Math.min(earned, maxBonus);
  const bedtime = formatTime(timeToMinutes(baseTime) + credited);

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
    if (rules.length >= 5) { setToast("Je kunt maximaal 5 uitdagingen instellen."); return; }
    setRules(old => [...old, { id: Math.max(0, ...old.map(r => r.id)) + 1, title: newTitle.trim(), minutes: 10, emoji: "⚽", active: true }]);
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
          <button className={tab === "overview" ? "nav-item selected" : "nav-item"} onClick={() => setTab("overview")}>▥ <span>Overzicht</span></button>
        </nav>
        <button className="parent-button" onClick={openParent}>⚙ <span>Ouderinstellingen</span></button>
      </header>

      {tab === "today" && <>
        <section className="hero">
          <div className="hero-art">
            <div className="stadium-lights">✦ ✧ ✦ ✧ ✦</div>
            <div className="speech-bubble">Elke goede actie<br />is een doelpunt! 💪</div>
            <div className="hero-player" aria-hidden="true">🧒🏻</div>
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
                  <span className="action-emoji">{rule.emoji}</span><strong>{rule.title}</strong><span className="action-minutes">◷ + {rule.minutes} minuten</span>
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
              <p className="muted">Maximaal 5 uitdagingen per dag • 10 minuten per goal</p>
              <div className="ball-tray">{Array.from({ length: Math.max(7, activeRules.length) }, (_, i) => <span key={i} className={i < checkedCount ? "earned-ball" : "empty-ball"}>{i < checkedCount ? "⚽" : "◯"}</span>)}</div>
              <div className="reward-message"><div className="training-kid">🏃🏻‍♂️⚽</div><div><b>{checkedCount >= 5 ? "Wat een kampioen!" : checkedCount >= 3 ? "Je bent lekker bezig!" : "Op naar de volgende goal!"}</b><p>{Math.max(0, 5 - checkedCount)} {Math.max(0, 5 - checkedCount) === 1 ? "bal" : "ballen"} tot jouw mini-overwinning.</p></div></div>
            </div>
            <div className="pep-talk panel"><span className="trophy">🏆</span><div><b>Jij kunt dit, Tobi!</b><p>“Kleine goede daden maken grote doelpunten.”</p></div><span className="pep-ball">⚽</span></div>
          </aside>
        </section>
      </>}

      {tab === "goals" && <section className="subpage panel"><span className="big-emoji">🏆</span><h1>Mijn goals</h1><p className="muted">Elke dag kun je nieuwe voetbalballen verdienen door goede acties te doen.</p><div className="goal-summary"><b>{checkedCount} / 5</b><span>uitdagingen vandaag gescoord</span><small>Bij alle vijf krijg je 10 bonusminuten!</small></div><div className="big-ball-row">{Array.from({ length: Math.max(5, activeRules.length) }, (_, i) => <span key={i} className={i < checkedCount ? "earned-ball" : "empty-ball"}>{i < checkedCount ? "⚽" : "◯"}</span>)}</div><h2>De missie</h2><p>Er zijn maximaal vijf uitdagingen per dag. Elke goal levert 10 minuten op. Haal je alle vijf, dan scoor je 10 bonusminuten: samen 60 minuten extra bedtijd!</p><button className="primary-button" onClick={() => setTab("today")}>Terug naar het veld ⚽</button></section>}

      {tab === "overview" && <section className="subpage panel"><span className="big-emoji">📋</span><h1>Dagoverzicht</h1><p className="muted">Dit is je score voor vandaag op dit apparaat.</p><div className="overview-stats"><div><span>Verdiende minuten</span><b>+{credited}</b></div><div><span>Bedtijd</span><b>{bedtime}</b></div><div><span>Acties afgevinkt</span><b>{checkedCount}/{activeRules.length}</b></div></div><h2>Jouw acties</h2>{activeRules.map(r => <div className="overview-row" key={r.id}><span>{r.emoji} {r.title}</span><b className={checked.includes(r.id) ? "green-text" : "muted"}>{checked.includes(r.id) ? `✓ +${r.minutes} min` : "Nog te doen"}</b></div>)}<button className="primary-button" onClick={() => setTab("today")}>Terug naar het veld ⚽</button></section>}

      <footer className="footer-note"><span>⚽</span> Kleine goede daden maken grote doelpunten <span>⚽</span></footer>

      {toast && <div className="toast" role="status">{toast}</div>}
      {celebration && <div className="celebration-layer" aria-live="polite"><div className="celebration-card"><div className="celebration-ball">⚽</div><div className="celebration-word">GOOOOAL!</div><h2>TOP GESCOORD, TOBI!</h2><p>{lastScored}</p><strong>+ extra bedtijd verdiend!</strong><div className="confetti-rain">🎉 ✨ 🎊 ⚽ ✨ 🎉</div></div></div>}

      {codeEntry && <div className="modal-backdrop"><div className="parent-modal panel"><button className="modal-close" onClick={() => setCodeEntry(false)}>×</button><span className="big-emoji">🔐</span><h2>Ouderinstellingen</h2><p className="muted">Voer de oudercode in om de regels te beheren.</p><form onSubmit={e => { e.preventDefault(); if (parentCode === "2019") { setParentOpen(true); setCodeEntry(false); setParentCode(""); } else { setToast("Dat is niet de juiste code. Probeer opnieuw."); } }}><input aria-label="Oudercode" type="password" inputMode="numeric" value={parentCode} onChange={e => setParentCode(e.target.value)} placeholder="Oudercode" autoFocus /><button className="primary-button" type="submit">Ontgrendelen</button></form><small>Startcode demo: 2019. Verander deze in de echte, beveiligde versie.</small></div></div>}

      {parentOpen && <div className="modal-backdrop"><div className="parent-modal settings-modal panel"><button className="modal-close" onClick={() => setParentOpen(false)}>×</button><span className="big-emoji">⚙️</span><h2>Spelregels van papa</h2><p className="muted">Pas de bedtijd en de beloningen aan.</p><div className="settings-fields"><label>Standaard bedtijd<select value={baseTime} onChange={e => setBaseTime(e.target.value)}><option>18:30</option><option>19:00</option><option>19:30</option><option>20:00</option></select></label><label>Uiterste bedtijd<select value={maxTime} onChange={e => setMaxTime(e.target.value)}><option>19:30</option><option>20:00</option></select></label></div><h3>Actieve spelregels</h3><div className="rule-editor">{rules.map(r => <div className="rule-editor-row" key={r.id}><label className="rule-toggle"><input type="checkbox" checked={r.active} onChange={e => setRules(old => old.map(x => x.id === r.id ? { ...x, active: e.target.checked } : x))}/><span>{r.emoji} {r.title}</span></label><div className="minute-stepper"><button onClick={() => setRules(old => old.map(x => x.id === r.id ? { ...x, minutes: Math.max(0, x.minutes - 5) } : x))} aria-label="Vijf minuten minder">−</button><b>{r.minutes} min</b><button onClick={() => setRules(old => old.map(x => x.id === r.id ? { ...x, minutes: Math.min(60, x.minutes + 5) } : x))} aria-label="Vijf minuten meer">+</button></div><button className="delete-rule" onClick={() => { setRules(old => old.filter(x => x.id !== r.id)); setChecked(old => old.filter(id => id !== r.id)); }} aria-label={`Verwijder ${r.title}`}>×</button></div>)}</div><h3>Nieuwe uitdaging ({rules.length}/5)</h3>{rules.length < 5 ? <form className="add-rule-form" onSubmit={e => { e.preventDefault(); addRule(); }}><input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Bijv. vriendelijk tegen iedereen" aria-label="Naam nieuwe spelregel"/><select value={newMinutes} onChange={e => setNewMinutes(Number(e.target.value))} aria-label="Minuten"><option value={10}>10 min</option></select><button className="primary-button" type="submit">Toevoegen +</button></form> : <p className="settings-warning">Je hebt alle 5 uitdagingen ingesteld. Verwijder eerst een regel om een andere toe te voegen.</p>}<button className="save-button" onClick={() => { setParentOpen(false); setToast("Instellingen opgeslagen op dit apparaat."); }}>Opslaan en sluiten ✓</button><p className="settings-warning">Demo-opslag is lokaal op dit apparaat. De productieversie heeft een echte ouderlogin en gedeelde database nodig.</p></div></div>}
    </main>
  );
}
