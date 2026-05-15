"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

export default function Page() {
  const [config, setConfig] = useState([]);
  const [logs, setLogs] = useState([]);

  const [showConfig, setShowConfig] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [meal, setMeal] = useState("Colazione");

  const [selectedFood, setSelectedFood] = useState("");

  const [newFood, setNewFood] = useState("");
  const [frequency, setFrequency] = useState("");
  const [configMeal, setConfigMeal] = useState("Colazione");

  const meals = ["Colazione", "Spuntino", "Pranzo", "Cena"];

  // ✅ LOAD
  useEffect(() => {
    const c = localStorage.getItem("config");
    const l = localStorage.getItem("logs");
    if (c) setConfig(JSON.parse(c));
    if (l) setLogs(JSON.parse(l));
  }, []);

  useEffect(() => localStorage.setItem("config", JSON.stringify(config)), [config]);
  useEffect(() => localStorage.setItem("logs", JSON.stringify(logs)), [logs]);

  // ✅ DATE
  const formatDate = (date) => new Date(date).toISOString().split("T")[0];
  const today = formatDate(new Date());

  // ✅ WEEK
  const getWeek = (date) => {
    const d = new Date(date);
    return Math.ceil(
      ((d - new Date(d.getFullYear(), 0, 1)) / 86400000 +
        new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7
    );
  };

  const currentWeek = getWeek(new Date());

  // ✅ IMPORT FILE
  const importFromFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm("Sovrascrivere configurazione?")) return;

    const reader = new FileReader();
    reader.onload = (ev) => parseText(ev.target.result);
    reader.readAsText(file);
  };

  const parseText = (text) => {
    const lines = text.split("\n");
    let currentMeal = null;
    const newConfig = [];

    lines.forEach((line) => {
      line = line.trim();
      if (!line) return;

      if (meals.includes(line)) {
        currentMeal = line;
        return;
      }

      const parts = line.split(" ");
      const food = parts[0];
      const freq = parts[1] ? Number(parts[1]) : null;

      if (!currentMeal) return;

      if (currentMeal === "Pranzo" || currentMeal === "Cena") {
        newConfig.push(
          { food, meal: "Pranzo", frequency: freq },
          { food, meal: "Cena", frequency: freq }
        );
      } else {
        newConfig.push({ food, meal: currentMeal, frequency: freq });
      }
    });

    setConfig(newConfig);
  };

  // ✅ CONFIG
  const addConfig = () => {
    if (!newFood) return;

    let items =
      configMeal === "Pranzo" || configMeal === "Cena"
        ? [
            { food: newFood, meal: "Pranzo", frequency: Number(frequency) },
            { food: newFood, meal: "Cena", frequency: Number(frequency) }
          ]
        : [{ food: newFood, meal: configMeal, frequency: Number(frequency) }];

    setConfig([...config, ...items]);
    setNewFood("");
    setFrequency("");
  };

  const clearConfig = () => confirm("Reset config?") && setConfig([]);
  const clearLogs = () => confirm("Reset log?") && setLogs([]);

  // ✅ LOG
  const addLog = (f) => {
    if (!f) return;
    setLogs([...logs, { food: f, meal, date: new Date().toISOString() }]);
  };

  // ✅ STATS
  const stats = {};
  config.forEach(c => {
    if (c.frequency) stats[c.food] = { total: 0, frequency: c.frequency };
  });

  logs.forEach(l => {
    if (getWeek(l.date) === currentWeek && stats[l.food]) {
      stats[l.food].total++;
    }
  });

  // ✅ COLOR
  const getColor = (food) => {
    if (!stats[food]) return "#34c759";
    const r = stats[food].frequency - stats[food].total;
    if (r < 0) return "#ff3b30";
    if (r === 0) return "#ff9500";
    return "#34c759";
  };

  // ✅ QUICK
  const usage = {};
  logs.forEach(l => {
    if (l.meal === meal) usage[l.food] = (usage[l.food] || 0) + 1;
  });

  const quickFoods = Object.keys(usage)
    .sort((a, b) => usage[b] - usage[a])
    .slice(0, 4);

  // ✅ SUGGERIMENTI
  const allowed = [];
  const blocked = [];

  Object.entries(stats).forEach(([f, v]) => {
    const r = v.frequency - v.total;
    if (r > 0) allowed.push(f);
    else blocked.push(f);
  });

  // ✅ CALENDAR VIEW
  const selectedLogs = logs.filter(
    l => formatDate(l.date) === (selectedDate || today)
  );

  const dayView = { Colazione: [], Spuntino: [], Pranzo: [], Cena: [] };

  selectedLogs.forEach(l => {
    dayView[l.meal].push(l.food);
  });

  // ✅ INFO IMAGES
  const infoImages = {
    Colazione: "/colazione.png",
    Spuntino: "/spuntino.png",
    Pranzo: "/pranzo.png",
    Cena: "/cena.png"
  };

  const availableFoods = config.filter(c => c.meal === meal);

  return (
    <div style={{ padding: 20, maxWidth: 480, margin: "auto", fontFamily: "-apple-system", background:"#f2f2f7" }}>

      <h1>🍽 Food Tracker</h1>

      {/* BUTTONS */}
      <div>
        <button onClick={()=>setShowCalendar(!showCalendar)}>📅</button>
        <button onClick={()=>setShowConfig(!showConfig)}>⚙️</button>
        <button onClick={()=>setShowInfo(!showInfo)}>ℹ️</button>
      </div>

      {/* CALENDAR */}
      {showCalendar && (
        <input
          type="date"
          value={selectedDate || today}
          onChange={e=>setSelectedDate(e.target.value)}
        />
      )}

      {/* INFO IMAGE */}
      {showInfo && (
        <img src={infoImages[meal]} style={{width:"100%", borderRadius:12}} />
      )}

      {/* SUGGERIMENTI */}
      <div>
        <div style={{color:"#34c759"}}>✅ {allowed.join(", ") || "-"}</div>
        <div style={{color:"#ff3b30"}}>❌ {blocked.join(", ") || "-"}</div>
      </div>

      {/* MEALS */}
      <div style={{display:"flex",flexWrap:"wrap"}}>
        {meals.map(m=>(
          <button key={m} onClick={()=>setMeal(m)} style={{flex:1,margin:4,padding:14}}>
            {m}
          </button>
        ))}
      </div>

      {/* QUICK */}
      <div style={{display:"flex",flexWrap:"wrap"}}>
        {quickFoods.map(f=>(
          <button key={f}
            onClick={()=>addLog(f)}
            style={{flex:"45%",margin:5,padding:16,background:getColor(f),color:"white"}}>
            + {f}
          </button>
        ))}
      </div>

      {/* SELECT */}
      <select onChange={e=>setSelectedFood(e.target.value)}>
        <option value="">Seleziona alimento</option>
        {availableFoods.map(c=>(
          <option key={c.food}>{c.food}</option>
        ))}
      </select>

      <button onClick={()=>addLog(selectedFood)}>Aggiungi</button>

      {/* CONTATORE */}
      <h3>📊 Frequenze</h3>
      {Object.entries(stats).map(([f,v])=>(
        <div key={f}>
          {f}: {v.total}/{v.frequency}
        </div>
      ))}

      {/* DAY VIEW */}
      <h3>📅 Giorno</h3>
      {Object.entries(dayView).map(([m,f])=>(
        <div key={m}>{m}: {f.join(", ") || "-"}</div>
      ))}

      {/* CONFIG */}
      {showConfig && (
        <div>
          <input value={newFood} onChange={e=>setNewFood(e.target.value)} placeholder="Alimento"/>
          <select value={configMeal} onChange={e=>setConfigMeal(e.target.value)}>
            {meals.map(m=> <option key={m}>{m}</option>)}
          </select>
          <input type="number" value={frequency} onChange={e=>setFrequency(e.target.value)}/>

          <button onClick={addConfig} style={{padding:16}}>➕ Aggiungi</button>

          <button onClick={clearConfig}>Reset Config</button>
          <button onClick={clearLogs}>Reset Log</button>

          {/* IMPORT */}
          <label style={{display:"block",background:"#007aff",color:"white",padding:16,marginTop:10}}>
            📄 Importa file
            <input type="file" accept=".txt" onChange={importFromFile} style={{display:"none"}}/>
          </label>

          <button onClick={()=>exportExcel()}>Export</button>
        </div>
      )}

    </div>
  );
}
