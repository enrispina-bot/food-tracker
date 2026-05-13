
"use client";
import { useState, useEffect } from "react";

export default function FoodTrackerApp() {
  const [food, setFood] = useState("");
  const [frequency, setFrequency] = useState("");
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("foodLogs");
    if (saved) setLogs(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("foodLogs", JSON.stringify(logs));
  }, [logs]);

  const getWeek = (date) => {
    const d = new Date(date);
    const onejan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  };

  const addEntry = () => {
    if (!food || !frequency) return;
    const today = new Date().toISOString().split("T")[0];
    setLogs([...logs, { food, frequency: Number(frequency), date: today }]);
    setFood("");
  };

  const addQuick = (foodName, freq) => {
    const today = new Date().toISOString().split("T")[0];
    setLogs([...logs, { food: foodName, frequency: freq, date: today }]);
  };

  const currentWeek = getWeek(new Date());

  const foodStats = {};
  logs.forEach((log) => {
    if (getWeek(log.date) === currentWeek) {
      if (!foodStats[log.food]) {
        foodStats[log.food] = { total: 0, frequency: log.frequency };
      }
      foodStats[log.food].total += 1;
    }
  });

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>🍽 Food Tracker</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Alimento"
          value={food}
          onChange={(e) => setFood(e.target.value)}
        />
        <input
          type="number"
          placeholder="Frequenza"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
        />
        <button onClick={addEntry}>Aggiungi</button>
      </div>

      <h2>📊 Questa settimana</h2>

      {Object.keys(foodStats).length === 0 && <p>Nessun dato</p>}

      {Object.entries(foodStats).map(([key, value]) => {
        const remaining = value.frequency - value.total;

        return (
          <div key={key} style={{ marginBottom: 10 }}>
            <strong>{key}</strong>
            <div>
              {value.total} / {value.frequency} → Rimanenti: {remaining}
            </div>
            <button onClick={() => addQuick(key, value.frequency)}>
              +1
            </button>
          </div>
        );
      })}
    </div>
  );
}
