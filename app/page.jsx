"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

export default function Page() {
  const [config, setConfig] = useState([]);
  const [logs, setLogs] = useState([]);

  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const [showInfo, setShowInfo] = useState(false);

  const [newFood, setNewFood] = useState("");
  const [frequency, setFrequency] = useState("");
  const [configMeal, setConfigMeal] = useState("Colazione");

  const [selectedFood, setSelectedFood] = useState("");
  const [meal, setMeal] = useState("Colazione");

  const [showConfig, setShowConfig] = useState(false);

  const meals = ["Colazione", "Spuntino", "Pranzo", "Cena"];

  useEffect(() => {
    const c = localStorage.getItem("config");
    const l = localStorage.getItem("logs");
    if (c) setConfig(JSON.parse(c));
    if (l) setLogs(JSON.parse(l));
  }, []);

  useEffect(() => localStorage.setItem("config", JSON.stringify(config)), [config]);
  useEffect(() => localStorage.setItem("logs", JSON.stringify(logs)), [logs]);

  const formatDate = (date) => new Date(date).toISOString().split('T')[0];
  const today = formatDate(new Date());

  const addConfig = () => {
    if (!newFood) return;

    const newItems = [];

    if (configMeal === "Pranzo" || configMeal === "Cena") {
      newItems.push(
        { food: newFood, meal: "Pranzo", frequency: frequency ? Number(frequency) : null },
        { food: newFood, meal: "Cena", frequency: frequency ? Number(frequency) : null }
      );
    } else {
      newItems.push({ food: newFood, meal: configMeal, frequency: frequency ? Number(frequency) : null });
    }

    setConfig([...config, ...newItems]);
    setNewFood("");
    setFrequency("");
  };

  const clearConfig = () => {
    if (confirm("Sei sicuro di voler cancellare la configurazione?")) setConfig([]);
  };

  const clearLogs = () => {
    if (confirm("Sei sicuro di voler cancellare i consumi?")) setLogs([]);
  };

  const addLog = (foodOverride) => {
    const foodToUse = foodOverride || selectedFood;
    if (!foodToUse) return;

    setLogs([...logs, { food: foodToUse, meal, date: new Date().toISOString() }]);
  };

  const exportExcel = () => {
    const data = logs.map(l => ({ Alimento: l.food, Pasto: l.meal, Data: new Date(l.date).toLocaleDateString() }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tracker");
    XLSX.writeFile(wb, "food-tracker.xlsx");
  };

  const availableFoods = config.filter(c => c.meal === meal);

  const usageCount = {};
  logs.forEach(l => {
    if (l.meal === meal) usageCount[l.food] = (usageCount[l.food] || 0) + 1;
  });

  const quickFoods = Object.entries(usageCount).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([food]) => food);

  const selectedDayLogs = logs.filter(l => formatDate(l.date) === (selectedDate || today));

  const dayView = { Colazione: [], Spuntino: [], Pranzo: [], Cena: [] };
  selectedDayLogs.forEach(l => dayView[l.meal].push(l.food));

  // Placeholder immagini per pasto
  const infoImages = {
    Colazione: "/colazione.png",
    Spuntino: "/spuntino.png",
    Pranzo: "/pranzo.png",
    Cena: "/cena.png"
  };

  return (
    <div style={{ padding: 20, maxWidth: 520, margin: "auto", fontFamily: "-apple-system" }}>

      <h1 style={{ fontSize: 26 }}>🍽 Food Tracker</h1>

      <button onClick={() => setShowCalendar(!showCalendar)} style={{ marginBottom: 10 }}>
        📅 Calendario
      </button>

      <button onClick={() => setShowConfig(!showConfig)} style={{ marginBottom: 15, marginLeft: 10 }}>
        ⚙️ Configurazione
      </button>

      {showCalendar && (
        <input type="date" value={selectedDate || today} onChange={(e) => setSelectedDate(e.target.value)} style={{ width: "100%", padding: 12, fontSize: 16, marginBottom: 10 }} />
      )}

      {/* MEAL + INFO */}
      <div style={{ marginBottom: 15 }}>
        {meals.map(m => (
          <button key={m} onClick={() => setMeal(m)}
            style={{ margin: 5, padding: "12px 18px", borderRadius: 18, fontSize: 18, background: m === meal ? "#007aff" : "#eee", color: m === meal ? "white" : "black", border: "none" }}>
            {m}
          </button>
        ))}
        <button onClick={() => setShowInfo(!showInfo)} style={{ marginLeft: 10, padding: "10px 14px", borderRadius: 12 }}>
          ℹ️
        </button>
      </div>

      {showInfo && (
        <div style={{ marginBottom: 15 }}>
          <img src={infoImages[meal]} alt="info" style={{ width: "100%", borderRadius: 12 }} />
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        {quickFoods.map(food => (
          <button key={food} onClick={() => addLog(food)} style={{ margin: 6, padding: "16px", borderRadius: 18, fontSize: 18, background: "#34c759", color: "white", border: "none", width: "45%" }}>
            + {food}
          </button>
        ))}
      </div>

      <select value={selectedFood} onChange={(e) => setSelectedFood(e.target.value)} style={{ width: "100%", padding: 18, fontSize: 18, borderRadius: 14 }}>
        <option value="">Seleziona alimento</option>
        {availableFoods.map(c => <option key={c.food}>{c.food}</option>)}
      </select>

      <button onClick={() => addLog()} style={{ padding: 16, width: "100%", borderRadius: 14, marginTop: 10 }}>
        + Aggiungi
      </button>

      <h2>📅 Giorno selezionato</h2>
      {Object.entries(dayView).map(([m, foods]) => (
        <div key={m}>{m}: {foods.join(", ") || "-"}</div>
      ))}

      {showConfig && (
        <div style={{ marginTop: 20 }}>
          <h2>⚙️ Config</h2>
          <input placeholder="Alimento" value={newFood} onChange={(e) => setNewFood(e.target.value)} style={{ padding: 14, fontSize: 16 }} />
          <select value={configMeal} onChange={(e) => setConfigMeal(e.target.value)} style={{ padding: 14, fontSize: 16 }}>
            {meals.map(m => <option key={m}>{m}</option>)}
          </select>
          <input type="number" placeholder="Frequenza" value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ padding: 14, fontSize: 16 }} />
          <button onClick={addConfig}>Aggiungi</button>
          <button onClick={clearConfig}>Reset Config</button>
          <button onClick={clearLogs}>Reset Log</button>

          <button onClick={exportExcel} style={{ marginTop: 10, width: "100%", padding: 14, borderRadius: 12 }}>
            📥 Export Excel
          </button>
        </div>
      )}

    </div>
  );
}
{/* 📊 FREQUENZE SETTIMANA */}
<h2 style={{ marginTop: 20 }}>📊 Frequenze settimana</h2>

{Object.keys(stats).length === 0 && (
  <div style={{ opacity: 0.6 }}>
    Nessun alimento con frequenza configurata
  </div>
)}

{Object.entries(stats).map(([key, value]) => {
  const remaining = value.frequency - value.total;

  // ✅ Colori principali
  const color =
    remaining < 0
      ? "#ff3b30" // rosso
      : remaining === 0
      ? "#ff9500" // arancione
      : "#34c759"; // verde

  const bgColor =
    remaining < 0
      ? "#ffe5e3"
      : remaining === 0
      ? "#fff4e5"
      : "#e8f8ec";

  return (
    <div
      key={key}
      style={{
        marginBottom: 10,
        padding: 14,
        borderRadius: 16,
        background: bgColor
      }}
    >
      <strong style={{ fontSize: 18 }}>{key}</strong>

      <div style={{ color, fontSize: 20, fontWeight: "bold" }}>
        {value.total} / {value.frequency}
      </div>

      <div style={{ fontSize: 14, opacity: 0.7 }}>
        restano {remaining}
      </div>
    </div>
  );
})}
