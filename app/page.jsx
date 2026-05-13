"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

export default function Page() {
  const [config, setConfig] = useState([]);
  const [logs, setLogs] = useState([]);

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

  const getWeek = (date) => {
    const d = new Date(date);
    return Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 86400000 + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7);
  };

  const currentWeek = getWeek(new Date());

  const addConfig = () => {
    if (!newFood) return;

    setConfig([
      ...config,
      {
        food: newFood,
        meal: configMeal,
        frequency: frequency ? Number(frequency) : null
      }
    ]);

    setNewFood("");
    setFrequency("");
  };

  const addLog = (foodOverride) => {
    const foodToUse = foodOverride || selectedFood;
    if (!foodToUse) return;

    setLogs([
      ...logs,
      {
        food: foodToUse,
        meal,
        date: new Date().toISOString()
      }
    ]);
  };

  const clearConfig = () => setConfig([]);
  const clearLogs = () => setLogs([]);

  const exportExcel = () => {
    const data = logs.map((l) => ({
      Alimento: l.food,
      Pasto: l.meal,
      Data: new Date(l.date).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tracker");
    XLSX.writeFile(wb, "food-tracker.xlsx");
  };

  // ✅ STATS
  const stats = {};
  config.forEach((c) => {
    if (c.frequency) stats[c.food] = { total: 0, frequency: c.frequency };
  });

  logs.forEach((l) => {
    if (getWeek(l.date) === currentWeek && stats[l.food]) {
      stats[l.food].total += 1;
    }
  });

  const availableFoods = config.filter(c => c.meal === meal);

  // ✅ QUICK BUTTONS (top 4 più usati)
  const usageCount = {};
  logs.forEach(l => {
    if (l.meal === meal) {
      usageCount[l.food] = (usageCount[l.food] || 0) + 1;
    }
  });

  const quickFoods = Object.entries(usageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([food]) => food);

  // ✅ WEEK VIEW
  const weeklyView = {};
  logs.forEach(l => {
    if (getWeek(l.date) === currentWeek) {
      const day = new Date(l.date).toLocaleDateString();
      if (!weeklyView[day]) {
        weeklyView[day] = { Colazione: [], Spuntino: [], Pranzo: [], Cena: [] };
      }
      weeklyView[day][l.meal].push(l.food);
    }
  });

  return (
    <div style={{ padding: 16, maxWidth: 500, margin: "auto", fontFamily: "-apple-system" }}>

      <h1 style={{ fontSize: 24 }}>🍽 Food Tracker</h1>

      {/* MEAL SELECT */}
      <div style={{ marginBottom: 10 }}>
        {meals.map(m => (
          <button key={m}
            onClick={() => setMeal(m)}
            style={{
              margin: 4,
              padding: "8px 12px",
              borderRadius: 12,
              background: m === meal ? "#007aff" : "#eee",
              color: m === meal ? "white" : "black",
              border: "none"
            }}>
            {m}
          </button>
        ))}
      </div>

      {/* QUICK BUTTONS */}
      <div style={{ marginBottom: 15 }}>
        {quickFoods.map(food => (
          <button key={food}
            onClick={() => addLog(food)}
            style={{
              margin: 4,
              padding: "10px",
              borderRadius: 14,
              background: "#34c759",
              color: "white",
              border: "none",
              width: "45%"
            }}>
            + {food}
          </button>
        ))}
      </div>

      {/* FALLBACK SELECT */}
      <select value={selectedFood} onChange={(e) => setSelectedFood(e.target.value)}>
        <option value="">Seleziona alimento</option>
        {availableFoods.map(c => <option key={c.food}>{c.food}</option>)}
      </select>
      <button onClick={() => addLog()}>+ Aggiungi</button>

      {/* STATS */}
      <h2>📊 Settimana</h2>
      {Object.entries(stats).map(([key, value]) => {
        const remaining = value.frequency - value.total;
        return (
          <div key={key}>
            {key}: {value.total}/{value.frequency}
          </div>
        );
      })}

      {/* WEEK VIEW */}
      <h2>📅 Daily View</h2>
      {Object.entries(weeklyView).map(([day, mealsData]) => (
        <div key={day} style={{ background: "#f5f5f5", padding: 10, marginBottom: 10, borderRadius: 10 }}>
          <strong>{day}</strong>
          {Object.entries(mealsData).map(([m, foods]) => (
            <div key={m}>{m}: {foods.join(", ") || "-"}</div>
          ))}
        </div>
      ))}

      {/* CONFIG */}
      <h2>⚙️ Config</h2>
      <input placeholder="Alimento" value={newFood} onChange={(e) => setNewFood(e.target.value)} />
      <select value={configMeal} onChange={(e) => setConfigMeal(e.target.value)}>
        {meals.map(m => <option key={m}>{m}</option>)}
      </select>
      <input type="number" placeholder="Frequenza opzionale" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
      <button onClick={addConfig}>Aggiungi</button>
      <button onClick={clearConfig}>Reset Config</button>
      <button onClick={clearLogs}>Reset Log</button>

      {/* EXPORT */}
      <button onClick={exportExcel} style={{ marginTop: 20, width: "100%" }}>
        📥 Export Excel
      </button>

    </div>
  );
}
