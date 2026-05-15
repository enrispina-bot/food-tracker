"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

export default function Page() {
  const [config, setConfig] = useState([]);
  const [logs, setLogs] = useState([]);

  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const [newFood, setNewFood] = useState("");
  const [frequency, setFrequency] = useState("");
  const [configMeal, setConfigMeal] = useState("Colazione");

  const [selectedFood, setSelectedFood] = useState("");
  const [meal, setMeal] = useState("Colazione");

  const meals = ["Colazione", "Spuntino", "Pranzo", "Cena"];

  useEffect(() => {
    const c = localStorage.getItem("config");
    const l = localStorage.getItem("logs");
    if (c) setConfig(JSON.parse(c));
    if (l) setLogs(JSON.parse(l));
  }, []);

  useEffect(() => localStorage.setItem("config", JSON.stringify(config)), [config]);
  useEffect(() => localStorage.setItem("logs", JSON.stringify(logs)), [logs]);

  const formatDate = (date) => new Date(date).toISOString().split("T")[0];
  const today = formatDate(new Date());

  const getWeek = (date) => {
    const d = new Date(date);
    return Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 86400000 + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7);
  };

  const currentWeek = getWeek(new Date());

  // ✅ IMPORT FILE TXT
  const importFromFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm("Sovrascrivere configurazione attuale?")) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      parseTextConfig(e.target.result);
    };

    reader.readAsText(file);
  };

  const parseTextConfig = (text) => {
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

  // CONFIG
  const addConfig = () => {
    if (!newFood) return;

    const items =
      configMeal === "Pranzo" || configMeal === "Cena"
        ? [
            { food: newFood, meal: "Pranzo", frequency: frequency ? Number(frequency) : null },
            { food: newFood, meal: "Cena", frequency: frequency ? Number(frequency) : null }
          ]
        : [{ food: newFood, meal: configMeal, frequency: frequency ? Number(frequency) : null }];

    setConfig([...config, ...items]);
    setNewFood("");
    setFrequency("");
  };

  const clearConfig = () => confirm("Reset configurazione?") && setConfig([]);
  const clearLogs = () => confirm("Reset consumi?") && setLogs([]);

  const addLog = (foodOverride) => {
    const f = foodOverride || selectedFood;
    if (!f) return;
    setLogs([...logs, { food: f, meal, date: new Date().toISOString() }]);
  };

  // EXCEL
  const exportExcel = () => {
    const data = logs.map(l => ({
      Alimento: l.food,
      Pasto: l.meal,
      Data: new Date(l.date).toLocaleDateString()
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tracker");
    XLSX.writeFile(wb, "food-tracker.xlsx");
  };

  const availableFoods = config.filter(c => c.meal === meal);

  // STATS
  const stats = {};
  config.forEach(c => {
    if (c.frequency) stats[c.food] = { total: 0, frequency: c.frequency };
  });

  logs.forEach(l => {
    if (getWeek(l.date) === currentWeek && stats[l.food]) {
      stats[l.food].total++;
    }
  });

  // COLOR LOGIC
  const getColor = (food) => {
    if (!stats[food]) return "#34c759";
    const r = stats[food].frequency - stats[food].total;
    if (r < 0) return "#ff3b30";
    if (r === 0) return "#ff9500";
    return "#34c759";
  };

  // QUICK
  const usageCount = {};
  logs.forEach(l => {
    if (l.meal === meal) usageCount[l.food] = (usageCount[l.food] || 0) + 1;
  });

  const quickFoods = Object.entries(usageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([food]) => food);

  // SUGGERIMENTI
  const allowed = [];
  const blocked = [];

  Object.entries(stats).forEach(([food, v]) => {
    const r = v.frequency - v.total;
    if (r > 0) allowed.push(food);
    else blocked.push(food);
  });

  const selectedDayLogs = logs.filter(l => formatDate(l.date) === (selectedDate || today));
  const dayView = { Colazione: [], Spuntino: [], Pranzo: [], Cena: [] };
  selectedDayLogs.forEach(l => dayView[l.meal].push(l.food));

  const infoImages = {
    Colazione: "/colazione.png",
    Spuntino: "/spuntino.png",
    Pranzo: "/pranzo.png",
    Cena: "/cena.png"
  };

  return (
    <div style={{ padding: 20, maxWidth: 520, margin: "auto", fontFamily: "-apple-system" }}>
      <h1>🍽 Food Tracker</h1>

      <button onClick={() => setShowCalendar(!showCalendar)}>📅 Calendario</button>
      <button onClick={() => setShowConfig(!showConfig)}>⚙️ Config</button>

      {showCalendar && (
        <input type="date" value={selectedDate || today} onChange={(e) => setSelectedDate(e.target.value)} />
      )}

      {/* SUGGERIMENTI */}
      <div style={{ marginTop: 10 }}>
        <div style={{ color: "#34c759" }}>✅ Puoi ancora: {allowed.join(", ") || "-"}</div>
        <div style={{ color: "#ff3b30" }}>❌ Evita: {blocked.join(", ") || "-"}</div>
      </div>

      {/* PASTI */}
      <div>
        {meals.map(m => (
          <button key={m} onClick={() => setMeal(m)} style={{ margin: 4, padding: 14, borderRadius: 16 }}>
            {m}
          </button>
        ))}
        <button onClick={() => setShowInfo(!showInfo)}>ℹ️</button>
      </div>

      {showInfo && <img src={infoImages[meal]} style={{ width: "100%" }} />}

      {/* QUICK COLORATI */}
      <div>
        {quickFoods.map(food => (
          <button key={food} onClick={() => addLog(food)}
            style={{
              margin: 6,
              padding: 18,
              fontSize: 18,
              borderRadius: 18,
              background: getColor(food),
              color: "white",
              width: "45%"
            }}>
            + {food}
          </button>
        ))}
      </div>

      <select value={selectedFood} onChange={(e) => setSelectedFood(e.target.value)}
        style={{ width: "100%", padding: 20, fontSize: 18 }}>
        <option>Seleziona alimento</option>
        {availableFoods.map(c => <option key={c.food}>{c.food}</option>)}
      </select>

      <button onClick={() => addLog()} style={{ width: "100%", padding: 16 }}>
        + Aggiungi
      </button>

      {/* CONTATORE */}
      <h2>📊 Frequenze</h2>
      {Object.entries(stats).map(([key, value]) => {
        const r = value.frequency - value.total;
        return (
          <div key={key}>
            {key}: {value.total}/{value.frequency} (restano {r})
          </div>
        );
      })}

      <h2>📅 Giorno</h2>
      {Object.entries(dayView).map(([m, foods]) => (
        <div key={m}>{m}: {foods.join(", ") || "-"}</div>
      ))}

      {showConfig && (
        <div>
          <h2>Config</h2>

          <input
            value={newFood}
            onChange={(e) => setNewFood(e.target.value)}
            style={{ width: "100%", padding: 20, fontSize: 18 }}
          />

          <select
            value={configMeal}
            onChange={(e) => setConfigMeal(e.target.value)}
            style={{ width: "100%", padding: 20, fontSize: 18 }}
          >
            {meals.map(m => <option key={m}>{m}</option>)}
          </select>

          <input
            type="number"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            style={{ width: "100%", padding: 20, fontSize: 18 }}
          />

          <button onClick={addConfig}
            style={{ width: "100%", padding: 18, fontSize: 18, marginTop: 10 }}>
            ➕ Aggiungi alimento
          </button>

          <button onClick={clearConfig}>Reset Config</button>
          <button onClick={clearLogs}>Reset Log</button>

          {/* IMPORT FILE */}
          <label style={{
