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
    return Math.ceil(
      ((d - new Date(d.getFullYear(), 0, 1)) / 86400000 +
        new Date(d.getFullYear(), 0, 1).getDay() +
        1) /
        7
    );
  };

  const currentWeek = getWeek(new Date());

  // ✅ STATS
  const stats = {};
  config.forEach((c) => {
    if (c?.frequency) stats[c.food] = { total: 0, frequency: c.frequency };
  });

  logs.forEach((l) => {
    if (stats[l.food] && getWeek(l.date) === currentWeek) {
      stats[l.food].total++;
    }
  });

  // ✅ COLORI
  const getColor = (food) => {
    if (!stats[food]) return "#34c759";
    const { total, frequency } = stats[food];

    if (total >= frequency) return "#ff3b30";
    if (total === frequency - 1) return "#ffcc00";
    return "#34c759";
  };

  // ✅ QUICK
  const usage = {};
  logs.forEach((l) => {
    if (l.meal === meal) {
      usage[l.food] = (usage[l.food] || 0) + 1;
    }
  });

  const quickFoods = Object.keys(usage)
    .sort((a, b) => usage[b] - usage[a])
    .slice(0, 4);

  const availableFoods = config.filter((c) => c.meal === meal);



// ✅ IMPORT EXCEL (COMPATIBILE CON IL TUO FILE)
const importLogsFromExcel = (e) => {
  const file = e.target.files[0];

  if (!file) {
    setMessage("❌ Nessun file selezionato");
    return;
  }

  const reader = new FileReader();

  reader.onload = (evt) => {
    try {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // ✅ rimuove intestazione
      const flatRows = rows.flat().filter(r => r !== undefined);

      const newLogs = [];

      for (let i = 3; i < flatRows.length; i += 3) {
        const dateStr = flatRows[i];
        const food = flatRows[i + 1];
        const meal = flatRows[i + 2];

        if (!dateStr || !food || !meal) continue;

        // ✅ conversione data sicura
        const parts = dateStr.split("/");
        const dateISO = parts.length === 3
          ? new Date(parts[2], parts[1] - 1, parts[0]).toISOString()
          : new Date(dateStr).toISOString();

        newLogs.push({
          food,
          meal,
          date: dateISO
        });
      }

      setLogs([...logs, ...newLogs]);
      setMessage(`✅ Importati ${newLogs.length} log`);
    } catch (err) {
      console.error(err);
      setMessage("❌ Errore import Excel");
    }
  };

  reader.readAsArrayBuffer(file);
};



	
	
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

        lines.forEach((line) => {
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
        setMessage("✅ Config importata con successo");
      } catch {
        setMessage("❌ Errore nel file");
      }
    };

    reader.readAsText(file);
  };


// ✅ EXPORT LOG: 1 riga = 1 alimento
const exportLogsExcel = () => {
  if (logs.length === 0) {
    setMessage("❌ Nessun log da esportare");
    return;
  }

  const data = logs.map(l => ({
    Data: new Date(l.date).toLocaleDateString(),
    Alimento: l.food,
    Pasto: l.meal
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Food Log");

  XLSX.writeFile(wb, "food_logs.xlsx");

  setMessage("✅ Log esportati in Excel");
};




  // ✅ EXPORT TXT
  const exportConfigTxt = () => {
    if (config.length === 0) {
      setMessage("❌ Nessuna configurazione da esportare");
      return;
    }

    const grouped = {
      Colazione: [],
      Spuntino: [],
      Pranzo: [],
      Cena: []
    };

    config.forEach((c) => {
      if (!grouped[c.meal]) return;

      if (
        c.meal === "Cena" &&
        config.find((x) => x.food === c.food && x.meal === "Pranzo")
      )
        return;

      grouped[c.meal].push(c);
    });

    let text = "";

    Object.entries(grouped).forEach(([meal, foods]) => {
      if (foods.length === 0) return;

      text += meal + "\n";

      foods.forEach((f) => {
        text += f.food;
        if (f.frequency) text += " " + f.frequency;
        text += "\n";
      });

      text += "\n";
    });

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "config_food_tracker.txt";
    a.click();

    URL.revokeObjectURL(url);

    setMessage("✅ File configurazione salvato");
  };

  // ✅ LOG
 const addLog = (foodOverride) => {
  const f = foodOverride || selectedFood;
  if (!f) return;

  // ✅ usa data selezionata o oggi
  const baseDate = selectedDate || today;

  // ✅ crea data completa (con ora attuale)
  const now = new Date();
  const fullDate = new Date(baseDate);

  fullDate.setHours(now.getHours());
  fullDate.setMinutes(now.getMinutes());
  fullDate.setSeconds(now.getSeconds());

  setLogs([
    ...logs,
    {
      food: f,
      meal,
      date: fullDate.toISOString()
    }
  ]);
};

  // ✅ CONFIG
  const addConfig = () => {
    if (!newFood) return;

    const freqNum = frequency ? Number(frequency) : null;

    const newItems =
      configMeal === "Pranzo" || configMeal === "Cena"
        ? [
            { food: newFood, meal: "Pranzo", frequency: freqNum },
            { food: newFood, meal: "Cena", frequency: freqNum }
          ]
        : [{ food: newFood, meal: configMeal, frequency: freqNum }];

    setConfig([...config, ...newItems]);
    setNewFood("");
    setFrequency("");
  };

  const clearConfig = () => confirm("Reset config?") && setConfig([]);
const clearLogs = () => {
  const targetDate = selectedDate || today;

  if (!confirm("Cancellare i log del giorno selezionato?")) return;

  const filteredLogs = logs.filter(
    (l) => formatDate(l.date) !== targetDate
  );

  setLogs(filteredLogs);
  setMessage("✅ Log del giorno eliminati");
};

  
const selectedDayLogs = logs.filter(
  (l) => formatDate(l.date) === (selectedDate || today)
);

const dayView = {
  Colazione: [],
  Spuntino: [],
  Pranzo: [],
  Cena: []
};

selectedDayLogs.forEach((l) => {
  if (dayView[l.meal]) {
    dayView[l.meal].push(l.food);
  }
});


  const infoImages = {
    Colazione: "/colazione.png",
    Spuntino: "/spuntino.png",
    Pranzo: "/pranzo.png",
    Cena: "/cena.png"
  };


const btnStyle = {
  display: "block",
  width: "100%",
  padding: 14,
  marginTop: 10,
  textAlign: "center",
  fontSize: 16,
  background: "#007aff",
  color: "white",
  border: "none",
  borderRadius: 12
};

const cardStyle = {
  background: "white",
  borderRadius: 16,
  padding: 16,
  marginBottom: 15,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
};





		<div style={cardStyle}>
  <select
    value={selectedFood}
    onChange={(e) => setSelectedFood(e.target.value)}
    style={{
      width: "100%",
      padding: 16,
      borderRadius: 12,
      border: "1px solid #ccc",
      marginBottom: 10
    }}
  >
    <option value="">Seleziona alimento</option>
    {availableFoods.map(c => (
      <option key={c.food}>{c.food}</option>
    ))}
  </select>

  <button
    onClick={() => addLog()}
    style={{
      width: "100%",
      padding: 16,
      borderRadius: 12,
      background: "#007aff",
      color: "white",
      border: "none",
      fontWeight: "bold"
    }}
  >
    + Aggiungi
  </button>
</div>





		
	


	
  return (
 <div style={{
  padding: 15,
  maxWidth: 520,
  margin: "auto",
  fontFamily: "-apple-system",
  background: "#f2f2f7",
  minHeight: "100vh"
}}>

      <h1>🍽 Food Tracker</h1>

      {message && <div>{message}</div>}

      <button onClick={() => setShowCalendar(!showCalendar)}>📅</button>
      <button onClick={() => setShowConfig(!showConfig)}>⚙️</button>
	  
	  
{showCalendar && (
  <input
    type="date"
    value={selectedDate || today}
    onChange={(e) => setSelectedDate(e.target.value)}
    style={{ width: "100%", padding: 12, marginTop: 10 }}
  />
)}


      {/* ✅ PASTI + INFO */}
      <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 10 }}>
        {meals.map((m) => (
          <button
            key={m}
            onClick={() => setMeal(m)}
            style={{
              flex: "1",
              margin: 5,
              padding: 16,
              borderRadius: 18,
              background: m === meal ? "#007aff" : "#eee",
              color: m === meal ? "white" : "black"
            }}
          >
            {m}
          </button>
        ))}
        <button onClick={() => setShowInfo(!showInfo)} style={{ marginLeft: 10 }}>
          ℹ️
        </button>
      </div>

      {/* ✅ IMMAGINE INFO */}
      
		{showInfo && (
		  <img
			src={infoImages[meal]}
			style={{ width: "100%", borderRadius: 12, marginBottom: 10 }}
		  />
		)}


{/* ✅ CARD PASTI */}
<div style={cardStyle}>
  <div style={{ display: "flex", flexWrap: "wrap" }}>
    {meals.map((m) => (
      <button
        key={m}
        onClick={() => setMeal(m)}
        style={{
          flex: 1,
          margin: 5,
          padding: 14,
          borderRadius: 14,
          background: m === meal ? "#007aff" : "#eee",
          color: m === meal ? "white" : "black",
          border: "none"
        }}
      >
        {m}
      </button>
    ))}
  </div>
</div>

{/* ✅ QUICK */}
<div style={cardStyle}>
  <h3>⚡ Veloci</h3>
  {quickFoods.map(food => (
    <button
      key={food}
      onClick={() => addLog(food)}
      style={{
        background: getColor(food),
        color: "white",
        padding: 12,
        margin: 5,
        borderRadius: 12,
        border: "none"
      }}
    >
      + {food}
    </button>
  ))}
</div>

{/* ✅ SELECT */}
<div style={cardStyle}>
  <select
    value={selectedFood}
    onChange={(e) => setSelectedFood(e.target.value)}
    style={{
      width: "100%",
      padding: 16,
      borderRadius: 12,
      border: "1px solid #ccc",
      marginBottom: 10
    }}
  >
    <option value="">Seleziona alimento</option>
    {availableFoods.map(c => (
      <option key={c.food}>{c.food}</option>
    ))}
  </select>

  <button
    onClick={() => addLog()}
    style={{
      width: "100%",
      padding: 16,
      borderRadius: 12,
      background: "#007aff",
      color: "white",
      border: "none"
    }}
  >
    + Aggiungi
  </button>
</div>

{/* ✅ GIORNO */}
<div style={cardStyle}>
  <h3>📅 Giorno</h3>
  {Object.entries(dayView).map(([m, foods]) => (
    <div key={m}>
      <strong>{m}:</strong> {foods.join(", ") || "-"}
    </div>
  ))}
</div>

{/* ✅ STATS */}
<div style={cardStyle}>
  <h3>📊 Frequenze</h3>
  {Object.entries(stats).map(([food, val]) => (
    <div key={food} style={{ display: "flex", justifyContent: "space-between" }}>
      <span>{food}</span>
      <span style={{ color: getColor(food) }}>
        {val.total}/{val.frequency}
      </span>
    </div>
  ))}
</div>


      {/* CONFIG */}
      {showConfig && (
        <div>
          <input
            value={newFood}
            onChange={(e) => setNewFood(e.target.value)}
            style={{ width: "100%", padding: 14 }}
          />

          <select
            value={configMeal}
            onChange={(e) => setConfigMeal(e.target.value)}
            style={{ width: "100%", padding: 14 }}
          >
            {meals.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>

          <input
            type="number"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            style={{ width: "100%", padding: 14 }}
          />

          <button onClick={addConfig} style={{ width: "100%", padding: 16 }}>
            ➕ Aggiungi
          </button>

          <button onClick={clearConfig}>Reset Config</button>
          <button onClick={clearLogs}>Reset Log</button>

    
<label style={btnStyle}>
  📊 Importa log da Excel
  <input
    type="file"
    accept=".xlsx"
    onChange={importLogsFromExcel}
    style={{ display: "none" }}
  />
</label>
      
		  {/* IMPORT */}
<label style={btnStyle}>
  📄 Importa file
  <input
    type="file"
    accept=".txt"
    onChange={importFromFile}
    style={{ display: "none" }}
  />
</label>

{/* EXPORT CONFIG */}
<button onClick={exportConfigTxt} style={btnStyle}>
  💾 Esporta configurazione (.txt)
</button>

{/* ✅ NUOVO EXPORT LOG */}
<button onClick={exportLogsExcel} style={btnStyle}>
  📊 Esporta log (Excel)
</button>
		  
		  
		  
		  
        </div>
      )}
    </div>
  );
}
