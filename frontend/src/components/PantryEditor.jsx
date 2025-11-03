import React, { useState, useEffect, useRef } from "react";
import ingredients from "../data/ingredients.json";
import "./PantryEditor.css";

const API_BASE = process.env.REACT_APP_API_URL || "";

function slugify(name){ return name.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9\-\u0590-\u05FF]/g,""); }

export default function PantryEditor(){
  const [items,setItems] = useState(()=>{ try{ const r=JSON.parse(localStorage.getItem("pantry")||"[]"); if(!Array.isArray(r)) return []; if(typeof r[0]==="string") return r.map(n=>({name:n,qty:1})); return r.map(i=>({id:i.id,name:i.name,qty:i.qty??1})); }catch{ return []; }});
  const [text,setText] = useState("");
  const [suggestions,setSuggestions] = useState([]);
  const [openSuggestions,setOpenSuggestions] = useState(false);
  const [suggestionIndex,setSuggestionIndex] = useState(-1);
  const [expandedIndex,setExpandedIndex] = useState(null);
  const [drawerOpen,setDrawerOpen] = useState(false);

  const inputRef = useRef(null);

  useEffect(()=> localStorage.setItem("pantry", JSON.stringify(items)), [items]);

  useEffect(()=>{
    const t = text.trim().toLowerCase();
    if(!t){ setSuggestions([]); setOpenSuggestions(false); setSuggestionIndex(-1); return; }
    const matches = ingredients.filter(i=>i.toLowerCase().includes(t)).slice(0,10);
    setSuggestions(matches); setOpenSuggestions(true); setSuggestionIndex(matches.length?0:-1);
  },[text]);

  useEffect(()=>{
    let mounted = true;
    
    // בקשה לקבלת כל המוצרים מהמקרר
    const fetchPantryItems = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/pantry`);
        if (!response.ok) throw new Error('Failed to fetch pantry items');
        
        const serverItems = await response.json();
        
        if (!mounted) return;
        
        if (Array.isArray(serverItems)) {
          // מיון אלפביתי בעת טעינה מהשרת
          const sortedItems = serverItems
            .map(item => ({
              id: item.id,
              name: item.name,
              qty: item.qty ?? 1
            }))
            .sort((a, b) => a.name.localeCompare(b.name, 'he'));
          
          setItems(sortedItems);
        }
      } catch (error) {
        console.log('Failed to fetch from server, using local storage');
        // מיון גם של הנתונים המקומיים
        setItems(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name, 'he')));
      }
    };

    fetchPantryItems();
    
    return () => { mounted = false; };
  },[]);

  useEffect(()=>{
    document.body.classList.toggle("pantry-drawer-open", drawerOpen);
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return ()=>{ document.body.classList.remove("pantry-drawer-open"); document.body.style.overflow = ""; };
  },[drawerOpen]);

  const apiCreate = async (name,qty=1)=> {
    const r = await fetch(`${API_BASE}/api/pantry`,{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name,qty}) });
    if(!r.ok) throw new Error(); return r.json();
  };
  const apiUpdate = async (id,qty)=> {
    const r = await fetch(`${API_BASE}/api/pantry/${id}`,{ method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({qty}) });
    if(!r.ok) throw new Error(); return r.json();
  };
  const apiDelete = async (id)=> {
    const r = await fetch(`${API_BASE}/api/pantry/${id}`,{ method:"DELETE" });
    if(!r.ok && r.status!==204) throw new Error(); return true;
  };

  const addItem = async (value)=>{
    const v = (value ?? text).trim(); if(!v) return;
    const match = ingredients.find(i=>i.toLowerCase()===v.toLowerCase()); if(!match){ setOpenSuggestions(true); return; }
    try{
      const serverItem = await apiCreate(match,1);
      setItems(prev=>{ 
        const idx = prev.findIndex(p=>p.name.toLowerCase()===match.toLowerCase()); 
        if(idx>=0){ 
          const c=[...prev]; 
          c[idx]=serverItem; 
          // מיון אלפביתי
          return c.sort((a, b) => a.name.localeCompare(b.name, 'he'));
        } 
        const newItems = [...prev, serverItem];
        // מיון אלפביתי
        return newItems.sort((a, b) => a.name.localeCompare(b.name, 'he'));
      });
    }catch{
      setItems(prev=>{ 
        const idx = prev.findIndex(p=>p.name.toLowerCase()===v.toLowerCase()); 
        if(idx>=0){ 
          const c=[...prev]; 
          c[idx]={...c[idx],qty:(c[idx].qty||0)+1}; 
          // מיון אלפביתי
          return c.sort((a, b) => a.name.localeCompare(b.name, 'he'));
        } 
        const newItems = [...prev, {name:match,qty:1}];
        // מיון אלפביתי
        return newItems.sort((a, b) => a.name.localeCompare(b.name, 'he'));
      });
    }
    setText(""); setSuggestions([]); setOpenSuggestions(false); setSuggestionIndex(-1); inputRef.current?.focus();
  };

  const changeQty = async (index, qty)=>{
    const it = items[index]; if(!it) return;
    if(qty<=0){ // remove
      if(it.id){ try{ await apiDelete(it.id); }catch{} }
      setItems(prev=>{ const c=[...prev]; c.splice(index,1); return c; });
      setExpandedIndex(null);
      return;
    }
    if(it.id){
      try{
        const updated = await apiUpdate(it.id, qty);
        setItems(prev=>{ const c=[...prev]; c[index]=updated; return c; });
        return;
      }catch{}
    }
    setItems(prev=>{ const c=[...prev]; c[index] = {...c[index], qty}; return c; });
  };

  const removeItem = async (index)=> changeQty(index, 0);

  const onKeyDownInput = (e)=>{
    if(openSuggestions && suggestions.length){
      if(e.key==="ArrowDown"){ e.preventDefault(); setSuggestionIndex(s=> (s+1>=suggestions.length?0:s+1)); return; }
      if(e.key==="ArrowUp"){ e.preventDefault(); setSuggestionIndex(s=> (s-1<0?suggestions.length-1:s-1)); return; }
      if(e.key==="Enter"){ e.preventDefault(); if(suggestionIndex>=0) addItem(suggestions[suggestionIndex]); return; }
      if(e.key==="Escape"){ setOpenSuggestions(false); setSuggestionIndex(-1); return; }
    } else {
      if(e.key==="Enter"){ e.preventDefault(); addItem(); }
      if(e.key==="Escape"){ setOpenSuggestions(false); }
    }
  };

  return (
    <>
      <button className={`pantry-open-handle ${drawerOpen?"hidden":""}`} onClick={()=>{ setDrawerOpen(true); setTimeout(()=>inputRef.current?.focus(),180); }} aria-label="פתח מקרר">🧺</button>
      <div className={`pantry-overlay ${drawerOpen?"visible":""}`} onClick={()=>setDrawerOpen(false)} />
      <aside id="pantry-drawer" className={`pantry-drawer ${drawerOpen?"open":""}`} role="dialog" aria-label="Pantry drawer">
        <div className="pantry-drawer-header">
          <button className="drawer-close" onClick={()=>setDrawerOpen(false)}>✕</button>
          <h3 className="drawer-title">מזווה</h3>
        </div>
        <div className="pantry-drawer-content">
          <div className="pantry-input" style={{position:"relative"}}>
            <div className="search-wrap">
              <span className="search-icon">🔎</span>
              <input ref={inputRef} value={text} onChange={e=>setText(e.target.value)} onKeyDown={onKeyDownInput}
                placeholder="חפש או הוסיף מרכיב" autoComplete="off" inputMode="search"
                onFocus={()=>setOpenSuggestions(Boolean(text.trim()))} />
              {text && <button className="clear-btn" onClick={()=>{ setText(""); setSuggestions([]); setOpenSuggestions(false); inputRef.current?.focus(); }}>✕</button>}
            </div>
            {openSuggestions && (
              <ul className="pantry-suggestions centered enhanced" role="listbox" aria-label="suggestions">
                {suggestions.length? suggestions.map((s,idx)=>(
                  <li key={s} tabIndex={0} onClick={()=>addItem(s)} onKeyDown={e=>{ if(e.key==="Enter") addItem(s); }} className={suggestionIndex===idx?"selected":""} role="option" aria-selected={suggestionIndex===idx}>{s}</li>
                )) : <li className="no-results">לא נמצאו תוצאות</li>}
              </ul>
            )}
          </div>

          {items.length===0 ? <div className="pantry-no-items">המקרר ריק — הוסף פריט מהרשימה</div> :
            <ul className="pantry-list" aria-label="pantry items">
              {items.map((it,i)=>{
                const slug = slugify(it.name);
                return (
                  <li key={it.id||it.name} className="pantry-item-block">
                    <div className={`pantry-item ${expandedIndex===i?"expanded":""}`} onClick={()=>setExpandedIndex(expandedIndex===i?null:i)} role="button" tabIndex={0}>
                      <div className="item-top-row">
                        <img className="item-img" src={`/images/ingredients/${slug}.png`} alt={it.name} onError={e=>e.currentTarget.style.visibility="hidden"} />
                        <span className="item-name">{it.name}</span>
                        <span className="item-qty">{it.qty}</span>
                      </div>
                      {expandedIndex===i && (
                        <div className="item-controls-row" onClick={e=>e.stopPropagation()}>
                          <button className="qty-btn minus" onClick={()=>changeQty(i,(it.qty||0)-1)} aria-label={`decrease ${it.name}`}>−</button>
                          <button className="qty-btn plus" onClick={()=>changeQty(i,(it.qty||0)+1)} aria-label={`increase ${it.name}`}>+</button>
                          <button className="remove-full" onClick={()=>removeItem(i)} aria-label={`remove ${it.name}`}>✕</button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          }
        </div>
      </aside>
    </>
  );
}