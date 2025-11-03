const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const swaggerUi = (() => { try { return require('swagger-ui-express'); } catch { return null; } })();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// in-memory store - פשוט בלי תמונות
let pantry = [
  { id: 1, name: 'ביצים 🥚', qty: 6 },
  { id: 2, name: 'עגבניות 🍅', qty: 3 }
];

// load static ingredients
let ingredients = [];
try {
  const ingPath = path.join(__dirname, '../../frontend/src/data/ingredients.json');
  if (fs.existsSync(ingPath)) ingredients = JSON.parse(fs.readFileSync(ingPath, 'utf8'));
} catch (e) { ingredients = []; }

const swaggerSpec = { openapi:'3.0.0', info:{ title:'Fridge Recipes API', version:'1.0.0' }, servers:[{ url: `http://localhost:${PORT}` }] };
if (swaggerUi) app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req,res)=> res.send('Fridge Recipes API — running'));
app.get('/api/pantry', (req,res) => res.json(pantry));

app.post('/api/pantry', (req,res) => {
  const { name, qty = 1 } = req.body || {};
  if (!name) return res.status(400).json({ error:'name required' });
  const existing = pantry.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (existing) { 
    existing.qty = (existing.qty||0) + Number(qty); 
    return res.status(200).json(existing); 
  }
  const item = { id: Date.now(), name, qty: Number(qty) };
  pantry.push(item);
  res.status(201).json(item);
});

app.post('/api/pantry/bulk', (req,res) => {
  const list = Array.isArray(req.body) ? req.body : [];
  const result = [];
  list.forEach(it => {
    if (!it || !it.name) return;
    const name = it.name; 
    const qty = Number(it.qty ?? 1);
    const existing = pantry.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existing) { 
      existing.qty = (existing.qty||0) + qty; 
      result.push(existing); 
    } else { 
      const item = { id: Date.now() + Math.floor(Math.random()*1000), name, qty };
      pantry.push(item); 
      result.push(item); 
    }
  });
  res.json(result);
});

app.get('/api/pantry/:id', (req,res) => {
  const id = Number(req.params.id);
  const item = pantry.find(p => p.id === id);
  if (!item) return res.status(404).json({ error:'not found' });
  res.json(item);
});

app.put('/api/pantry/:id', (req,res) => {
  const id = Number(req.params.id);
  const { qty } = req.body || {};
  const idx = pantry.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error:'not found' });
  if (!Number.isNaN(Number(qty))) pantry[idx].qty = Number(qty);
  res.json(pantry[idx]);
});

app.delete('/api/pantry/:id', (req,res) => {
  const id = Number(req.params.id);
  const prevLen = pantry.length;
  pantry = pantry.filter(p => p.id !== id);
  if (pantry.length === prevLen) return res.status(404).json({ error:'not found' });
  res.status(204).end();
});

app.get('/api/ingredients', (req,res) => res.json(ingredients));

app.get('/api/search', (req,res) => {
  const q = (req.query.q||'').toString().trim().toLowerCase();
  if (!q) return res.json({ pantry:[], ingredients:[] });
  const pantryMatches = pantry.filter(p => p.name.toLowerCase().includes(q));
  const ingMatches = ingredients.filter(i => i.toLowerCase().includes(q)).slice(0,20);
  res.json({ pantry: pantryMatches, ingredients: ingMatches });
});

app.post('/api/pantry/import-ingredients', (req, res) => {
  const result = [];
  ingredients.forEach(name => {
    const existing = pantry.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (!existing) {
      const item = { id: Date.now() + Math.floor(Math.random() * 10000), name, qty: 1 };
      pantry.push(item);
      result.push(item);
    }
  });
  res.json({ imported: result.length, items: result });
});

const buildPath = path.join(__dirname, '../../frontend/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req,res) => res.sendFile(path.join(buildPath,'index.html')));
}

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}${swaggerUi ? ' — docs: http://localhost:' + PORT + '/docs' : ''}`));