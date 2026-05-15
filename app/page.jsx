"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

export default function Page() {
  const [config, setConfig] = useState([]);
  const [logs, setLogs] = useState([]);

  const [showConfig, setShowConfig] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [meal, setMeal] = useState("Colazione");
  const [selectedFood, setSelectedFood] = useState("");

  const [newFood, setNewFood] = useState("");
  const [frequency, setFrequency] = useState("");
  const [configMeal, setConfigMeal] = useState("Colazione");

  const meals = ["Colazione", "Spuntino", "Pranzo", "Cena"];

  // STORAGE
  useEffect(() => {
    const c = localStorage.getItem("config");
    const l = localStorage.getItem("logs");
    if (c) setConfig(JSON.parse(c));
    if (l) setLogs(JSON.parse(l));
  }, []);

  useEffect(() => localStorage.setItem("config", JSON.stringify(config)), [config]);
  useEffect(() => localStorage.setItem("logs", JSON.stringify(logs)), [logs]);

  // WEEK
  const getWeek = (date) => {
    const d = new Date(date);
    return Math.ceil(
      ((d - new Date(d.getFullYear(), 0, 1)) / 86400000 +
        new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7
    );
  };

  const currentWeek = getWeek(new Date());

  // CONFIG
  const addConfig = () => {
    if (!newFood) return;

    const items =
      configMeal === "Pranzo" || configMeal === "Cena"
        ? [
            { food: newFood, meal: "Pranzo", frequency: Number(frequency) },
            { food: newFood, meal: "Cena", frequency: Number(frequency) }
          ]
        : [{ food: newFood, meal: configMeal, frequency: Number(frequency) }];

    setConfig([...config, ...items]);
    setNewFood("");
    setFrequency("");
  };

  const clearConfig = () => confirm("Reset configurazione?") && setConfig([]);
  const clearLogs = () => confirm("Reset consumi?") && setLogs([]);

  const addLog = (f) => {
    if (!f) return;
    setLogs([...logs, { food: f, meal, date: new Date().toISOString() }]);
  };

  // STATS
  const stats = {};
  config.forEach(c => {
    if (c.frequency) stats[c.food] = { total: 0, frequency: c.frequency };
  });

  logs.forEach(l => {
    if (getWeek(l.date) === currentWeek && stats[l.food]) {
      stats[l.food].total++;
    }
  });

  const getColor = (food) => {
    if (!stats[food]) return "#34c759";
    const r = stats[food].frequency - stats[food].total;
    if (r < 0) return "#ff3b30";
    if (r === 0) return "#ff9500";
    return "#34c759";
  };

  // QUICK
  const usage = {};
  logs.forEach(l => {
    if (l.meal === meal) usage[l.food] = (usage[l.food] || 0) + 1;
  });

  const quickFoods = Object.keys(usage)
    .sort((a,b)=>usage[b]-usage[a])
    .slice(0,4);

  const availableFoods = config.filter(c => c.meal === meal);

  // SUGGERIMENTI
  const allowed = [];
  const blocked = [];

  Object.entries(stats).forEach(([f,v]) => {
    const r = v.frequency - v.total;
    if (r>0) allowed.push(f);
    else blocked.push(f);
  });

  return (
    <div style={{
      padding: 20,
      maxWidth: 480,
      margin: "auto",
      fontFamily: "-apple-system",
      background: "#f2f2f7"
    }}>

      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28 }}>🍽 Food Tracker</h1>
        <button onClick={()=>setShowConfig(!showConfig)}>⚙️</button>
      </div>

      {/* SUGGERIMENTI */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ color:"#34c759" }}>
          ✅ {allowed.join(", ") || "ok tutto"}
        </div>
        <div style={{ color:"#ff3b30" }}>
          ❌ {blocked.join(", ") || "-"}
        </div>
      </div>

      {/* MEAL SELECT */}
      <div style={{ display:"flex", flexWrap:"wrap", marginBottom:20 }}>
        {meals.map(m=>(
          <button key={m} onClick={()=>setMeal(m)}
            style={{
              flex:1,
              margin:4,
              padding:14,
              borderRadius:14,
              background: m===meal ? "#007aff" : "#fff",
              color: m===meal ? "white" : "black",
              border:"none"
            }}>
            {m}
          </button>
        ))}
      </div>

      {/* QUICK */}
      <div style={{ display:"flex", flexWrap:"wrap", marginBottom:20 }}>
        {quickFoods.map(f=>(
          <button key={f} onClick={()=>addLog(f)}
            style={{
              flex:"0 0 48%",
              margin:"1%",
              padding:18,
              borderRadius:18,
              background:getColor(f),
              color:"white",
              fontSize:18
            }}>
            + {f}
          </button>
        ))}
      </div>

      {/* SELECT */}
      <select value={selectedFood}
        onChange={e=>setSelectedFood(e.target.value)}
        style={{ width:"100%", padding:16, borderRadius:12 }}>
        <option value="">Seleziona alimento</option>
        {availableFoods.map(c=>(
          <option key={c.food}>{c.food}</option>
        ))}
      </select>

      <button onClick={()=>addLog(selectedFood)}
        style={{
          width:"100%",
          padding:16,
          marginTop:10,
          borderRadius:14,
          background:"#007aff",
          color:"white"
        }}>
        Aggiungi
      </button>

      {/* STATS */}
      <div style={{ marginTop:20 }}>
        {Object.entries(stats).map(([f,v])=>{
          const r = v.frequency - v.total;
          return (
            <div key={f}
              style={{
                padding:16,
                marginBottom:10,
                borderRadius:16,
                background:"#fff"
              }}>
              <b>{f}</b>
              <div style={{ color:getColor(f), fontSize:20 }}>
                {v.total}/{v.frequency}
              </div>
              <div style={{ fontSize:12 }}>
                restano {r}
              </div>
            </div>
          );
        })}
      </div>

      {/* CONFIG */}
      {showConfig && (
        <div style={{ marginTop:30 }}>

          <h2>Configurazione</h2>

          <input value={newFood}
            onChange={e=>setNewFood(e.target.value)}
            placeholder="Alimento"
            style={{ width:"100%", padding:16, marginBottom:10, borderRadius:12 }}
          />

          <select value={configMeal}
            onChange={e=>setConfigMeal(e.target.value)}
            style={{ width:"100%", padding:16, marginBottom:10, borderRadius:12 }}>
            {meals.map(m=> <option key={m}>{m}</option>)}
          </select>

          <input type="number"
            value={frequency}
            onChange={e=>setFrequency(e.target.value)}
            placeholder="Frequenza"
            style={{ width:"100%", padding:16, marginBottom:10, borderRadius:12 }}
          />

          <button onClick={addConfig}
            style={{
              width:"100%",
              padding:18,
              borderRadius:14,
              background:"#34c759",
              color:"white",
              fontSize:18
            }}>
            ➕ Aggiungi alimento
          </button>

          <button onClick={clearConfig}>Reset Config</button>
          <button onClick={clearLogs}>Reset Log</button>

        </div>
      )}
    </div>
  );
}
