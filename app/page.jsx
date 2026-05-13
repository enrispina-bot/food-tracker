
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function FoodTrackerApp() {
  const [food, setFood] = useState("");
  const [frequency, setFrequency] = useState("");
  const [logs, setLogs] = useState([]);

  // ✅ Salvataggio persistente (sicuro, locale)
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
    <div className="p-4 grid gap-4">
      <h1 className="text-xl font-bold">🍽 Food Tracker</h1>

      <Card>
        <CardContent className="p-4 grid gap-2">
          <Input
            placeholder="Alimento"
            value={food}
            onChange={(e) => setFood(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Frequenza settimanale"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          />
          <Button onClick={addEntry}>+ Aggiungi</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold mb-2">📊 Questa settimana</h2>
          {Object.keys(foodStats).length === 0 && (
            <p>Nessun dato ancora</p>
          )}
          {Object.entries(foodStats).map(([key, value]) => {
            const remaining = value.frequency - value.total;
            const color =
              remaining < 0
                ? "text-red-600"
                : remaining === 0
                ? "text-yellow-600"
                : "text-green-600";


            return (
              <div key={key} className="mb-3">
                <div className="font-medium">{key}</div>
                <div className={color}>
                  {value.total} / {value.frequency} · Rimanenti: {remaining}
                </div>
                <Button
                  className="mt-1"
                  onClick={() => addQuick(key, value.frequency)}
                >
                  +1
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );


  function addQuick(foodName, freq) {
    const today = new Date().toISOString().split("T")[0];
    setLogs([...logs, { food: foodName, frequency: freq, date: today }]);
  }
}

/*
✅ COME INSTALLARLA SU IPHONE (SICURO)

1. Pubblica questa app (es. con Vercel o Netlify)
2. Apri il link in Safari su iPhone
3. Premi condividi → "Aggiungi a schermata Home"

✅ SICUREZZA
- Nessun dato viene inviato a server
- Tutto salvato in localStorage (solo sul tuo dispositivo)
- Nessun tracking / nessuna API esterna

✅ EXTRA (per app completa)
Aggiungi file manifest.json nel progetto:

{
  "name": "Food Tracker",
  "short_name": "Tracker",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}

E in index.html:
/manifest.json

👉 Così diventa una vera PWA installabile
*/
