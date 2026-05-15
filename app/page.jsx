"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

export default function Page() {
  const [config, setConfig] = useState([]);
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");

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
    return Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 86400000 +
      new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7);
  };

  const currentWeek = getWeek(new Date());

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

  // ✅ COLOR LOGIC
  const getColor = (food) => {
    if (!stats[food]) return "#34c759";

    const total = stats[food].total;
    const freq = stats[food].frequency;

    if (total >= freq) return "#ff3b30";
    if (total === freq - 1) return "#ffcc00";
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

  // ✅ IMPORT
  const importFromFile = (event) => {
    const file = event.target.files[0];

    if (!file) {
      setMessage("❌ Nessun file selezionato");
      return;
    }

    if (!file.name.endsWith(".txt")) {
      setMessage("❌ Il file deve essere .txt");
      return;
    }

    if (!confirm("Sovrascrivere configurazione?")) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const lines = e.target.result.split("\n");
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

          if (!currentMeal) throw Error();

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
        setMessage("✅ Config caricata");
      } catch {
        setMessage("❌ Errore file");
      }
    };

    reader.readAsText(file);
  };

  const addConfig = () => {
    if (!newFood) return;

    const items = configMeal === "Pranzo" || configMeal === "Cena"
      ? [
        { food: newFood, meal: "Pranzo", frequency: Number(frequency) || null },
        { food: newFood, meal: "Cena", frequency: Number(frequency) || null }
      ]
      : [{ food: newFood, meal: configMeal, frequency: Number(frequency) || null }];

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

  const selectedDayLogs = logs.filter(
    (l) => formatDate(l.date) === (selectedDate || today)
  );

  const dayView = { Colazione: [], Spuntino: [], Pranzo: [], Cena: [] };
  selectedDayLogs.forEach((l) => dayView[l.meal].push(l.food));

  const availableFoods = config.filter(c => c.meal === meal);

  return (
    <div style={{ padding: 20, maxWidth: 520, margin: "auto", fontFamily: "-apple-system" }}>

      <h1>🍽 Food Tracker</h1>

      {message && <div>{message}</div>}

      <button onClick={() => setShowCalendar(!showCalendar)}>📅</button>
      <button onClick={() => setShowConfig(!showConfig)}>⚙️</button>

      {showCalendar && (
        <input type="date"
          value={selectedDate || today}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ width: "100%", padding: 12 }}
        />
      )}

      {/* MEALS */}
      <div>
        {meals.map(m => (
          <button key={m} onClick={() => setMeal(m)} style={{ padding: 12 }}>
            {m}
          </button>
        ))}
      </div>

      {/* QUICK COLORATI */}
      <div>
        {quickFoods.map((food) => (
          <button
            key={food}
            onClick={() => addLog(food)}
            style={{
              background: getColor(food),
              color: "white",
              padding: 16,
              margin: 5,
              borderRadius: 12
            }}
          >
            + {food}
          </button>
        ))}
      </div>

      {/* SELECT BIG */}
      <select
        value={selectedFood}
        onChange={(e) => setSelectedFood(e.target.value)}
        style={{ width: "100%", padding: 20, fontSize: 18 }}
      >
        <option value="">Seleziona alimento</option>
        {availableFoods.map(c => <option key={c.food}>{c.food}</option>)}
      </select>

      <button
        onClick={() => addLog()}
        style={{ width: "100%", padding: 18, fontSize: 18 }}
      >
        + Aggiungi
      </button>

      {/* ✅ CONTATORE COLORATO */}
      <h2>📊 Frequenze</h2>
      {Object.entries(stats).map(([food, val]) => (
        <div key={food} style={{ color: getColor(food) }}>
          {food} {val.total}/{val.frequency}
        </div>
      ))}

      <h2>📅 Giorno selezionato</h2>
      {Object.entries(dayView).map(([m, foods]) => (
        <div key={m}>{m}: {foods.join(", ") || "-"}</div>
      ))}

      {showConfig && (
        <div>

          <input value={newFood} onChange={(e) => setNewFood(e.target.value)} />

          <select
            value={configMeal}
            onChange={(e) => setConfigMeal(e.target.value)}
            style={{ width: "100%", padding: 18, fontSize: 18 }}
          >
            {meals.map(m => <option key={m}>{m}</option>)}
          </select>

          <input type="number" value={frequency} onChange={(e) => setFrequency(e.target.value)} />

          <button
            onClick={addConfig}
            style={{ width: "100%", padding: 18, fontSize: 18 }}
          >
            ➕ Aggiungi
          </button>

          <button onClick={clearConfig}>Reset</button>
          <button onClick={clearLogs}>Reset Log</button>

          <label style={{ display: "block", background: "#007aff", color: "white", padding: 12 }}>
            Importa file
            <input type="file" accept=".txt" onChange={importFromFile} style={{ display: "none" }} />
          </label>
        </div>
      )}

    </div>
  );
}
