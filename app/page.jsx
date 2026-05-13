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

  // ✅ CONFIG (pranzo/cena duplicato)
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

  // ✅ CONFIRM RESET
  const clearConfig = () => {
    if (confirm("Sei sicuro di voler cancellare la configurazione?")) {
      setConfig([]);
    }
  };

  const clearLogs = () => {
    if (confirm("Sei sicuro di voler cancellare i consumi?")) {
      setLogs([]);
    }
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
    <div style={{ padding: 20, maxWidth: 520, margin: "auto", fontFamily: "-apple-system" }}>

      <h1 style={{ fontSize: 26 }}>🍽 Food Tracker</h1>

      {/* MEAL SELECT */}
      <div style={{ marginBottom: 15 }}>
        {meals.map(m => (
          <button key={m}
            onClick={() => setMeal(m)}
            style={{
              margin: 5,
              padding: "10px 16px",
              borderRadius: 16,
              fontSize: 16,
              background: m === meal ? "#007aff" : "#eee",
              color: m === meal ? "white" : "black",
              border: "none"
            }}>
            {m}
          </button>
        ))}
      </div>

      {/* QUICK BUTTONS */}
      <div style={{ marginBottom: 20 }}>
        {quickFoods.map(food => (
          <button key={food}
            onClick={() => addLog(food)}
            style={{
              margin: 6,
              padding: "14px",
              borderRadius: 18,
              fontSize: 16,
              background: "#34c759",
              color: "white",
              border: "none",
              width: "45%"
            }}>
            + {food}
          </button>
        ))}
      </div>

      {/* SELECT GRANDE */}
      <select
        value={selectedFood}
        onChange={(e) => setSelectedFood(e.target.value)}
        style={{
          width: "100%",
          padding: 14,
          fontSize: 16,
          borderRadius: 12,
          marginBottom: 10
        }}
      >
        <option value="">Seleziona alimento</option>
        {availableFoods.map(c => <option key={c.food}>{c.food}</option>)}
      </select>

      <button onClick={() => addLog()} style={{ padding: 12, width: "100%", borderRadius: 12 }}>
        + Aggiungi
      </button>

      <h2>📊 Settimana</h2>
      {Object.entries(stats).map(([key, value]) => (
        <div key={key}>
          {key}: {value.total}/{value.frequency}
        </div>
      ))}

      <h2>📅 Daily View</h2>
      {Object.entries(weeklyView).map(([day, mealsData]) => (
        <div key={day} style={{ background: "#f5f5f5", padding: 12, marginBottom: 12, borderRadius: 12 }}>
          <strong>{day}</strong>
          {Object.entries(mealsData).map(([m, foods]) => (
            <div key={m}>{m}: {foods.join(", ") || "-"}</div>
          ))}
        </div>
      ))}

      <h2>⚙️ Config</h2>
      <input placeholder="Alimento" value={newFood} onChange={(e) => setNewFood(e.target.value)} style={{ padding: 12, fontSize: 16 }} />
      <select value={configMeal} onChange={(e) => setConfigMeal(e.target.value)} style={{ padding: 12, fontSize: 16 }}>
        {meals.map(m => <option key={m}>{m}</option>)}
      </select>
      <input type="number" placeholder="Frequenza opzionale" value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ padding: 12, fontSize: 16 }} />

      <button onClick={addConfig}>Aggiungi</button>
      <button onClick={clearConfig}>Reset Config</button>
      <button onClick={clearLogs}>Reset Log</button>

      <button onClick={exportExcel} style={{ marginTop: 20, width: "100%", padding: 14, borderRadius: 12 }}>
        📥 Export Excel
      </button>

    </div>
  );
}
