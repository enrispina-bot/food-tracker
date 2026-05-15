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

  // ✅ CALCOLO SETTIMANA
  const getWeek = (date) => {
    const d = new Date(date);
    return Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 86400000 + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7);
  };
  const currentWeek = getWeek(new Date());

  // ✅ CONFIG
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

  const usageCount = {};
  logs.forEach(l => {
    if (l.meal === meal) usageCount[l.food] = (usageCount[l.food] || 0) + 1;
  });

  const quickFoods = Object.entries(usageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([food]) => food);

  const selectedDayLogs = logs.filter(l => formatDate(l.date) === (selectedDate || today));

  const dayView = { Colazione: [], Spuntino: [], Pranzo: [], Cena: [] };
  selectedDayLogs.forEach(l => dayView[l.meal].push(l.food));

  // ✅ STATS (contatore settimanale)
  const stats = {};
  config.forEach((c) => {
    if (c.frequency) {
      stats[c.food] = { total: 0, frequency: c.frequency };
    }
  });

  logs.forEach((l) => {
    if (getWeek(l.date) === currentWeek && stats[l.food]) {
      stats[l.food].total += 1;
    }
  });

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

      <div style={{ marginBottom: 15 }}>
        {meals.map(m => (
          <button key={m} onClick={() => setMeal(m)}
            style={{
              margin: 5,
              padding: "12px 18px",
              borderRadius: 18,
              fontSize: 18,
              background: m === meal ? "#007aff" : "#eee",
              color: m === meal ? "white" : "black",
              border: "none"
            }}>
            {m}
          </button>
        ))}
        <button onClick={() => setShowInfo(!showInfo)} style={{ marginLeft: 10 }}>
          ℹ️
        </button>
      </div>

      {showInfo && (
        <img src={infoImages[meal]} style={{ width: "100%", borderRadius: 12 }} />
      )}

      {/* QUICK */}
      <div style={{ marginBottom: 20 }}>
        {quickFoods.map(food => (
          <button key={food} onClick={() => addLog(food)}
            style={{
              margin: 6,
              padding: 16,
              borderRadius: 18,
              fontSize: 18,
              background: "#34c759",
              color: "white",
              border: "none",
              width: "45%"
            }}>
            + {food}
          </button>
        ))}
      </div>

      <select value={selectedFood} onChange={(e) => setSelectedFood(e.target.value)}
        style={{ width: "100%", padding: 18, fontSize: 18, borderRadius: 14 }}>
        <option value="">Seleziona alimento</option>
        {availableFoods.map(c => <option key={c.food}>{c.food}</option>)}
      </select>

      <button onClick={() => addLog()}
        style={{ padding: 16, width: "100%", borderRadius: 14, marginTop: 10 }}>
        + Aggiungi
      </button>

      {/* ✅ CONTATORE */}
      <h2 style={{ marginTop: 20 }}>📊 Frequenze settimana</h2>

      {Object.entries(stats).map(([key, value]) => {
        const remaining = value.frequency - value.total;

        const color =
          remaining < 0 ? "#ff3b30" :
          remaining === 0 ? "#ff9500" :
          "#34c759";

        const bgColor =
          remaining < 0 ? "#ffe5e3" :
          remaining === 0 ? "#fff4e5" :
          "#e8f8ec";

        return (
          <div key={key}
            style={{
              marginBottom: 10,
              padding: 14,
              borderRadius: 16,
              background: bgColor
            }}>
            <strong>{key}</strong>
            <div style={{ color, fontSize: 20, fontWeight: "bold" }}>
              {value.total} / {value.frequency}
            </div>
            <div style={{ fontSize: 14 }}>
              restano {remaining}
            </div>
          </div>
        );
      })}

      <h2>📅 Giorno selezionato</h2>
      {Object.entries(dayView).map(([m, foods]) => (
        <div key={m}>{m}: {foods.join(", ") || "-"}</div>
      ))}

      {showConfig && (
        <div style={{ marginTop: 20 }}>
          <h2>⚙️ Config</h2>

          <input value={newFood} onChange={(e) => setNewFood(e.target.value)} />
          <select value={configMeal} onChange={(e) => setConfigMeal(e.target.value)}>
            {meals.map(m => <option key={m}>{m}</option>)}
          </select>
          <input type="number" value={frequency} onChange={(e) => setFrequency(e.target.value)} />

          <button onClick={addConfig}>Aggiungi</button>
          <button onClick={clearConfig}>Reset Config</button>
          <button onClick={clearLogs}>Reset Log</button>

          <button onClick={exportExcel}>📥 Export Excel</button>
        </div>
      )}

    </div>
  );
}
