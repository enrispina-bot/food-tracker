"use client";
import { auth, provider } from "./firebase";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function Page() {
  const [config, setConfig] = useState([]);
	const [now, setNow] = useState(new Date());
const [category, setCategory] = useState("");
	
  const [logs, setLogs] = useState([]);

	 const getWeek = (date) => {
    const d = new Date(date);
    return Math.ceil(
      ((d - new Date(d.getFullYear(), 0, 1)) / 86400000 +
        new Date(d.getFullYear(), 0, 1).getDay() +
        1) /
        7
    );
  };
  const [message, setMessage] = useState("");
	const [user, setUser] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
	const [loaded, setLoaded] = useState(false);

  const [newFood, setNewFood] = useState("");
  const [frequency, setFrequency] = useState("");
  const [configMeal, setConfigMeal] = useState("Colazione");



const resetWeeklyStats = () => {
  if (!confirm("Azzerare i contatori settimanali?")) return;

  const newLogs = logs.filter(
    (l) => getWeek(l.date) !== currentWeek
  );

  setLogs(newLogs);
  setMessage("✅ Frequenze settimanali azzerate");
};







  const [selectedFood, setSelectedFood] = useState("");
  const [meal, setMeal] = useState("Colazione");
	const [search, setSearch] = useState("");

  const meals = ["Colazione", "Spuntino", "Pranzo", "Cena"];

useEffect(() => {
  const scheduleReset = () => {
    const now = new Date();

    const next = new Date();
    next.setDate(now.getDate() + ((8 - now.getDay()) % 7)); // prossimo lunedì
    next.setHours(0, 2, 0, 0); // 00:02

    // se siamo già oltre → settimana prossima
    if (now > next) {
      next.setDate(next.getDate() + 7);
    }

    const delay = next - now;

    setTimeout(() => {
      setNow(new Date()); // ✅ trigger re-render
      scheduleReset();    // ✅ rischedula per settimana dopo
    }, delay);
  };

  scheduleReset();
}, []);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (u) => {
    setUser(u);
  });

  return () => unsubscribe();
}, []);



useEffect(() => {
  // ✅ NON salvare prima del load
  if (!user || !loaded) return;

  const saveData = async () => {
    try {
      await setDoc(doc(db, "users", user.uid), {
        logs,
        config
      });
      console.log("✅ Salvato");
    } catch (e) {
      console.error("Errore save:", e);
    }
  };

  saveData();
}, [logs, config, user, loaded]);



	




useEffect(() => {
  if (!user) return;

  const loadData = async () => {
    try {
      const docSnap = await getDoc(doc(db, "users", user.uid));

      if (docSnap.exists()) {
        const data = docSnap.data();
        setLogs(data.logs || []);
        const safeConfig = (data.config || []).map(c => ({
  ...c,
  category: c.category || null
}));

setConfig(safeConfig);
      }

      // ✅ IMPORTANTISSIMO
      setLoaded(true);

    } catch (e) {
      console.error("Errore load:", e);
    }
  };

  loadData();
}, [user]);
	



	

	const login = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error(e);
  }
};

  const formatDate = (date) => new Date(date).toISOString().split("T")[0];
  const today = formatDate(new Date());

 



  // ✅ STATS
  const stats = {};
  config.forEach((c) => {
    if (c?.frequency) stats[c.food] = { total: 0, frequency: c.frequency };
  });


logs.forEach((l) => {
  if (getWeek(l.date) !== currentWeek) return;

  const item = config.find(
    c => c.food === l.food && c.meal === l.meal
  );

  if (!item) return;

  const key = item.category || l.food;


	
  if (stats[key]) {
    stats[key].total++;
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



const availableFoods = config
  .filter((c) => c.meal === meal)
  .filter((c) =>
    c.food.toLowerCase().includes(search.toLowerCase())
  )
  .sort((a, b) => a.food.localeCompare(b.food));
	

const categories = config
  .filter(c => c.frequency) // solo quelli con frequenza
  .map(c => c.food);

const currentWeek = getWeek(now);
const trendStats = {};
const prevWeek = currentWeek === 1 ? 52 : currentWeek - 1;

logs.forEach((l) => {
  const week = getWeek(l.date);

  const item = config.find(
    (c) => c.food === l.food && c.meal === l.meal
  );

  // ✅ usa categoria se presente
  const key = item?.category || l.food;

  if (!trendStats[key]) {
    trendStats[key] = {
      name: key,
      current: 0,
      previous: 0
    };
  }

  if (week === currentWeek) {
    trendStats[key].current++;
  } else if (week === prevWeek) {
    trendStats[key].previous++;
  }
});

	const trends = Object.values(trendStats)
  .map((item) => {
    const { current, previous } = item;

    if (previous === 0 && current === 0) return null;

    if (previous === 0) {
      return {
        ...item,
        change: 100
      };
    }

    const change = ((current - previous) / previous) * 100;

    return {
      ...item,
      change: Math.round(change)
    };
  })
  .filter(Boolean)
  .sort((a, b) => b.change - a.change)
  .slice(0, 6);

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


// ✅ Estrai categoria tra ""
const categoryMatch = line.match(/"([^"]+)"/);
const category = categoryMatch ? categoryMatch[1].trim() : null;

// ✅ Rimuovi la categoria dalla linea
const cleanLine = line.replace(/"[^"]+"/, "").trim();

// ✅ Estrai parti
const parts = cleanLine.split(" ");

// ✅ Frequenza (se presente)
let freq = null;
if (!isNaN(parts[parts.length - 1])) {
  freq = Number(parts.pop());
}

// ✅ Nome alimento
const food = parts.join(" ");






			
       

          if (!currentMeal) throw Error();


if (currentMeal === "Pranzo" || currentMeal === "Cena") {
  newConfig.push(
    {
      food,
      meal: "Pranzo",
      frequency: freq,
      category: category || null
    },
    {
      food,
      meal: "Cena",
      frequency: freq,
      category: category || null
    }
  );
} else {
  newConfig.push({
    food,
    meal: currentMeal,
    frequency: freq,
    category: category || null
  });
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

// ✅ aggiungi categoria se presente
if (f.category) {
  text += ` "${f.category}"`;
}

// ✅ aggiungi frequenza se presente
if (f.frequency) {
  text += " " + f.frequency;
}

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
        {
          food: newFood,
          meal: "Pranzo",
          frequency: freqNum,
          category: category || null
        },
        {
          food: newFood,
          meal: "Cena",
          frequency: freqNum,
          category: category || null
        }
      ]
    : [
        {
          food: newFood,
          meal: configMeal,
          frequency: freqNum,
          category: category || null
        }
      ];




	  

    setConfig([...config, ...newItems]);
    setNewFood("");
    setFrequency("");
	  setCategory("");
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



// ✅ BLOCCO LOGIN
if (!user) {
  return (
    <div className="p-4 text-center">
      <button
        onClick={login}
        className="bg-black text-white p-3 rounded-xl"
      >
        🔐 Accedi con Google
      </button>
    </div>
  );
}




return (
	
  <div className="min-h-screen bg-gray-100 p-4 max-w-md mx-auto text-sm">

    <h1 className="text-2xl font-bold mb-3 text-center">🍽 Food Tracker</h1>

    {message && (
      <div className="bg-green-100 text-green-700 p-2 rounded mb-3 text-center">
        {message}
      </div>
    )}

    {/* TOP BUTTONS */}
    <div className="flex justify-between mb-3">
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="bg-white shadow rounded-xl px-4 py-2"
      >
        📅
      </button>

      <button
        onClick={() => setShowConfig(!showConfig)}
        className="bg-white shadow rounded-xl px-4 py-2"
      >
        ⚙️
      </button>
    </div>

    {/* CALENDAR */}
    {showCalendar && (
      <input
        type="date"
        value={selectedDate || today}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="w-full p-3 rounded-xl border mb-3"
      />
    )}

    {/* MEALS */}
    <div className="bg-white rounded-2xl p-3 shadow mb-3">
      <div className="grid grid-cols-2 gap-2">
        {meals.map((m) => (
          <button
            key={m}
            onClick={() => setMeal(m)}
            className={`py-3 rounded-xl ${
              m === meal
                ? "bg-blue-500 text-white"
                : "bg-gray-200"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowInfo(!showInfo)}
        className="mt-2 w-full text-sm"
      >
        ℹ️ Info
      </button>
    </div>

    {/* INFO IMG */}
    {showInfo && (
      <img
        src={infoImages[meal]}
        className="w-full rounded-xl mb-3"
      />
    )}

    {/* QUICK */}
    <div className="bg-white rounded-2xl p-3 shadow mb-3">
      <h3 className="font-semibold mb-2">⚡ Veloci</h3>
      <div className="flex flex-wrap">
        {quickFoods.map((food) => (
          <button
            key={food}
            onClick={() => addLog(food)}
            className="text-white px-3 py-2 m-1 rounded-xl"
            style={{ background: getColor(food) }}
          >
            + {food}
          </button>
        ))}
      </div>
    </div>

    {/* ADD FOOD */}
    <div className="bg-white rounded-2xl p-3 shadow mb-3">
		<input
  type="text"
  placeholder="🔍 Cerca alimento..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="w-full p-3 border rounded-xl mb-2"
/>



<select
  value={selectedFood}
  onChange={(e) => setSelectedFood(e.target.value)}
  className="w-full p-3 border rounded-xl mb-2"
>
  <option value="">Seleziona alimento</option>
  {availableFoods.map((c) => (
<option key={c.food}>{c.food}</option>
  ))}
</select>


		

		



      <button
        onClick={() => addLog()}
        className="w-full bg-blue-500 text-white p-3 rounded-xl"
      >
        + Aggiungi
      </button>
    </div>

    {/* DAY VIEW */}
    <div className="bg-white rounded-2xl p-3 shadow mb-3">
      <h3 className="font-semibold mb-2">📅 Giorno</h3>

      {Object.entries(dayView).map(([meal, foods]) => (
        <div key={meal} className="mb-1">
          <span className="font-medium">{meal}: </span>
          {foods.join(", ") || "-"}
        </div>
      ))}
    </div>

    {/* STATS */}
    <div className="bg-white rounded-2xl p-3 shadow mb-3">
      <h3 className="font-semibold mb-2">📊 Frequenze</h3>

      {Object.entries(stats).map(([food, val]) => (
        <div key={food} className="flex justify-between">
          <span>{food}</span>
          <span style={{ color: getColor(food) }}>
            {val.total}/{val.frequency}
          </span>
        </div>
      ))}
    </div>


	  <div className="bg-white rounded-2xl p-3 shadow mb-3">
  <h3 className="font-semibold mb-2">📊 Trend settimanale</h3>

  {trends.map((t) => {
    const isUp = t.change >= 0;

    return (
      <div key={t.name} className="flex justify-between mb-1">
        <span>{t.name}</span>

        <span style={{
          color: isUp ? "#34c759" : "#ff3b30"
        }}>
          {isUp ? "↑" : "↓"} {Math.abs(t.change)}%
        </span>
      </div>
    );
  })}
</div>

    {/* CONFIG */}
    {showConfig && (
      <div className="bg-white rounded-2xl p-3 shadow mt-4">

        <input
          value={newFood}
          onChange={(e) => setNewFood(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          placeholder="Nuovo alimento"
        />

        <select
          value={configMeal}
          onChange={(e) => setConfigMeal(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        >
          {meals.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Frequenza"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />

		  
<select
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  className="w-full p-2 border rounded mb-2"
>
  <option value="">Nessuna categoria</option>
  {categories.map((c) => (
    <option key={c}>{c}</option>
  ))}
</select>


        <button
          onClick={addConfig}
          className="w-full bg-blue-500 text-white p-2 rounded mb-2"
        >
          ➕ Aggiungi
        </button>

        <button onClick={clearConfig} className="w-full mb-1">
          Elimina Config Frequenze
        </button>
		  


        <button onClick={clearLogs} className="w-full mb-3">
          Reset Log Giorno
        </button>

		  <button
  onClick={resetWeeklyStats}
  className="w-full mb-3 bg-orange-500 text-white p-2 rounded"
>
  🔄 Reset Config Frequenze
</button>

        {/* IMPORT EXCEL */}
        <label className="block bg-blue-500 text-white text-center p-2 rounded mb-2">
          📊 Importa Excel
          <input
            type="file"
            accept=".xlsx"
            onChange={importLogsFromExcel}
            hidden
          />
        </label>

        {/* IMPORT TXT */}
        <label className="block bg-blue-500 text-white text-center p-2 rounded mb-2">
          📄 Importa TXT
          <input
            type="file"
            accept=".txt"
            onChange={importFromFile}
            hidden
          />
        </label>

        {/* EXPORT */}
        <button
          onClick={exportConfigTxt}
          className="w-full bg-green-500 text-white p-2 rounded mb-2"
        >
          💾 Config
        </button>

        <button
          onClick={exportLogsExcel}
          className="w-full bg-green-600 text-white p-2 rounded"
        >
          📊 Log Excel
        </button>

      </div>
    )}

  </div>
);
}
