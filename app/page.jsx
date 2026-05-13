"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

export default function Page() {
  const [config, setConfig] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newFood, setNewFood] = useState("");
  const [frequency, setFrequency] = useState("");
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
    return Math.ceil(
      ((d - new Date(d.getFullYear(), 0, 1)) / 86400000 +
        new Date(d.getFullYear(), 0, 1).getDay() +
        1) /
        7
    );
  };

  const currentWeek = getWeek(new Date());

  const addConfig = () => {
    if (!newFood || !frequency) return;
    setConfig([...config, { food: newFood, frequency: Number(frequency) }]);
    setNewFood("");
    setFrequency("");
  };

  const addLog = () => {
    if (!selectedFood) return;
    setLogs([
      ...logs,
      { food: selectedFood, meal, date: new Date().toISOString() },
    ]);
  };

  const clearConfig = () => setConfig([]);
  const clearLogs = () => setLogs([]);

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

  const stats = {};
  config.forEach((c) => {
    stats[c.food] = { total: 0, frequency: c.frequency };
  });

  logs.forEach((l) => {
    if (getWeek(l.date) === currentWeek && stats[l.food]) {
      stats[l.food].total += 1;
    }
  });

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>🍽 Food Tracker</h1>

      <h2>⚙️ Configurazione</h2>
      <input
        placeholder="Nuovo alimento"
        value={newFood}
        onChange={(e) => setNewFood(e.target.value)}
      />
      <input
        type="number"
        placeholder="Frequenza settimanale"
        value={frequency}
        onChange={(e) => setFrequency(e.target.value)}
      />
      <button onClick={addConfig}>Aggiungi alimento</button>
      <button onClick={clearConfig}>Reset Config</button>
      <button onClick={clearLogs}>Reset Consumi</button>

      <h2>➕ Inserimento rapido</h2>
      <select value={selectedFood} onChange={(e) => setSelectedFood(e.target.value)}>
        <option value="">Seleziona alimento</option>
        {config.map((c) => (
          <option key={c.food}>{c.food}</option>
        ))}
      </select>
      <select value={meal} onChange={(e) => setMeal(e.target.value)}>
        {meals.map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>
      <button onClick={addLog}>+ Aggiungi</button>

      <h2>📊 Situazione settimana</h2>
      {Object.entries(stats).map(([key, value]) => {
        const remaining = value.frequency - value.total;
        const color =
          remaining < 0 ? "red" : remaining === 0 ? "orange" : "green";

        return (
          <div key={key} style={{ marginBottom: 10 }}>
            <strong>{key}</strong>
            <div style={{ color }}>
              {value.total}/{value.frequency} → restano {remaining}
            </div>
          </div>
        );
      })}

      <h2>📥 Export</h2>
      <button onClick={exportExcel}>Scarica Excel</button>
    </div>
  );
}
