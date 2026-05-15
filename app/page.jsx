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

  // QUICK BUTTONS COLOR
  const getColor = (food) => {
    if (!stats[food]) return "#34c759";

    const remaining = stats[food].frequency - stats[food].total;

    if (remaining < 0) return "#ff3b30";
    if (remaining === 0) return "#ff9500";
    return "#34c759";
  };

  // QUICK BUTTONS LIST
  const usageCount = {};
  logs.forEach(l => {
    if (l.meal === meal) usageCount[l.food] = (usageCount[l.food] || 0) + 1;
  });

  const quickFoods = Object.entries(usageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([food]) => food);

  // SUGGESTIONS
  const allowed = [];
  const blocked = [];

  Object.entries(stats).forEach(([food, value]) => {
    const remaining = value.frequency - value.total;
    if (remaining > 0) allowed.push(food);
    if (remaining <= 0) blocked.push(food);
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

      {/* MEAL */}
      <div>
        {meals.map(m => (
          <button key={m} onClick={() => setMeal(m)}
            style={{
              margin: 4,
              padding: 14,
              borderRadius: 16,
              background: m === meal ? "#007aff" : "#eee"
            }}>
            {m}
          </button>
        ))}
        <button onClick={() => setShowInfo(!showInfo)}>ℹ️</button>
      </div>

      {showInfo && <img src={infoImages[meal]} style={{ width: "100%" }} />}

      {/* QUICK BUTTONS COLORATI */}
      <div>
        {quickFoods.map(food => (
          <button
            key={food}
            onClick={() => addLog(food)}
            style={{
              margin: 5,
              padding: 16,
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

      {/* SELECT */}
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
        const remaining = value.frequency - value.total;
        const color = getColor(key);

        return (
          <div key={key} style={{ padding: 14, marginBottom: 10, borderRadius: 14 }}>
            <strong>{key}</strong>
            <div style={{ color }}>
              {value.total} / {value.frequency}
            </div>
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
            style={{ width: "100%", padding: 18, fontSize: 18 }}
          />

          <select value={configMeal} onChange={(e) => setConfigMeal(e.target.value)}
            style={{ width: "100%", padding: 18, fontSize: 18 }}>
            {meals.map(m => <option key={m}>{m}</option>)}
          </select>

          <input
            type="number"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            style={{ width: "100%", padding: 18, fontSize: 18 }}
          />

          <button onClick={addConfig}>Aggiungi</button>
          <button onClick={clearConfig}>Reset Config</button>
          <button onClick={clearLogs}>Reset Log</button>
          <button onClick={exportExcel}>📥 Export</button>
        </div>
      )}
    </div>
  );
}
