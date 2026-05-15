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

  // ✅ LOAD SAFE
  useEffect(() => {
    try {
      const c = localStorage.getItem("config");
      const l = localStorage.getItem("logs");

      if (c) setConfig(JSON.parse(c));
      if (l) setLogs(JSON.parse(l));
    } catch {
      console.log("Errore localStorage");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("config", JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem("logs", JSON.stringify(logs));
  }, [logs]);

  const formatDate = (date) =>
    new Date(date).toISOString().split("T")[0];

  const today = formatDate(new Date());

  const getWeek = (date) => {
    const d = new Date(date);
    return Math.ceil(
      ((d - new Date(d.getFullYear(), 0, 1)) / 86400000 +
        new Date(d.getFullYear(), 0, 1).getDay() +
        1) /
        7
    );
  };

  const currentWeek = getWeek(new Date());

  // ✅ STATS SAFE
  const stats = {};

  config.forEach((c) => {
    if (c && c.food && c.frequency) {
      stats[c.food] = { total: 0, frequency: c.frequency };
    }
  });

  logs.forEach((l) => {
    if (
      l &&
      l.food &&
      stats[l.food] &&
      getWeek(l.date) === currentWeek
    ) {
      stats[l.food].total++;
    }
  });

  // ✅ COLOR SAFE
  const getColor = (food) => {
    if (!stats[food]) return "#34c759";

    const { total, frequency } = stats[food];

    if (total >= frequency) return "#ff3b30";
    if (total === frequency - 1) return "#ffcc00";
    return "#34c759";
  };

  const availableFoods = config.filter(
    (c) => c && c.meal === meal
  );

  // ✅ QUICK SAFE
  const usage = {};
  logs.forEach((l) => {
    if (l && l.meal === meal) {
      usage[l.food] = (usage[l.food] || 0) + 1;
    }
  });

  const quickFoods = Object.keys(usage)
    .sort((a, b) => usage[b] - usage[a])
    .slice(0, 4);

  const addLog = (foodOverride) => {
    const f = foodOverride || selectedFood;
    if (!f) return;

    setLogs([
      ...logs,
      { food: f, meal, date: new Date().toISOString() },
    ]);
  };

  const addConfig = () => {
    if (!newFood) return;

    const freqNum = frequency ? Number(frequency) : null;

    if (freqNum !== null && isNaN(freqNum)) {
      setMessage("❌ Frequenza non valida");
      return;
    }

    const items =
      configMeal === "Pranzo" || configMeal === "Cena"
        ? [
            { food: newFood, meal: "Pranzo", frequency: freqNum },
            { food: newFood, meal: "Cena", frequency: freqNum },
          ]
        : [
            {
              food: newFood,
              meal: configMeal,
              frequency: freqNum,
            },
          ];

    setConfig([...config, ...items]);
    setNewFood("");
    setFrequency("");
  };

  const clearConfig = () =>
    confirm("Reset configurazione?") && setConfig([]);

  const clearLogs = () =>
    confirm("Reset consumi?") && setLogs([]);

  const exportExcel = () => {
    const data = logs.map((l) => ({
      Alimento: l.food,
      Pasto: l.meal,
      Data: new Date(l.date).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tracker");

    XLSX.writeFile(wb, "food-tracker.xlsx");
  };

  const selectedDayLogs = logs.filter(
    (l) => formatDate(l.date) === (selectedDate || today)
  );

  const dayView = {
    Colazione: [],
    Spuntino: [],
    Pranzo: [],
    Cena: [],
  };

  selectedDayLogs.forEach((l) => {
    if (l && dayView[l.meal]) {
      dayView[l.meal].push(l.food);
    }
  });

  const infoImages = {
    Colazione: "/colazione.png",
    Spuntino: "/spuntino.png",
    Pranzo: "/pranzo.png",
    Cena: "/cena.png",
  };

  return (
    <div style={{ padding: 20, maxWidth: 520, margin: "auto" }}>

      <h1>🍽 Food Tracker</h1>

      {message && <div>{message}</div>}

      <button onClick={() => setShowCalendar(!showCalendar)}>📅</button>
      <button onClick={() => setShowConfig(!showConfig)}>⚙️</button>

      {showCalendar && (
        <input
          type="date"
          value={selectedDate || today}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      )}

      {/* MEALS + INFO */}
      <div>
        {meals.map((m) => (
          <button key={m} onClick={() => setMeal(m)}>
            {m}
          </button>
        ))}
        <button onClick={() => setShowInfo(!showInfo)}>ℹ️</button>
      </div>

      {showInfo && <img src={infoImages[meal]} style={{ width: "100%" }} />}

      {/* QUICK */}
      <div>
        {quickFoods.map((f) => (
          <button
            key={f}
            onClick={() => addLog(f)}
            style={{
              background: getColor(f),
              color: "white",
              margin: 5,
              padding: 14,
            }}
          >
            + {f}
          </button>
        ))}
      </div>

      <select
        value={selectedFood}
        onChange={(e) => setSelectedFood(e.target.value)}
        style={{ width: "100%", padding: 16 }}
      >
        <option value="">Seleziona alimento</option>
        {availableFoods.map((c) => (
          <option key={c.food}>{c.food}</option>
        ))}
      </select>

      <button onClick={() => addLog()} style={{ width: "100%", padding: 16 }}>
        Aggiungi
      </button>

      {/* CONTATORE */}
      <h2>📊 Frequenze</h2>
      {Object.entries(stats).map(([f, v]) => (
        <div key={f} style={{ color: getColor(f) }}>
          {f} {v.total}/{v.frequency}
        </div>
      ))}

      <h2>📅 Giorno selezionato</h2>
      {Object.entries(dayView).map(([m, foods]) => (
        <div key={m}>{m}: {foods.join(", ") || "-"}</div>
      ))}

      {/* ✅ CONFIG SAFE */}
      {showConfig && (
        <div>

          <input
            value={newFood}
            onChange={(e) => setNewFood(e.target.value)}
          />

          <select
            value={configMeal}
            onChange={(e) => setConfigMeal(e.target.value)}
          >
            {meals.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>

          <input
            type="number"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          />

          <button onClick={addConfig}>Aggiungi</button>

          <button onClick={clearConfig}>Reset Config</button>
          <button onClick={clearLogs}>Reset Log</button>

          <button onClick={exportExcel}>Export</button>
        </div>
      )}

    </div>
  );
}
