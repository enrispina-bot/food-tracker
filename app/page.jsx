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

  const formatDate = (date) => new Date(date).toISOString().split("T")[0];
  const today = formatDate(new Date());

  // ✅ IMPORT FILE TXT
  const importFromFile = (event) => {
    const file = event.target.files[0];

    if (!file) {
      setMessage("❌ Nessun file selezionato");
      return;
    }

    if (!file.name.endsWith(".txt")) {
      setMessage("❌ Il file deve essere in formato .txt");
      return;
    }

    if (!confirm("Sovrascrivere configurazione attuale?")) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target.result;
        parseTextConfig(text);
        setMessage("✅ Configurazione importata con successo");
      } catch (err) {
        setMessage("❌ Errore nel parsing del file");
      }
    };

    reader.onerror = () => {
      setMessage("❌ Errore nella lettura del file");
    };

    reader.readAsText(file);
  };

  // ✅ PARSER
  const parseTextConfig = (text) => {
    const lines = text.split("\n");

    let currentMeal = null;
    const newConfig = [];

    lines.forEach((line, index) => {
      line = line.trim();

      if (!line) return;

      // se intestazione pasto
      if (meals.includes(line)) {
        currentMeal = line;
        return;
      }

      if (!currentMeal) {
        throw new Error(`Formato errato alla riga ${index + 1}: manca intestazione pasto`);
      }

      const parts = line.split(" ");
      const food = parts[0];
      const freq = parts[1] ? Number(parts[1]) : null;

      if (!food) {
        throw new Error(`Riga non valida: "${line}"`);
      }

      if (parts[1] && isNaN(freq)) {
        throw new Error(`Frequenza non valida alla riga ${index + 1}`);
      }

      if (currentMeal === "Pranzo" || currentMeal === "Cena") {
        newConfig.push(
          { food, meal: "Pranzo", frequency: freq },
          { food, meal: "Cena", frequency: freq }
        );
      } else {
        newConfig.push({ food, meal: currentMeal, frequency: freq });
      }
    });

    if (newConfig.length === 0) {
      throw new Error("File vuoto o formato non valido");
    }

    setConfig(newConfig);
  };

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

  const availableFoods = config.filter((c) => c.meal === meal);

  const usageCount = {};
  logs.forEach((l) => {
    if (l.meal === meal) usageCount[l.food] = (usageCount[l.food] || 0) + 1;
  });

  const quickFoods = Object.entries(usageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([food]) => food);

  const selectedDayLogs = logs.filter(
    (l) => formatDate(l.date) === (selectedDate || today)
  );

  const dayView = { Colazione: [], Spuntino: [], Pranzo: [], Cena: [] };
  selectedDayLogs.forEach((l) => dayView[l.meal].push(l.food));

  const infoImages = {
    Colazione: "/colazione.png",
    Spuntino: "/spuntino.png",
    Pranzo: "/pranzo.png",
    Cena: "/cena.png"
  };

  return (
    <div style={{ padding: 20, maxWidth: 520, margin: "auto", fontFamily: "-apple-system" }}>
      <h1 style={{ fontSize: 26 }}>🍽 Food Tracker</h1>

      {/* ✅ MESSAGGI */}
      {message && (
        <div style={{ marginBottom: 10, fontWeight: "bold" }}>
          {message}
        </div>
      )}

      <button onClick={() => setShowCalendar(!showCalendar)} style={{ marginBottom: 10 }}>
        📅 Calendario
      </button>

      <button onClick={() => setShowConfig(!showConfig)} style={{ marginBottom: 15, marginLeft: 10 }}>
        ⚙️ Configurazione
      </button>

      {showCalendar && (
        <input
          type="date"
          value={selectedDate || today}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ width: "100%", padding: 12, fontSize: 16, marginBottom: 10 }}
        />
      )}

      <div style={{ marginBottom: 15 }}>
        {meals.map((m) => (
          <button key={m} onClick={() => setMeal(m)}
            style={{
              margin: 5,
              padding: "12px 18px",
              borderRadius: 18,
              fontSize: 18,
              background: m === meal ? "#007aff" : "#eee",
              color: m === meal ? "white" : "black"
            }}>
            {m}
          </button>
        ))}
        <button onClick={() => setShowInfo(!showInfo)}>ℹ️</button>
      </div>

      {showInfo && (
        <img src={infoImages[meal]} style={{ width: "100%", borderRadius: 12 }} />
      )}

      <div>
        {quickFoods.map((food) => (
          <button key={food} onClick={() => addLog(food)}>
            + {food}
          </button>
        ))}
      </div>

      <select value={selectedFood} onChange={(e) => setSelectedFood(e.target.value)}>
        <option value="">Seleziona alimento</option>
        {availableFoods.map((c) => (
          <option key={c.food}>{c.food}</option>
        ))}
      </select>

      <button onClick={() => addLog()}>Aggiungi</button>

      <h2>📅 Giorno selezionato</h2>
      {Object.entries(dayView).map(([m, foods]) => (
        <div key={m}>{m}: {foods.join(", ") || "-"}</div>
      ))}

      {showConfig && (
        <div>
          <h2>⚙️ Config</h2>

          <input value={newFood} onChange={(e) => setNewFood(e.target.value)} />
          <select value={configMeal} onChange={(e) => setConfigMeal(e.target.value)}>
            {meals.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <input type="number" value={frequency} onChange={(e) => setFrequency(e.target.value)} />

          <button onClick={addConfig}>Aggiungi</button>
          <button onClick={clearConfig}>Reset Config</button>
          <button onClick={clearLogs}>Reset Log</button>

          {/* ✅ IMPORT */}
          <label style={{ display: "block", marginTop: 10, background: "#007aff", color: "white", padding: 12 }}>
            📄 Importa da file
            <input type="file" accept=".txt" onChange={importFromFile} style={{ display: "none" }} />
          </label>

          <button onClick={exportExcel}>Export</button>
        </div>
      )}
    </div>
  );
}
