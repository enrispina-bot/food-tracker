"use client";
import { useState, useEffect } from "react";

export default function Page() {
  const [food, setFood] = useState("");
  const [frequency, setFrequency] = useState("");
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("foodLogs");
      if (saved) setLogs(JSON.parse(saved));
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("foodLogs", JSON.stringify(logs));
    } catch (e) {}
  }, [logs]);

  const addEntry = () => {
    if (!food || !frequency) return;
    setLogs([
      ...logs,
      { food, frequency: Number(frequency), date: new Date().toISOString() },
    ]);
    setFood("");
  };

  const addQuick = (foodName, freq) => {
    setLogs([
      ...logs,
      { food: foodName, frequency: freq, date: new Date().toISOString() },
    ]);
  };

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
    <div style={{ padding: 20 }}>
      <h1>🍽 Food Tracker</h1>

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

      <h2>Questa settimana</h2>

      {Object.entries(foodStats).map(([key, value]) => {
        const remaining = value.frequency - value.total;
        return (
          <div key={key}>
            <strong>{key}</strong> → {value.total}/{value.frequency} (restano {remaining})
            <button onClick={() => addQuick(key, value.frequency)}>+1</button>
          </div>
        );
      })}
    </div>
  );
}

