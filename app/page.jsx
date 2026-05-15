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

  // ✅ STATS
  const getWeek = (date) => {
    const d = new Date(date);
    return Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 86400000 +
      new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7);
  };

  const currentWeek = getWeek(new Date());

  const stats = {};
  config.forEach(c => {
    if (c?.frequency) stats[c.food] = { total: 0, frequency: c.frequency };
  });

  logs.forEach(l => {
    if (stats[l.food] && getWeek(l.date) === currentWeek) {
      stats[l.food].total++;
    }
  });

  const getColor = (food) => {
    if (!stats[food]) return "#34c759";
    const { total, frequency } = stats[food];

    if (total >= frequency) return "#ff3b30";
    if (total === frequency - 1) return "#ffcc00";
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

  const availableFoods = config.filter(c => c.meal === meal);

  // ✅ CALENDAR VIEW
  const selectedDayLogs = logs.filter(
    (l) => formatDate(l.date) === (selectedDate || today)
  );

  const dayView = { Colazione: [], Spuntino: [], Pranzo: [], Cena: [] };
  selectedDayLogs.forEach((l) => {
    dayView[l.meal].push(l.food);
  });

  // ✅ IMPORT TXT
  const importFromFile = (e) => {
    const file = e.target.files[0];

    if (!file) return setMessage("❌ Nessun file selezionato");
    if (!file.name.endsWith(".txt"))
      return setMessage("❌ File deve essere .txt");

    if (!confirm("Sovrascrivere configurazione?")) return;

    const reader = new FileReader();

    reader.onload = (ev) => {
      try {
        const lines = ev.target.result.split("\n");
        let currentMeal = null;
        const newConfig = [];

        lines.forEach(line => {
          line = line.trim();
          if (!line) return;

          if (meals.includes(line)) {
            currentMeal = line;
            return;
          }

          const [food, freqRaw] = line.split(" ");
          const freq = freqRaw ? Number(freqRaw) : null;

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
        setMessage("✅ Config importata");
      } catch {
        setMessage("❌ Errore file");
      }
    };

    reader.readAsText(file);
  };

  // ✅ EXPORT CONFIG TXT
  const exportConfigTxt = () => {
    let text = "";

    meals.forEach(meal => {
      const items = config.filter(c => c.meal === meal);
      if (items.length === 0) return;

      text += meal + "\n";
      items.forEach(f => {
        text += f.food + (f.frequency ? " " + f.frequency : "") + "\n";
      });
      text += "\n";
    });

    const blob = new Blob([text]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "config.txt";
    a.click();

    setMessage("✅ Config salvata");
  };

  // ✅ EXPORT LOG EXCEL
  const exportLogsExcel = () => {
    const data = logs.map(l => ({
      Data: new Date(l.date).toLocaleDateString(),
      Pasto: l.meal,
      Alimento: l.food
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Log");

    XLSX.writeFile(wb, "food_log.xlsx");
  };

  const addLog = (f) => {
    if (!f) return;
    setLogs([...logs, { food: f, meal, date: new Date().toISOString() }]);
  };

  const addConfig = () => {
    if (!newFood) return;

    const freqNum = frequency ? Number(frequency) : null;

    const items =
      configMeal === "Pranzo" || configMeal === "Cena"
        ? [
            { food: newFood, meal: "Pranzo", frequency: freqNum },
            { food: newFood, meal: "Cena", frequency: freqNum }
          ]
        : [{ food: newFood, meal: configMeal, frequency: freqNum }];

    setConfig([...config, ...items]);
    setNewFood("");
    setFrequency("");
  };

  const infoImages = {
    Colazione: "/colazione.png",
    Spuntino: "/spuntino.png",
    Pranzo: "/pranzo.png",
    Cena: "/cena.png"
  };

  return (
    <div style={{ padding: 20, maxWidth: 520, margin: "auto" }}>

      <h1>🍽 Food Tracker</h1>

      {message && <div>{message}</div>}

      <button onClick={() => setShowCalendar(!showCalendar)}>📅 Calendario</button>
      <button onClick={() => setShowConfig(!showConfig)}>⚙️ Config</button>

      {showCalendar && (
        <input
          type="date"
          value={selectedDate || today}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      )}

      {/* MEALS */}
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {meals.map(m => (
          <button key={m} onClick={() => setMeal(m)}
            style={{
              flex: 1,
              padding: 16,
              margin: 5,
              background: m === meal ? "#007aff" : "#eee",
              color: m === meal ? "white" : "black",
              borderRadius: 18
            }}>
            {m}
          </button>
        ))}
        <button onClick={() => setShowInfo(!showInfo)}>ℹ️</button>
      </div>

      {showInfo && infoImages[meal]}

      {/* QUICK */}
      <div>
        {quickFoods.map(f => (
          <button key={f}
            onClick={() => addLog(f)}
            style={{ background: getColor(f), color: "white" }}>
            + {f}
          </button>
        ))}
      </div>

      <select value={selectedFood} onChange={(e) => setSelectedFood(e.target.value)}>
        <option value="">Seleziona alimento</option>
        {availableFoods.map(c => <option key={c.food}>{c.food}</option>)}
      </select>

      <button onClick={() => addLog(selectedFood)}>+ Aggiungi</button>

      {/* 📅 DAY VIEW */}
      <h2>📅 Giorno</h2>
      {Object.entries(dayView).map(([m, foods]) => (
        <div key={m}>{m}: {foods.join(", ") || "-"}</div>
      ))}

      {/* CONFIG */}
      {showConfig && (
        <div>

          <label style={btnStyle}>
            📄 Importa file
            <input type="file" accept=".txt" onChange={importFromFile} style={{ display: "none" }} />
          </label>

          <button onClick={exportConfigTxt} style={btnStyle}>
            💾 Esporta configurazione (.txt)
          </button>

          <button onClick={exportLogsExcel} style={btnStyle}>
            📊 Esporta log (Excel)
          </button>
        </div>
      )}

    </div>
  );
}

const btnStyle = {
  display: "block",
  width: "100%",
  padding: 16,
  marginTop: 10,
  textAlign: "center",
  fontSize: 16,
  background: "#007aff",
  color: "white",
  borderRadius: 12
};
