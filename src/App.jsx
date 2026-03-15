import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  WORK_TYPES, ERECTOR_SCOPES,
  DEFAULT_ERECTOR_LIST, DEFAULT_SUPPLIERS, DEFAULT_GALVANIZERS,
  DEFAULT_JOB_ERECTORS,
  fmt, fmtD, fmtN, today, ci, sel,
} from './constants.js';
import { SH, SecLbl, QSec, R, Lbl, Note, Badge, Chip, Toggle, Btn } from './components.jsx';

// ── HELPERS ────────────────────────────────────────────────────────────────────
function genId() { return Date.now() + Math.random(); }

const PLATE_WT = {
  "3/16":7.65,"1/4":10.2,"5/16":12.75,"3/8":15.3,"7/16":17.85,"1/2":20.4,
  "9/16":22.95,"5/8":25.5,"3/4":30.6,"7/8":35.7,"1":40.8,"1 1/4":51.0,"1 1/2":61.2,"2":81.6,
};
const PLATE_THICKNESSES = Object.keys(PLATE_WT);
const MISC_ITEM_TYPES = ["C / MC","L (Angle)","2L (Dbl Angle)","Plate","HSS Rect","Pipe","Stainless","Other"];

function rowTotalLbs(r) {
  if (r.isPlate) {
    const w = parseFloat(r.widthFt)||0, l = parseFloat(r.lengthFt)||0, q = parseFloat(r.qty)||0;
    return w * l * q * (PLATE_WT[r.thickness] || 0);
  }
  const len = (r.lengths||[]).reduce((a,b)=>a+b,0);
  return (parseFloat(r.weightPerFt)||0) * len;
}
function rowType(r) {
  return (r.itemType === 'Stainless') ? 'stainless' : (r._scope === 'structural' ? 'structural' : 'misc');
}

// ── LENGTHS EDITOR ─────────────────────────────────────────────────────────────
function LengthsEditor({ lengths, onChange, onClose }) {
  const [inputs, setInputs] = useState(lengths.length > 0 ? lengths.map(String) : [""]);
  const update = (i,v) => { const n=[...inputs]; n[i]=v; setInputs(n); };
  const validNums = inputs.map(v=>parseFloat(v)).filter(v=>v>0);
  const total = validNums.reduce((a,b)=>a+b,0);
  const save = () => { onChange(validNums); onClose(); };

  return (
    <div style={{background:"#1a2030",border:"1px solid #3b82f666",borderRadius:6,padding:12,marginTop:6}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:9,color:"#3b82f6",letterSpacing:2,textTransform:"uppercase"}}>Piece Lengths (ft)</span>
        <span style={{fontSize:10,color:"#6b7280"}}>{validNums.length} pcs · {total.toFixed(2)} ft</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4,maxHeight:120,overflowY:"auto",marginBottom:8}}>
        {inputs.map((val,i) => (
          <div key={i} style={{display:"flex",gap:2,alignItems:"center"}}>
            <input type="number" min="0" step="0.083" value={val}
              onChange={e=>update(i,e.target.value)} placeholder="ft"
              style={{...ci(54),fontSize:11,padding:"3px 5px"}}/>
            {inputs.length > 1 &&
              <button onClick={()=>setInputs(inputs.filter((_,j)=>j!==i))}
                style={{background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:12,padding:0}}>×</button>}
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,borderTop:"1px solid #2d3340",paddingTop:8}}>
        <button onClick={()=>setInputs([...inputs,""])}
          style={{background:"none",border:"1px solid #2d3340",borderRadius:4,color:"#6b7280",padding:"3px 10px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>
          + Add
        </button>
        <div style={{flex:1}}/>
        <button onClick={onClose}
          style={{background:"none",border:"none",color:"#6b7280",padding:"3px 8px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        <button onClick={save}
          style={{background:"#3b82f6",border:"none",borderRadius:4,color:"white",padding:"3px 12px",fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Save</button>
      </div>
    </div>
  );
}

// ── STRUCTURAL TAKEOFF ─────────────────────────────────────────────────────────
function newStructRow(cf="") {
  return { id:genId(), shape:"", weightPerFt:"", lengths:[], costFactor:cf, _scope:"structural" };
}

function StructRow({ row, onChange, onDelete }) {
  const [showLengths, setShowLengths] = useState(false);
  const set = (k,v) => onChange({...row,[k]:v});
  const totalLength = (row.lengths||[]).reduce((a,b)=>a+b,0);
  const wplf = parseFloat(row.weightPerFt)||0;
  const totalLbs = wplf * totalLength;
  const cf = parseFloat(row.costFactor)||0;
  const cost = (cf * totalLbs) / 100;
  const hasLens = row.lengths && row.lengths.length > 0;

  return (
    <div style={{background:"#13171f",border:"1px solid #1e2532",borderRadius:6,marginBottom:6,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"2fr 0.9fr 1.1fr 0.9fr 1fr 0.9fr 1fr 24px",gap:6,padding:"8px 10px",alignItems:"center"}}>
        <input type="text" value={row.shape} onChange={e=>set("shape",e.target.value.toUpperCase())}
          placeholder="W12X53 / HSS6X6X1/4 / S12X50" style={{...ci("100%"),fontSize:12}}/>
        <input type="number" value={row.weightPerFt} onChange={e=>set("weightPerFt",e.target.value)}
          placeholder="lb/ft" style={{...ci("100%"),fontSize:12,textAlign:"right"}}/>
        <button onClick={()=>setShowLengths(!showLengths)} style={{
          background:hasLens?"#1e3a5f":"#1a2030",
          border:`1px solid ${hasLens?"#3b82f6":"#2d3340"}`,
          borderRadius:4,color:hasLens?"#60a5fa":"#6b7280",
          padding:"4px 6px",fontSize:10,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
          {hasLens ? `${row.lengths.length} pcs · ${totalLength.toFixed(1)}'` : "Add lengths ›"}
        </button>
        <span style={{fontSize:11,color:"#9ca3af",textAlign:"right"}}>{totalLength>0?totalLength.toFixed(1)+"'":"—"}</span>
        <span style={{fontSize:11,color:"#c8cdd6",textAlign:"right",fontWeight:totalLbs>0?600:400}}>
          {totalLbs>0?(totalLbs>=2000?(totalLbs/2000).toFixed(2)+"T":Math.round(totalLbs).toLocaleString()+" lb"):"—"}
        </span>
        <input type="number" value={row.costFactor} onChange={e=>set("costFactor",e.target.value)}
          placeholder="¢/lb" style={{...ci("100%"),fontSize:12,textAlign:"right"}}/>
        <span style={{fontSize:11,textAlign:"right",fontWeight:600,color:cost>0?"#e85c26":"#4b5563"}}>
          {cost>0?"$"+Math.round(cost).toLocaleString():"—"}
        </span>
        <button onClick={onDelete} style={{background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:14,padding:0}}>×</button>
      </div>
      {showLengths && (
        <div style={{padding:"0 10px 8px"}}>
          <LengthsEditor lengths={row.lengths||[]} onChange={lens=>set("lengths",lens)} onClose={()=>setShowLengths(false)}/>
        </div>
      )}
    </div>
  );
}

function StructuralTakeoff({ rows, setRows, defaultCf }) {
  const addRow = () => setRows(r=>[...r, newStructRow(defaultCf)]);
  const del = id => setRows(r=>r.filter(x=>x.id!==id));
  const upd = row => setRows(r=>r.map(x=>x.id===row.id?row:x));

  const totLbs = rows.reduce((a,r)=>a+rowTotalLbs(r),0);
  const totCost = rows.reduce((a,r)=>{
    const lbs=rowTotalLbs(r), cf=parseFloat(r.costFactor)||0;
    return a+(cf*lbs/100);
  },0);

  const HDR = {fontSize:9,color:"#6b7280",letterSpacing:1.5,textTransform:"uppercase"};
  return (
    <div>
      {defaultCf && (
        <div style={{marginBottom:12,padding:"6px 12px",background:"#13171f",border:"1px solid #1e2532",borderRadius:4,fontSize:10,color:"#6b7280"}}>
          Default ¢/lb from active supplier: <strong style={{color:"#c8cdd6"}}>{defaultCf} ¢/lb</strong> — edit per row to override
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"2fr 0.9fr 1.1fr 0.9fr 1fr 0.9fr 1fr 24px",gap:6,padding:"0 10px 6px",borderBottom:"1px solid #1e2532",marginBottom:6}}>
        {["Shape / Section","Wt/Ft (lb)","Lengths","Total Ft","Total Wt","¢ / lb","Material $",""].map(h=>(
          <span key={h} style={HDR}>{h}</span>
        ))}
      </div>
      {rows.map(row=>(
        <StructRow key={row.id} row={row} onChange={upd} onDelete={()=>del(row.id)}/>
      ))}
      <button onClick={addRow} style={{
        width:"100%",marginTop:4,padding:"8px",border:"2px dashed #2d3340",borderRadius:6,
        background:"none",color:"#4b5563",cursor:"pointer",fontSize:11,fontFamily:"inherit",
        transition:"all 0.15s"
      }}>+ Add Section</button>
      {totLbs > 0 && (
        <div style={{marginTop:16,background:"#0e1117",border:"1px solid #e85c2633",borderRadius:8,padding:"12px 16px",display:"flex",gap:24,flexWrap:"wrap"}}>
          <div><div style={{fontSize:9,color:"#6b7280",letterSpacing:1.5,textTransform:"uppercase",marginBottom:3}}>Total Weight</div>
            <div style={{fontSize:16,color:"#edf0f4",fontWeight:700}}>{(totLbs/2000).toFixed(2)} tons <span style={{fontSize:11,color:"#6b7280",fontWeight:400}}>({Math.round(totLbs).toLocaleString()} lb)</span></div></div>
          <div><div style={{fontSize:9,color:"#6b7280",letterSpacing:1.5,textTransform:"uppercase",marginBottom:3}}>Material Cost</div>
            <div style={{fontSize:16,color:"#e85c26",fontWeight:700}}>${Math.round(totCost).toLocaleString()}</div></div>
        </div>
      )}
    </div>
  );
}

// ── MISC METALS TAKEOFF ────────────────────────────────────────────────────────
function newMiscRow(cf="") {
  return { id:genId(), itemType:"L (Angle)", shape:"", weightPerFt:"", lengths:[], costFactor:cf,
           isPlate:false, thickness:"1/4", widthFt:"", lengthFt:"", qty:"", _scope:"misc" };
}

function MiscRow({ row, onChange, onDelete }) {
  const [showLengths, setShowLengths] = useState(false);
  const set = (k,v) => {
    let u = {...row,[k]:v};
    if (k==="itemType") u.isPlate = (v==="Plate");
    onChange(u);
  };

  const totalLbs = rowTotalLbs(row);
  const totalLength = row.isPlate ? 0 : (row.lengths||[]).reduce((a,b)=>a+b,0);
  const cf = parseFloat(row.costFactor)||0;
  const cost = (cf * totalLbs) / 100;
  const hasData = row.isPlate
    ? (parseFloat(row.widthFt)>0 && parseFloat(row.lengthFt)>0)
    : (row.lengths && row.lengths.length > 0);

  return (
    <div style={{background:"#13171f",border:"1px solid #1e2532",borderRadius:6,marginBottom:6,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"0.7fr 1.6fr 0.9fr 1.3fr 0.9fr 1fr 0.9fr 1fr 24px",gap:5,padding:"8px 10px",alignItems:"center"}}>
        <select value={row.itemType} onChange={e=>set("itemType",e.target.value)}
          style={{...sel,fontSize:10,padding:"4px 4px",width:"100%"}}>
          {MISC_ITEM_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        <input type="text" value={row.shape} onChange={e=>set("shape",e.target.value.toUpperCase())}
          placeholder={row.isPlate?"PL description":"L4X4X1/2 / C8X11.5"}
          style={{...ci("100%"),fontSize:11}}/>
        {row.isPlate ? (
          <select value={row.thickness} onChange={e=>set("thickness",e.target.value)}
            style={{...sel,fontSize:10,padding:"4px 4px",width:"100%"}}>
            {PLATE_THICKNESSES.map(t=><option key={t} value={t}>{t}"</option>)}
          </select>
        ) : (
          <input type="number" value={row.weightPerFt} onChange={e=>set("weightPerFt",e.target.value)}
            placeholder="lb/ft" style={{...ci("100%"),fontSize:11,textAlign:"right"}}/>
        )}
        {row.isPlate ? (
          <div style={{display:"flex",gap:3,alignItems:"center"}}>
            <input type="number" value={row.widthFt} onChange={e=>set("widthFt",e.target.value)}
              placeholder="W'" style={{...ci(38),fontSize:10,padding:"4px 4px"}}/>
            <span style={{color:"#4b5563",fontSize:10}}>×</span>
            <input type="number" value={row.lengthFt} onChange={e=>set("lengthFt",e.target.value)}
              placeholder="L'" style={{...ci(38),fontSize:10,padding:"4px 4px"}}/>
            <input type="number" value={row.qty} onChange={e=>set("qty",e.target.value)}
              placeholder="qty" style={{...ci(30),fontSize:10,padding:"4px 4px"}}/>
          </div>
        ) : (
          <button onClick={()=>setShowLengths(!showLengths)} style={{
            background:hasData?"#1e3a5f":"#1a2030",
            border:`1px solid ${hasData?"#3b82f6":"#2d3340"}`,
            borderRadius:4,color:hasData?"#60a5fa":"#6b7280",
            padding:"4px 4px",fontSize:9,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
            {hasData?`${row.lengths.length} pcs · ${totalLength.toFixed(1)}'`:"Add lengths ›"}
          </button>
        )}
        <span style={{fontSize:10,color:"#9ca3af",textAlign:"right"}}>{(!row.isPlate&&totalLength>0)?totalLength.toFixed(1)+"'":"—"}</span>
        <span style={{fontSize:10,color:"#c8cdd6",textAlign:"right",fontWeight:totalLbs>0?600:400}}>
          {totalLbs>0?(totalLbs>=2000?(totalLbs/2000).toFixed(2)+"T":Math.round(totalLbs).toLocaleString()+" lb"):"—"}
        </span>
        <input type="number" value={row.costFactor} onChange={e=>set("costFactor",e.target.value)}
          placeholder="¢/lb" style={{...ci("100%"),fontSize:11,textAlign:"right"}}/>
        <span style={{fontSize:10,textAlign:"right",fontWeight:600,color:cost>0?"#3b82f6":"#4b5563"}}>
          {cost>0?"$"+Math.round(cost).toLocaleString():"—"}
        </span>
        <button onClick={onDelete} style={{background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:14,padding:0}}>×</button>
      </div>
      {showLengths && !row.isPlate && (
        <div style={{padding:"0 10px 8px"}}>
          <LengthsEditor lengths={row.lengths||[]} onChange={lens=>set("lengths",lens)} onClose={()=>setShowLengths(false)}/>
        </div>
      )}
    </div>
  );
}

function MiscTakeoff({ rows, setRows, defaultCf }) {
  const addRow = () => setRows(r=>[...r, newMiscRow(defaultCf)]);
  const del = id => setRows(r=>r.filter(x=>x.id!==id));
  const upd = row => setRows(r=>r.map(x=>x.id===row.id?row:x));

  const totLbs = rows.reduce((a,r)=>a+rowTotalLbs(r),0);
  const totCost = rows.reduce((a,r)=>{const lbs=rowTotalLbs(r),cf=parseFloat(r.costFactor)||0;return a+(cf*lbs/100);},0);

  const HDR = {fontSize:9,color:"#6b7280",letterSpacing:1.5,textTransform:"uppercase"};
  return (
    <div>
      {defaultCf && (
        <div style={{marginBottom:12,padding:"6px 12px",background:"#13171f",border:"1px solid #1e2532",borderRadius:4,fontSize:10,color:"#6b7280"}}>
          Default ¢/lb from active supplier: <strong style={{color:"#c8cdd6"}}>{defaultCf} ¢/lb</strong> — edit per row to override.
          Plate weights auto-calculated from thickness.
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"0.7fr 1.6fr 0.9fr 1.3fr 0.9fr 1fr 0.9fr 1fr 24px",gap:5,padding:"0 10px 6px",borderBottom:"1px solid #1e2532",marginBottom:6}}>
        {["Type","Shape / Desc","Wt/ft or Thk","Lengths / Dims","Total Ft","Total Wt","¢ / lb","Material $",""].map(h=>(
          <span key={h} style={HDR}>{h}</span>
        ))}
      </div>
      {rows.map(row=>(
        <MiscRow key={row.id} row={row} onChange={upd} onDelete={()=>del(row.id)}/>
      ))}
      <button onClick={addRow} style={{
        width:"100%",marginTop:4,padding:"8px",border:"2px dashed #2d3340",borderRadius:6,
        background:"none",color:"#4b5563",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>
        + Add Item
      </button>
      {totLbs > 0 && (
        <div style={{marginTop:16,background:"#0e1117",border:"1px solid #3b82f633",borderRadius:8,padding:"12px 16px",display:"flex",gap:24,flexWrap:"wrap"}}>
          <div><div style={{fontSize:9,color:"#6b7280",letterSpacing:1.5,textTransform:"uppercase",marginBottom:3}}>Total Weight</div>
            <div style={{fontSize:16,color:"#edf0f4",fontWeight:700}}>{(totLbs/2000).toFixed(2)} tons <span style={{fontSize:11,color:"#6b7280",fontWeight:400}}>({Math.round(totLbs).toLocaleString()} lb)</span></div></div>
          <div><div style={{fontSize:9,color:"#6b7280",letterSpacing:1.5,textTransform:"uppercase",marginBottom:3}}>Material Cost</div>
            <div style={{fontSize:16,color:"#3b82f6",fontWeight:700}}>${Math.round(totCost).toLocaleString()}</div></div>
        </div>
      )}
    </div>
  );
}

// ── PRINT VIEW ─────────────────────────────────────────────────────────────────
function renderPrintView(est, jobNum, jobName, supplier, isPW, requiresAISC, taxPct, isGalv, detail, inspect, miscCost, ovhd, marg, burdenRate, companyName, quoteNotes) {
  const pv = document.getElementById("print-view");
  const badges = [isPW ? "Prevailing Wage" : null, requiresAISC ? "AISC Required" : null].filter(Boolean);
  pv.innerHTML = `
    <div class="pv-header">
      <div>
        <div class="pv-co">${companyName || "R&R Fabrication, Inc."}</div>
        <div class="pv-co-sub">Steel Fabrication &amp; Erection</div>
      </div>
      <div class="pv-meta">
        <strong>FABRICATION QUOTE</strong><br/>
        <span>Date: ${today()}</span><br/>
        <span>Quote #: ${jobNum}</span>
      </div>
    </div>
    <div class="pv-job">
      <div class="pv-job-row">
        <div class="pv-job-item"><label>Job Name</label><span>${jobName}</span></div>
        <div class="pv-job-item"><label>Job #</label><span>${jobNum}</span></div>
        <div class="pv-job-item"><label>Supplier</label><span>${supplier}</span></div>
        <div class="pv-job-item"><label>Total Tonnage</label><span>${fmtN(est.totalTons,2)} tons</span></div>
      </div>
      ${badges.length ? `<div class="pv-badges">${badges.map(b=>`<span class="pv-badge">${b}</span>`).join("")}</div>` : ""}
    </div>
    <div class="pv-section">
      <div class="pv-section-title">Scope of Supply</div>
      <table class="pv-table">
        <thead><tr><th>Work Type</th><th class="right">Tons</th></tr></thead>
        <tbody>
          ${WORK_TYPES.filter(w=>est.tonsByType[w.id]>0).map(w=>`
            <tr><td>${w.label}</td><td class="right">${fmtN(est.tonsByType[w.id],2)} T</td></tr>
          `).join("")}
          <tr style="font-weight:700;border-top:2px solid #ccc"><td>Total</td><td class="right">${fmtN(est.totalTons,2)} T</td></tr>
        </tbody>
      </table>
    </div>
    <div class="pv-section">
      <div class="pv-section-title">Cost Summary</div>
      ${[
        ["Steel Material", est.matCost],
        taxPct>0 ? ["Sales Tax ("+taxPct+"%)", est.taxCost] : null,
        ["Bolts &amp; Hardware", est.bolts||0],
        est.paintMat>0 ? ["Paint Material (Shop)", est.paintMat] : null,
        est.touchCost>0 ? ["Touch-Up Paint (Field)", est.touchCost] : null,
        isGalv ? ["Galvanizing (Sendout)", est.galvCost] : null,
        ["Shop Labor", est.totalLabor],
        ["Shop Burden", est.totalBurden],
        ["Erection", est.totalErection],
        (est.freightC||0)>0 ? ["Freight", est.freightC||0] : null,
        detail>0 ? ["Detailing", detail] : null,
        inspect>0 ? ["Inspection", inspect] : null,
        (est.miscCost||0)>0 ? ["Miscellaneous", est.miscCost||0] : null,
        isPW ? ["Certified Payroll Admin", est.pwAdmCost] : null,
      ].filter(Boolean).map(([l,v])=>`
        <div class="pv-total-row"><span>${l}</span><span>${fmt(v)}</span></div>
      `).join("")}
      <div class="pv-total-row"><span>Overhead (${ovhd}%)</span><span>${fmt(est.ovhdCost)}</span></div>
      <div class="pv-total-row"><span>Margin (${marg}%)</span><span>${fmt(est.margCost)}</span></div>
      <div class="pv-total-row hi"><span>TOTAL QUOTE</span><span>${fmt(est.total)}</span></div>
      <div style="text-align:right;font-size:11px;color:#888;margin-top:4px">${est.totalTons>0 ? fmtD(est.total/est.totalTons)+"/ton" : ""}</div>
    </div>
    <div class="pv-section">
      <div class="pv-section-title">Notes &amp; Exclusions</div>
      <div class="pv-notes">${quoteNotes || "Quote valid for 30 days from date above. Prices subject to material market conditions at time of order. Excludes open web joists, metal deck, rebar, light gage framing, and concrete."}</div>
    </div>
    <div class="pv-footer">
      This quote is for estimating purposes. Final pricing subject to review of complete contract documents.<br/>
      ${companyName || "R&R Fabrication, Inc."} &bull; ${today()}
    </div>
  `;
}

// ── PRICE LISTS TAB ────────────────────────────────────────────────────────────
function PriceListsTab({ suppliers, setSuppliers, erectorList, setErectorList, galvanizers, setGalvanizers }) {
  const [section, setSection] = useState("suppliers");
  const [activeSup, setActiveSup] = useState(Object.keys(suppliers)[0]);
  const [newSupName, setNewSupName] = useState("");
  const fileRef = useRef();

  const handleUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => {
        const vals = line.split(","); const obj = {};
        headers.forEach((h,i) => { obj[h] = vals[i]?.trim()||""; });
        return obj;
      });
      if (!rows.length) return;
      const supName = rows[0].supplier || activeSup;
      const items = rows.map(r => ({section:r.section||"", desc:r.description||r.desc||"", ppl:parseFloat(r.price_per_lb||r.ppl)||0}));
      setSuppliers(s => ({...s, [supName]: items}));
      setActiveSup(supName);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const SUB = [
    {id:"suppliers", label:"Material Suppliers"},
    {id:"erectors",  label:"Erectors"},
    {id:"galv",      label:"Galvanizers"},
  ];

  return (
    <div>
      <SH title="Price Lists" sub="Manage all vendor pricing. Upload CSV to replace a supplier's list instantly, or edit inline."/>
      <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:"1px solid #1e2532"}}>
        {SUB.map(s => (
          <button key={s.id} onClick={()=>setSection(s.id)} style={{
            background:"none",border:"none",cursor:"pointer",padding:"8px 18px",
            fontSize:10,letterSpacing:2,textTransform:"uppercase",
            color:section===s.id?"#10b981":"#6b7280",
            borderBottom:section===s.id?"2px solid #10b981":"2px solid transparent",
            fontFamily:"inherit",marginBottom:-1,
          }}>{s.label}</button>
        ))}
      </div>

      {section === "suppliers" && (
        <div>
          <div style={{display:"flex",gap:14,marginBottom:20,alignItems:"flex-end",flexWrap:"wrap"}}>
            <div>
              <Lbl>Supplier</Lbl>
              <select value={activeSup} onChange={e=>setActiveSup(e.target.value)} style={{...sel,marginTop:6,display:"block"}}>
                {Object.keys(suppliers).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Lbl>New Supplier</Lbl>
              <div style={{display:"flex",gap:8,marginTop:6}}>
                <input value={newSupName} onChange={e=>setNewSupName(e.target.value)} placeholder="Name" style={{...ci(150),padding:"6px 10px"}}/>
                <Btn onClick={()=>{
                  if (!newSupName.trim()) return;
                  setSuppliers(s=>({...s,[newSupName.trim()]:[]}));
                  setActiveSup(newSupName.trim());
                  setNewSupName("");
                }}>Add</Btn>
              </div>
            </div>
            <div style={{marginLeft:"auto"}}>
              <Lbl>Upload CSV (supplier, section, description, price_per_lb)</Lbl>
              <div style={{marginTop:6}}>
                <input ref={fileRef} type="file" accept=".csv" onChange={handleUpload} style={{display:"none"}}/>
                <Btn onClick={()=>fileRef.current.click()}>Upload CSV → {activeSup}</Btn>
              </div>
            </div>
          </div>
          <div style={{overflowX:"auto"}}>
            <table>
              <thead>
                <tr style={{color:"#6b7280",fontSize:9,letterSpacing:1.5,textTransform:"uppercase"}}>
                  {["Section","Description","$/Lb",""].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"8px 10px",borderBottom:"1px solid #1e2532"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(suppliers[activeSup]||[]).map((row,i) => (
                  <tr key={i} style={{background:i%2===0?"#13171f":"transparent"}}>
                    <td style={{padding:"6px 10px"}}>
                      <input value={row.section} onChange={e=>setSuppliers(s=>({...s,[activeSup]:s[activeSup].map((r,j)=>j===i?{...r,section:e.target.value}:r)}))} style={ci(120)}/>
                    </td>
                    <td style={{padding:"6px 10px"}}>
                      <input value={row.desc} onChange={e=>setSuppliers(s=>({...s,[activeSup]:s[activeSup].map((r,j)=>j===i?{...r,desc:e.target.value}:r)}))} style={ci(200)}/>
                    </td>
                    <td style={{padding:"6px 10px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <span style={{color:"#6b7280",fontSize:12}}>$</span>
                        <input type="number" value={row.ppl} onChange={e=>setSuppliers(s=>({...s,[activeSup]:s[activeSup].map((r,j)=>j===i?{...r,ppl:+e.target.value}:r)}))} style={{...ci(80),textAlign:"right"}}/>
                        <span style={{color:"#6b7280",fontSize:11}}>/lb</span>
                      </div>
                    </td>
                    <td style={{padding:"6px 10px"}}>
                      <button onClick={()=>setSuppliers(s=>({...s,[activeSup]:s[activeSup].filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:16}}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{marginTop:12}}>
            <Btn onClick={()=>setSuppliers(s=>({...s,[activeSup]:[...(s[activeSup]||[]),{section:"",desc:"",ppl:0}]}))}>
              + Add Row to {activeSup}
            </Btn>
          </div>
        </div>
      )}

      {section === "erectors" && (
        <div>
          <Note>AISC toggle: shown on AISC-required jobs. In-House: flags your own crew. PW adder is per erector — set the delta between their normal rate and the prevailing wage rate for that trade/county.</Note>
          <div style={{height:12}}/>
          <div style={{overflowX:"auto",marginBottom:14}}>
            <table>
              <thead>
                <tr style={{color:"#6b7280",fontSize:9,letterSpacing:1.5,textTransform:"uppercase"}}>
                  {["Company","$/Ton","Mob ($)","PW Adder/T","AISC","In-House","Notes",""].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"8px 10px",borderBottom:"1px solid #1e2532",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {erectorList.map((row,i) => (
                  <tr key={i} style={{background:i%2===0?"#13171f":"transparent"}}>
                    <td style={{padding:"6px 10px"}}><input value={row.name} onChange={e=>setErectorList(r=>r.map((x,j)=>j===i?{...x,name:e.target.value}:x))} style={ci(170)}/></td>
                    <td style={{padding:"6px 10px"}}><input type="number" value={row.rate} onChange={e=>setErectorList(r=>r.map((x,j)=>j===i?{...x,rate:+e.target.value}:x))} style={{...ci(75),textAlign:"right"}}/></td>
                    <td style={{padding:"6px 10px"}}><input type="number" value={row.mob} onChange={e=>setErectorList(r=>r.map((x,j)=>j===i?{...x,mob:+e.target.value}:x))} style={{...ci(75),textAlign:"right"}}/></td>
                    <td style={{padding:"6px 10px"}}><input type="number" value={row.pwAdd} onChange={e=>setErectorList(r=>r.map((x,j)=>j===i?{...x,pwAdd:+e.target.value}:x))} style={{...ci(75),textAlign:"right"}}/></td>
                    <td style={{padding:"6px 10px"}}><Toggle value={row.aisc} onChange={v=>setErectorList(r=>r.map((x,j)=>j===i?{...x,aisc:v}:x))}/></td>
                    <td style={{padding:"6px 10px"}}><Toggle value={row.inHouse} onChange={v=>setErectorList(r=>r.map((x,j)=>j===i?{...x,inHouse:v}:x))}/></td>
                    <td style={{padding:"6px 10px"}}><input value={row.notes} onChange={e=>setErectorList(r=>r.map((x,j)=>j===i?{...x,notes:e.target.value}:x))} style={ci(200)}/></td>
                    <td style={{padding:"6px 10px"}}>
                      <button onClick={()=>setErectorList(r=>r.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:16}}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Btn onClick={()=>setErectorList(r=>[...r,{name:"New Erector",rate:4000,mob:3000,pwAdd:1500,aisc:false,inHouse:false,notes:""}])}>
            + Add Erector
          </Btn>
        </div>
      )}

      {section === "galv" && (
        <div>
          <div style={{overflowX:"auto",marginBottom:14}}>
            <table>
              <thead>
                <tr style={{color:"#6b7280",fontSize:9,letterSpacing:1.5,textTransform:"uppercase"}}>
                  {["Company","$/Lb","Lead Days","Notes",""].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"8px 10px",borderBottom:"1px solid #1e2532"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {galvanizers.map((row,i) => (
                  <tr key={i} style={{background:i%2===0?"#13171f":"transparent"}}>
                    <td style={{padding:"6px 10px"}}><input value={row.name} onChange={e=>setGalvanizers(r=>r.map((x,j)=>j===i?{...x,name:e.target.value}:x))} style={ci(180)}/></td>
                    <td style={{padding:"6px 10px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <span style={{color:"#6b7280",fontSize:12}}>$</span>
                        <input type="number" value={row.pplb} onChange={e=>setGalvanizers(r=>r.map((x,j)=>j===i?{...x,pplb:+e.target.value}:x))} style={{...ci(70),textAlign:"right"}}/>
                        <span style={{fontSize:10,color:"#6b7280"}}>/lb</span>
                      </div>
                    </td>
                    <td style={{padding:"6px 10px"}}><input type="number" value={row.leadDays} onChange={e=>setGalvanizers(r=>r.map((x,j)=>j===i?{...x,leadDays:+e.target.value}:x))} style={ci(60)}/></td>
                    <td style={{padding:"6px 10px"}}><input value={row.notes} onChange={e=>setGalvanizers(r=>r.map((x,j)=>j===i?{...x,notes:e.target.value}:x))} style={ci(260)}/></td>
                    <td style={{padding:"6px 10px"}}>
                      <button onClick={()=>setGalvanizers(r=>r.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:16}}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Btn onClick={()=>setGalvanizers(r=>[...r,{name:"New Galvanizer",pplb:0.45,leadDays:5,notes:""}])}>
            + Add Galvanizer
          </Btn>
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]           = useState("takeoff");
  const [takeoffTab, setTakeoffTab] = useState("structural"); // sub-tab within takeoff
  const [jobNum, setJobNum]     = useState("J-001");
  const [jobName, setJobName]   = useState("Sample Structural Package");
  const [companyName, setCompanyName] = useState("R&R Fabrication, Inc.");
  const [quoteNotes, setQuoteNotes]   = useState("");

  // NEW: two separate takeoff lists
  const [structRows, setStructRows] = useState([newStructRow()]);
  const [miscRows,   setMiscRows]   = useState([newMiscRow()]);

  const [suppliers,   setSuppliers]   = useState(DEFAULT_SUPPLIERS);
  const [erectorList, setErectorList] = useState(DEFAULT_ERECTOR_LIST);
  const [galvanizers, setGalvanizers] = useState(DEFAULT_GALVANIZERS);
  const [jobErectors, setJobErectors] = useState(DEFAULT_JOB_ERECTORS);
  const [requiresAISC, setRequiresAISC] = useState(false);

  const [supplier, setSupplier] = useState("Metals USA");
  const [taxPct,   setTaxPct]   = useState(0);

  const [laborRates, setLaborRates] = useState({structural:95, misc:90, stainless:110});
  const [shopHours,  setShopHours]  = useState({structural:280, misc:40, stainless:0});
  const [monthlyOvhd, setMonthlyOvhd] = useState(70000);
  const [monthlyHrs,  setMonthlyHrs]  = useState(1400);

  const [isPW,    setIsPW]    = useState(false);
  const [pwAdmin, setPwAdmin] = useState(1200);

  const [paintType, setPaintType] = useState("primer");
  const [pgal, setPgal] = useState(20);
  const [ppg,  setPpg]  = useState(48);
  const [tgal, setTgal] = useState(5);
  const [tpg,  setTpg]  = useState(52);
  const [isGalv, setIsGalv] = useState(false);
  const [galvAmt, setGalvAmt] = useState(0);

  const [bolts,    setBolts]    = useState(1200);
  const [freightC, setFreightC] = useState(2400);
  const [detail,   setDetail]   = useState(0);
  const [inspect,  setInspect]  = useState(0);
  const [miscCost, setMiscCost] = useState(500);
  const [ovhd, setOvhd] = useState(18);
  const [marg, setMarg] = useState(22);

  const burdenRate = monthlyHrs > 0 ? monthlyOvhd / monthlyHrs : 0;
  const availableErectors = requiresAISC ? erectorList.filter(e => e.aisc) : erectorList;

  // Default ¢/lb from active supplier (average of all ppl entries × 100)
  const defaultCf = useMemo(() => {
    const items = suppliers[supplier] || [];
    if (!items.length) return "";
    const avg = items.reduce((a,r)=>a+r.ppl,0) / items.length;
    return (avg * 100).toFixed(2);
  }, [supplier, suppliers]);

  const calc = () => {
    // Compute all rows from new takeoff structure
    const allRows = [];
    const tonsByType = {structural:0, misc:0, stainless:0};
    let matCost = 0;

    structRows.forEach(r => {
      const totalLbs = rowTotalLbs(r);
      const tons = totalLbs / 2000;
      const cf = parseFloat(r.costFactor) || 0;
      const cost = (cf * totalLbs) / 100;
      matCost += cost;
      tonsByType.structural += tons;
      allRows.push({...r, totalLbs, tons, cost, displayType:"structural"});
    });

    miscRows.forEach(r => {
      const totalLbs = rowTotalLbs(r);
      const tons = totalLbs / 2000;
      const cf = parseFloat(r.costFactor) || 0;
      const cost = (cf * totalLbs) / 100;
      matCost += cost;
      const t = rowType(r);
      if (tonsByType[t] !== undefined) tonsByType[t] += tons;
      allRows.push({...r, totalLbs, tons, cost, displayType:t});
    });

    const totalTons = Object.values(tonsByType).reduce((a,b)=>a+b,0);
    const taxCost = matCost * (taxPct / 100);

    let totalLabor = 0, totalBurden = 0;
    const laborByType = {};
    WORK_TYPES.forEach(({id}) => {
      const effRate = laborRates[id] || 0;
      const hrs = shopHours[id] || 0;
      const lab = hrs * effRate;
      const burden = hrs * burdenRate;
      laborByType[id] = {hrs, effRate, lab, burden};
      totalLabor  += lab;
      totalBurden += burden;
    });

    let totalErection = 0;
    const scopeMap = {Structural:"structural", "Misc Metals":"misc", Stainless:"stainless"};
    const erectDetail = jobErectors.map(je => {
      const master = erectorList.find(e => e.name === je.name);
      if (!master) return {...je, cost:0, effRate:0, tons:0, master:null};
      const effRate = master.rate + (isPW ? master.pwAdd : 0);
      let tons = je.useManualTons ? je.manualTons : totalTons;
      if (!je.useManualTons && je.scope !== "Other" && je.scope !== "Punch List") {
        const key = scopeMap[je.scope];
        if (key) tons = tonsByType[key] || totalTons;
      }
      const cost = effRate * tons + (master.mob || 0);
      totalErection += cost;
      return {...je, cost, effRate, tons, master};
    });

    const paintMat  = paintType !== "none" ? pgal * ppg : 0;
    const touchCost = tgal * tpg;
    const galvCost  = isGalv ? galvAmt : 0;
    const pwAdmCost = isPW ? pwAdmin : 0;

    const direct = matCost + taxCost + totalLabor + totalBurden + totalErection +
                   paintMat + touchCost + galvCost +
                   bolts + freightC + detail + inspect + miscCost + pwAdmCost;
    const ovhdCost = direct * (ovhd / 100);
    const sub = direct + ovhdCost;
    const margCost = sub * (marg / 100);
    const total = sub + margCost;

    return {
      allRows, matCost, taxCost, totalLabor, totalBurden, laborByType,
      totalErection, erectDetail, paintMat, touchCost, galvCost, pwAdmCost,
      bolts, freightC, detail, inspect, miscCost,
      direct, ovhdCost, sub, margCost, total, totalTons, tonsByType,
    };
  };

  const est = useMemo(() => calc(), [
    structRows, miscRows, erectorList, jobErectors, isPW, pwAdmin, taxPct,
    laborRates, shopHours, monthlyOvhd, monthlyHrs, paintType, pgal, ppg, tgal, tpg,
    isGalv, galvAmt, bolts, freightC, detail, inspect, miscCost, ovhd, marg,
  ]);

  const addJobErector = () => {
    const first = availableErectors[0]; if (!first) return;
    setJobErectors(e => [...e, {id:Date.now(), name:first.name, scope:"Structural", useManualTons:false, manualTons:0}]);
  };

  const doPrint = () => {
    renderPrintView(est, jobNum, jobName, supplier, isPW, requiresAISC, taxPct, isGalv, detail, inspect, miscCost, ovhd, marg, burdenRate, companyName, quoteNotes);
    setTimeout(() => window.print(), 100);
  };

  const TABS = [
    {id:"takeoff",    label:"Takeoff"},
    {id:"materials",  label:"Materials"},
    {id:"labor",      label:"Labor & Burden"},
    {id:"erection",   label:"Erection"},
    {id:"finishes",   label:"Paint & Galv"},
    {id:"other",      label:"Other Costs"},
    {id:"pw",         label: isPW ? "Prev. Wage ●" : "Prev. Wage"},
    {id:"pricelists", label:"Price Lists"},
    {id:"quote",      label:"Quote"},
  ];

  return (
    <div style={{fontFamily:"'IBM Plex Mono',monospace",background:"#0e1117",minHeight:"100vh",color:"#c8cdd6"}}>

      {/* HEADER */}
      <div style={{background:"#13171f",borderBottom:"2px solid #e85c26",padding:"14px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:10,color:"#e85c26",letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>SteelQuote Pro</div>
          <div style={{fontSize:18,color:"#edf0f4",fontWeight:700}}>Fabrication Estimating System</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          {isPW && <Badge color="#7c3aed" text="PREVAILING WAGE"/>}
          {requiresAISC && <Badge color="#f59e0b" text="AISC REQUIRED"/>}
          <button onClick={doPrint} style={{background:"#e85c26",border:"none",borderRadius:6,color:"white",padding:"9px 18px",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>
            ⎙ Print / Download
          </button>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Job #</div>
            <input value={jobNum} onChange={e=>setJobNum(e.target.value)}
              style={{background:"transparent",border:"1px solid #2d3340",borderRadius:4,color:"#e85c26",padding:"4px 10px",fontSize:14,fontWeight:700,width:90,fontFamily:"inherit",textAlign:"right"}}/>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Job Name</div>
            <input value={jobName} onChange={e=>setJobName(e.target.value)}
              style={{background:"transparent",border:"1px solid #2d3340",borderRadius:4,color:"#edf0f4",padding:"4px 10px",fontSize:13,width:220,fontFamily:"inherit",textAlign:"right"}}/>
          </div>
        </div>
      </div>

      {/* SUMMARY BAR */}
      <div style={{background:"#161b24",borderBottom:"1px solid #1e2532",padding:"10px 28px",display:"flex",gap:22,alignItems:"center",flexWrap:"wrap"}}>
        {WORK_TYPES.map(({id,label,color}) => (
          <div key={id}>
            <div style={{fontSize:9,color,letterSpacing:1.5,textTransform:"uppercase",marginBottom:2}}>{label}</div>
            <div style={{fontSize:13,color:"#c8cdd6",fontWeight:600}}>{fmtN(est.tonsByType[id],2)} T</div>
          </div>
        ))}
        <div style={{width:1,height:28,background:"#2d3340"}}/>
        {[["Material",fmt(est.matCost)],["Labor",fmt(est.totalLabor)],["Burden",fmt(est.totalBurden)],["Erection",fmt(est.totalErection)]].map(([l,v]) => (
          <div key={l}>
            <div style={{fontSize:9,color:"#6b7280",letterSpacing:1.5,textTransform:"uppercase",marginBottom:2}}>{l}</div>
            <div style={{fontSize:13,color:"#c8cdd6",fontWeight:600}}>{v}</div>
          </div>
        ))}
        <div style={{marginLeft:"auto",textAlign:"right"}}>
          <div style={{fontSize:9,color:"#e85c26",letterSpacing:1.5,textTransform:"uppercase",marginBottom:2}}>Total Quote</div>
          <div style={{fontSize:24,color:"#edf0f4",fontWeight:800}}>{fmt(est.total)}</div>
        </div>
      </div>

      {/* MAIN TABS */}
      <div style={{display:"flex",borderBottom:"1px solid #1e2532",padding:"0 28px",background:"#0e1117",overflowX:"auto"}}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:"none",border:"none",cursor:"pointer",padding:"10px 14px",
            fontSize:10,letterSpacing:2,textTransform:"uppercase",whiteSpace:"nowrap",
            color:tab===t.id?"#e85c26":"#6b7280",
            borderBottom:tab===t.id?"2px solid #e85c26":"2px solid transparent",
            fontFamily:"inherit",marginBottom:-1,
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{padding:28}}>

        {/* TAKEOFF — two sub-tabs */}
        {tab === "takeoff" && (
          <div>
            <SH title="Material Takeoff" sub="Structural and Misc Metals on separate sheets. Each row auto-calculates weight and material cost."/>

            {/* Sub-tab selector */}
            <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:"1px solid #1e2532"}}>
              {[
                {id:"structural", label:"Structural Steel", color:"#e85c26"},
                {id:"misc",       label:"Misc Metals",      color:"#3b82f6"},
              ].map(s=>(
                <button key={s.id} onClick={()=>setTakeoffTab(s.id)} style={{
                  background:"none",border:"none",cursor:"pointer",padding:"8px 20px",
                  fontSize:10,letterSpacing:2,textTransform:"uppercase",
                  color:takeoffTab===s.id?s.color:"#6b7280",
                  borderBottom:takeoffTab===s.id?`2px solid ${s.color}`:"2px solid transparent",
                  fontFamily:"inherit",marginBottom:-1,
                }}>
                  {s.label}
                  <span style={{marginLeft:8,fontSize:9,color:"#4b5563"}}>
                    {s.id==="structural"
                      ? fmtN(est.tonsByType.structural,2)+"T"
                      : fmtN(est.tonsByType.misc+est.tonsByType.stainless,2)+"T"}
                  </span>
                </button>
              ))}
            </div>

            {takeoffTab === "structural" && (
              <StructuralTakeoff rows={structRows} setRows={setStructRows} defaultCf={defaultCf}/>
            )}
            {takeoffTab === "misc" && (
              <MiscTakeoff rows={miscRows} setRows={setMiscRows} defaultCf={defaultCf}/>
            )}
          </div>
        )}

        {/* MATERIALS */}
        {tab === "materials" && (
          <div>
            <SH title="Material Costs" sub="Material cost is driven by ¢/lb set on each takeoff row. Select supplier to set your default rate."/>
            <div style={{display:"flex",gap:20,marginBottom:20,alignItems:"flex-end",flexWrap:"wrap"}}>
              <div>
                <Lbl>Active Supplier (sets default ¢/lb on new rows)</Lbl>
                <select value={supplier} onChange={e=>setSupplier(e.target.value)} style={{...sel,marginTop:6,display:"block"}}>
                  {Object.keys(suppliers).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Lbl>Sales Tax (%)</Lbl>
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
                  <input type="number" value={taxPct} onChange={e=>setTaxPct(+e.target.value)} style={ci(60)}/>
                  <span style={{fontSize:11,color:"#6b7280"}}>= {fmt(est.taxCost)}</span>
                </div>
              </div>
            </div>

            {/* Structural rows */}
            {structRows.some(r=>rowTotalLbs(r)>0) && (
              <div style={{marginBottom:20}}>
                <div style={{fontSize:9,color:"#e85c26",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Structural Steel</div>
                <table>
                  <thead>
                    <tr style={{color:"#6b7280",fontSize:9,letterSpacing:1.5,textTransform:"uppercase"}}>
                      {["Shape","Total Lbs","Tons","¢/lb","Cost"].map(h=>(
                        <th key={h} style={{textAlign:"left",padding:"8px 10px",borderBottom:"1px solid #1e2532"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {structRows.filter(r=>rowTotalLbs(r)>0).map((r,i)=>{
                      const lbs=rowTotalLbs(r), cf=parseFloat(r.costFactor)||0, cost=(cf*lbs)/100;
                      return (
                        <tr key={r.id} style={{background:i%2===0?"#13171f":"transparent"}}>
                          <td style={{padding:"7px 10px",color:"#edf0f4",fontWeight:600}}>{r.shape||"—"}</td>
                          <td style={{padding:"7px 10px"}}>{Math.round(lbs).toLocaleString()}</td>
                          <td style={{padding:"7px 10px"}}>{fmtN(lbs/2000,3)} T</td>
                          <td style={{padding:"7px 10px",color:cf?"#c8cdd6":"#ef4444"}}>{cf?cf+"¢":"NOT SET"}</td>
                          <td style={{padding:"7px 10px",color:"#e85c26",fontWeight:600}}>{fmt(cost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Misc rows */}
            {miscRows.some(r=>rowTotalLbs(r)>0) && (
              <div style={{marginBottom:20}}>
                <div style={{fontSize:9,color:"#3b82f6",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Misc Metals</div>
                <table>
                  <thead>
                    <tr style={{color:"#6b7280",fontSize:9,letterSpacing:1.5,textTransform:"uppercase"}}>
                      {["Type","Shape/Desc","Total Lbs","Tons","¢/lb","Cost"].map(h=>(
                        <th key={h} style={{textAlign:"left",padding:"8px 10px",borderBottom:"1px solid #1e2532"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {miscRows.filter(r=>rowTotalLbs(r)>0).map((r,i)=>{
                      const lbs=rowTotalLbs(r), cf=parseFloat(r.costFactor)||0, cost=(cf*lbs)/100;
                      return (
                        <tr key={r.id} style={{background:i%2===0?"#13171f":"transparent"}}>
                          <td style={{padding:"7px 10px",fontSize:9,color:"#3b82f6",textTransform:"uppercase"}}>{r.itemType}</td>
                          <td style={{padding:"7px 10px",color:"#edf0f4",fontWeight:600}}>{r.shape||"—"}</td>
                          <td style={{padding:"7px 10px"}}>{Math.round(lbs).toLocaleString()}</td>
                          <td style={{padding:"7px 10px"}}>{fmtN(lbs/2000,3)} T</td>
                          <td style={{padding:"7px 10px",color:cf?"#c8cdd6":"#ef4444"}}>{cf?cf+"¢":"NOT SET"}</td>
                          <td style={{padding:"7px 10px",color:"#3b82f6",fontWeight:600}}>{fmt(cost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{background:"#13171f",border:"1px solid #1e2532",borderRadius:8,padding:16,maxWidth:360}}>
              <R label="Structural Material" value={fmt(est.allRows.filter(r=>r.displayType==="structural").reduce((a,r)=>a+r.cost,0))}/>
              <R label="Misc Metals Material" value={fmt(est.allRows.filter(r=>r.displayType==="misc").reduce((a,r)=>a+r.cost,0))}/>
              {est.allRows.some(r=>r.displayType==="stainless") && <R label="Stainless Material" value={fmt(est.allRows.filter(r=>r.displayType==="stainless").reduce((a,r)=>a+r.cost,0))}/>}
              {taxPct>0 && <R label={`Sales Tax (${taxPct}%)`} value={fmt(est.taxCost)}/>}
              <R label="Total Material" value={fmt(est.matCost + est.taxCost)} hi/>
            </div>
          </div>
        )}

        {/* LABOR */}
        {tab === "labor" && (
          <div>
            <SH title="Labor & Shop Burden" sub="Shop labor rates are always your base rates. Prevailing wage does not apply to shop workers — only to field erectors."/>
            <div style={{background:"#13171f",border:"1px solid #1e2532",borderRadius:10,padding:20,maxWidth:640,marginBottom:24}}>
              <div style={{fontSize:10,color:"#e85c26",letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>Shop Burden Rate Calculator</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                <div>
                  <Lbl>Monthly Overhead ($)</Lbl>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}>
                    <span style={{color:"#6b7280"}}>$</span>
                    <input type="number" value={monthlyOvhd} onChange={e=>setMonthlyOvhd(+e.target.value)} style={{...ci(110),fontSize:14,fontWeight:700}}/>
                  </div>
                  <div style={{fontSize:9,color:"#4b5563",marginTop:4}}>Rent, utilities, gas, insurance, vehicles, equipment</div>
                </div>
                <div>
                  <Lbl>Monthly Billable Hours</Lbl>
                  <input type="number" value={monthlyHrs} onChange={e=>setMonthlyHrs(+e.target.value)} style={{...ci(110),fontSize:14,fontWeight:700,marginTop:6,display:"block"}}/>
                  <div style={{fontSize:9,color:"#4b5563",marginTop:4}}>8 workers × 173 hrs ≈ 1,384/mo</div>
                </div>
                <div style={{background:"#0e1117",borderRadius:8,padding:14,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",border:"1px solid #e85c2633"}}>
                  <div style={{fontSize:9,color:"#e85c26",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Burden Rate</div>
                  <div style={{fontSize:28,color:"#e85c26",fontWeight:800}}>${fmtN(burdenRate,2)}</div>
                  <div style={{fontSize:10,color:"#6b7280"}}>per shop hour</div>
                </div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:20}}>
              {WORK_TYPES.map(({id,label,color}) => {
                const lb = est.laborByType[id] || {};
                return (
                  <div key={id} style={{background:"#13171f",border:`1px solid ${color}33`,borderRadius:10,padding:18}}>
                    <div style={{fontSize:10,color,letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>{label}</div>
                    <div style={{marginBottom:12}}>
                      <Lbl>Labor Rate ($/hr)</Lbl>
                      <input type="number" value={laborRates[id]||0} onChange={e=>setLaborRates(r=>({...r,[id]:+e.target.value}))}
                        style={{...ci(90),marginTop:6,display:"block",fontSize:16,fontWeight:700}}/>
                    </div>
                    <div style={{marginBottom:14}}>
                      <Lbl>Shop Hours</Lbl>
                      <input type="number" value={shopHours[id]||0} onChange={e=>setShopHours(h=>({...h,[id]:+e.target.value}))}
                        style={{...ci(90),marginTop:6,display:"block",fontSize:16,fontWeight:700}}/>
                    </div>
                    <div style={{borderTop:`1px solid ${color}33`,paddingTop:12}}>
                      <R label="Direct Labor" value={fmt(lb.lab||0)}/>
                      <R label={`Burden ($${fmtN(burdenRate,2)}/hr)`} value={fmt(lb.burden||0)}/>
                      <R label="Total Shop Cost" value={fmt((lb.lab||0)+(lb.burden||0))} hi/>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{background:"#13171f",border:"1px solid #1e2532",borderRadius:8,padding:18,maxWidth:440}}>
              <R label="Total Direct Labor" value={fmt(est.totalLabor)}/>
              <R label="Total Shop Burden" value={fmt(est.totalBurden)}/>
              <R label="Combined Shop Cost" value={fmt(est.totalLabor+est.totalBurden)} hi/>
              <div style={{paddingTop:10,marginTop:6,borderTop:"1px solid #1e2532"}}>
                <R label="Blended $/Ton (fab)" value={est.totalTons>0 ? fmtD((est.totalLabor+est.totalBurden)/est.totalTons)+"/T" : "—"}/>
              </div>
            </div>
          </div>
        )}

        {/* ERECTION */}
        {tab === "erection" && (
          <div>
            <SH title="Erection" sub="Add one erector per scope. Prevailing wage adder applies here — erectors are field labor."/>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24,background:"#13171f",border:"1px solid #1e2532",borderRadius:8,padding:16,maxWidth:560,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Toggle value={requiresAISC} onChange={setRequiresAISC}/>
                <div>
                  <div style={{fontSize:12,color:requiresAISC?"#f59e0b":"#6b7280",fontWeight:600}}>AISC Certified Erectors Required</div>
                  <div style={{fontSize:10,color:"#4b5563",marginTop:2}}>When on, only AISC-certified crews appear in dropdowns</div>
                </div>
              </div>
              {requiresAISC && <div style={{marginLeft:"auto",fontSize:10,color:"#f59e0b"}}>{availableErectors.length} AISC crew{availableErectors.length!==1?"s":""} available</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:16}}>
              {est.erectDetail.map((je) => {
                const master = je.master;
                return (
                  <div key={je.id} style={{background:"#13171f",border:"1px solid #1e2532",borderRadius:10,padding:20}}>
                    <div style={{display:"flex",gap:16,alignItems:"flex-start",flexWrap:"wrap"}}>
                      <div style={{flex:"0 0 200px"}}>
                        <Lbl>Erector</Lbl>
                        <select value={je.name}
                          onChange={e=>setJobErectors(ers=>ers.map(x=>x.id===je.id?{...x,name:e.target.value}:x))}
                          style={{...sel,display:"block",marginTop:6,width:"100%"}}>
                          {availableErectors.map(e => <option key={e.name} value={e.name}>{e.name}{e.inHouse?" (In-House)":""}</option>)}
                        </select>
                        {master && <div style={{marginTop:6,display:"flex",gap:6,flexWrap:"wrap"}}>
                          {master.aisc && <Chip color="#f59e0b" text="AISC"/>}
                          {master.inHouse && <Chip color="#10b981" text="In-House"/>}
                        </div>}
                      </div>
                      <div style={{flex:"0 0 160px"}}>
                        <Lbl>Scope</Lbl>
                        <select value={je.scope}
                          onChange={e=>setJobErectors(ers=>ers.map(x=>x.id===je.id?{...x,scope:e.target.value}:x))}
                          style={{...sel,display:"block",marginTop:6,width:"100%"}}>
                          {ERECTOR_SCOPES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div style={{flex:"0 0 220px"}}>
                        <Lbl>Tons</Lbl>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
                          <Toggle value={je.useManualTons} onChange={v=>setJobErectors(ers=>ers.map(x=>x.id===je.id?{...x,useManualTons:v}:x))}/>
                          <span style={{fontSize:10,color:"#6b7280"}}>{je.useManualTons?"Manual":"Auto from scope"}</span>
                        </div>
                        {je.useManualTons
                          ? <input type="number" value={je.manualTons} onChange={e=>setJobErectors(ers=>ers.map(x=>x.id===je.id?{...x,manualTons:+e.target.value}:x))} style={{...ci(90),marginTop:8,display:"block"}}/>
                          : <div style={{fontSize:11,color:"#e85c26",marginTop:6,fontWeight:600}}>{fmtN(je.tons,2)} T auto</div>
                        }
                      </div>
                      <div style={{flex:1,minWidth:160,background:"#0e1117",borderRadius:8,padding:14}}>
                        {master && <>
                          <R label="Base Rate" value={`$${master.rate.toLocaleString()}/ton`}/>
                          {isPW && <R label="PW Adder" value={`+$${master.pwAdd.toLocaleString()}/ton`}/>}
                          <R label="Effective Rate" value={`$${je.effRate.toLocaleString()}/ton`}/>
                          <R label="Tons" value={`${fmtN(je.tons,2)} T`}/>
                          <R label="Mob" value={fmt(master.mob)}/>
                          <R label="Subtotal" value={fmt(je.cost)} hi/>
                        </>}
                      </div>
                      <button onClick={()=>setJobErectors(ers=>ers.filter(x=>x.id!==je.id))}
                        style={{background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:18,padding:4,alignSelf:"flex-start"}}>×</button>
                    </div>
                    {master?.notes && <div style={{marginTop:10,fontSize:10,color:"#4b5563"}}>{master.notes}</div>}
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:12,alignItems:"center"}}>
              <Btn onClick={addJobErector}>+ Add Erector to Job</Btn>
              <div style={{marginLeft:"auto",background:"#1a2030",border:"1px solid #2d3340",borderRadius:6,padding:"8px 16px",fontSize:12}}>
                Total Erection: <strong style={{color:"#e85c26"}}>{fmt(est.totalErection)}</strong>
              </div>
            </div>
          </div>
        )}

        {/* PAINT & GALV */}
        {tab === "finishes" && (
          <div>
            <SH title="Paint & Galvanizing" sub="Paint = material cost only. Application labor is in shop hours. Galvanizing is a sendout."/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
              <div>
                <SecLbl>Shop Paint</SecLbl>
                <div style={{marginBottom:14}}>
                  <Lbl>Paint Type</Lbl>
                  <select value={paintType} onChange={e=>setPaintType(e.target.value)} style={{...sel,display:"block",marginTop:6}}>
                    <option value="primer">Primer Only (1-coat)</option>
                    <option value="two-coat">Two-Coat System</option>
                    <option value="none">No Paint (bare / galvanized)</option>
                  </select>
                </div>
                {paintType !== "none" && (
                  <div style={{background:"#13171f",border:"1px solid #1e2532",borderRadius:8,padding:16,marginBottom:14}}>
                    <Lbl>Shop Paint Material</Lbl>
                    <div style={{display:"flex",gap:12,alignItems:"flex-end",marginTop:8}}>
                      <div><div style={{fontSize:9,color:"#6b7280",marginBottom:4}}>Gallons</div><input type="number" value={pgal} onChange={e=>setPgal(+e.target.value)} style={ci(70)}/></div>
                      <div><div style={{fontSize:9,color:"#6b7280",marginBottom:4}}>$/Gallon</div><input type="number" value={ppg} onChange={e=>setPpg(+e.target.value)} style={ci(70)}/></div>
                      <div style={{fontSize:14,color:"#e85c26",fontWeight:700,paddingBottom:4}}>= {fmt(est.paintMat)}</div>
                    </div>
                  </div>
                )}
                <div style={{background:"#13171f",border:"1px solid #1e2532",borderRadius:8,padding:16}}>
                  <Lbl>Field Touch-Up Paint</Lbl>
                  <div style={{display:"flex",gap:12,alignItems:"flex-end",marginTop:8}}>
                    <div><div style={{fontSize:9,color:"#6b7280",marginBottom:4}}>Gallons</div><input type="number" value={tgal} onChange={e=>setTgal(+e.target.value)} style={ci(70)}/></div>
                    <div><div style={{fontSize:9,color:"#6b7280",marginBottom:4}}>$/Gallon</div><input type="number" value={tpg} onChange={e=>setTpg(+e.target.value)} style={ci(70)}/></div>
                    <div style={{fontSize:14,color:"#e85c26",fontWeight:700,paddingBottom:4}}>= {fmt(est.touchCost)}</div>
                  </div>
                  <Note tight>Always include field touch-up. Easy to forget, always eats margin.</Note>
                </div>
              </div>
              <div>
                <SecLbl>Galvanizing (Sendout)</SecLbl>
                <div style={{background:"#13171f",border:"1px solid #1e2532",borderRadius:8,padding:16,marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                    <Toggle value={isGalv} onChange={setIsGalv}/>
                    <span style={{fontSize:12,color:isGalv?"#edf0f4":"#6b7280"}}>This job requires galvanizing</span>
                  </div>
                  {isGalv ? (
                    <div>
                      <Lbl>Galvanizer Quote (Lump Sum)</Lbl>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,marginBottom:10}}>
                        <span style={{color:"#6b7280"}}>$</span>
                        <input type="number" value={galvAmt} onChange={e=>setGalvAmt(+e.target.value)}
                          style={{background:"#0e1117",border:"1px solid #2d3340",borderRadius:4,color:"#edf0f4",padding:"8px 10px",fontSize:16,fontWeight:700,width:140,fontFamily:"inherit"}}/>
                      </div>
                      <div style={{color:"#e85c26",fontWeight:700}}>{fmt(galvAmt)}</div>
                      <Note tight>Typical: $0.35–0.60/lb. Set paint to "No Paint" if galvanizing.</Note>
                    </div>
                  ) : <div style={{fontSize:11,color:"#4b5563"}}>Toggle on when galvanizing is required.</div>}
                </div>
                <div style={{background:"#13171f",border:"1px solid #1e2532",borderRadius:8,padding:16}}>
                  <R label="Shop Paint" value={fmt(est.paintMat)}/>
                  <R label="Touch-Up" value={fmt(est.touchCost)}/>
                  <R label="Galvanizing" value={isGalv ? fmt(est.galvCost) : "N/A"}/>
                  <R label="Total Finishes" value={fmt(est.paintMat+est.touchCost+est.galvCost)} hi/>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OTHER COSTS */}
        {tab === "other" && (
          <div>
            <SH title="Other Direct Costs" sub="Hardware, freight, detailing, inspection."/>
            <div style={{background:"#13171f",border:"1px solid #1e2532",borderRadius:8,padding:20,maxWidth:500}}>
              {[
                ["Bolts, Anchor Rods & Hardware", bolts, setBolts],
                ["Freight / Delivery to Site", freightC, setFreightC],
                ["Steel Detailing / Shop Drawings", detail, setDetail],
                ["Inspection & Testing", inspect, setInspect],
                ["Miscellaneous", miscCost, setMiscCost],
              ].map(([label,val,setter]) => (
                <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #1a1f2b"}}>
                  <span style={{fontSize:12,color:"#9ca3af"}}>{label}</span>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{color:"#6b7280",fontSize:12}}>$</span>
                    <input type="number" value={val} onChange={e=>setter(+e.target.value)}
                      style={{background:"#0e1117",border:"1px solid #2d3340",borderRadius:4,color:"#edf0f4",padding:"5px 8px",fontSize:13,width:100,fontFamily:"inherit",textAlign:"right"}}/>
                  </div>
                </div>
              ))}
              <div style={{paddingTop:12,marginTop:4}}>
                <R label="Total Other Costs" value={fmt(bolts+freightC+detail+inspect+miscCost)} hi/>
              </div>
            </div>
            <Note>Bolts and hardware are almost always underestimated. Budget $800–2,000 minimum on structural packages.</Note>
          </div>
        )}

        {/* PREVAILING WAGE */}
        {tab === "pw" && (
          <div>
            <SH title="Prevailing Wage" sub="Field labor only — erectors and road crew. Your shop workers are NOT affected."/>
            <div style={{background:"#13171f",border:"1px solid #7c3aed44",borderRadius:8,padding:20,maxWidth:600,marginBottom:24}}>
              <div style={{fontSize:10,color:"#a78bfa",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>How Prevailing Wage Works</div>
              <div style={{fontSize:12,color:"#9ca3af",lineHeight:1.9}}>
                <strong style={{color:"#edf0f4"}}>What it is:</strong> Davis-Bacon Act requires you pay field workers (ironworkers, erectors) at least the government-set "prevailing wage" for that trade in that county. It's a minimum floor, not a maximum.<br/><br/>
                <strong style={{color:"#edf0f4"}}>What it affects:</strong> Erector rates only. Your shop guys fabricate steel in your shop — they are not covered by prevailing wage requirements.<br/><br/>
                <strong style={{color:"#edf0f4"}}>The rate adder:</strong> The difference between what your erector normally charges and what the PW rate requires. Set it per erector in Price Lists.<br/><br/>
                <strong style={{color:"#edf0f4"}}>Certified payroll:</strong> On PW jobs you must file weekly certified payroll reports proving compliance. Budget time and admin cost for this.
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24,background:"#13171f",border:"1px solid #1e2532",borderRadius:8,padding:18,maxWidth:500}}>
              <Toggle value={isPW} onChange={setIsPW} large/>
              <div>
                <div style={{fontSize:13,color:isPW?"#edf0f4":"#6b7280",fontWeight:600,marginBottom:3}}>{isPW?"This is a Prevailing Wage job":"Standard (non-prevailing wage)"}</div>
                <div style={{fontSize:11,color:"#6b7280"}}>Toggle on for public, government, school, or bond-funded projects</div>
              </div>
            </div>
            {isPW && (
              <div style={{background:"#13171f",border:"1px solid #7c3aed44",borderRadius:8,padding:18,maxWidth:500}}>
                <div style={{fontSize:10,color:"#a78bfa",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>Certified Payroll Admin Cost</div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                  <span style={{color:"#6b7280"}}>$</span>
                  <input type="number" value={pwAdmin} onChange={e=>setPwAdmin(+e.target.value)}
                    style={{background:"#0e1117",border:"1px solid #2d3340",borderRadius:4,color:"#edf0f4",padding:"6px 10px",fontSize:15,fontWeight:700,width:110,fontFamily:"inherit"}}/>
                </div>
                <Note tight>Budget $1,000–3,000 depending on job duration and crew size. Look up county/trade rates at dol.gov/agencies/whd/wage-rates — set PW adder per erector in Price Lists tab.</Note>
              </div>
            )}
          </div>
        )}

        {/* PRICE LISTS */}
        {tab === "pricelists" && (
          <PriceListsTab
            suppliers={suppliers} setSuppliers={setSuppliers}
            erectorList={erectorList} setErectorList={setErectorList}
            galvanizers={galvanizers} setGalvanizers={setGalvanizers}
          />
        )}

        {/* QUOTE */}
        {tab === "quote" && (
          <div>
            <SH title="Quote Summary" sub="Full rollup. Click Print / Download to generate a client-ready quote."/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20,maxWidth:700}}>
              <div>
                <Lbl>Company Name (for printed quote)</Lbl>
                <input value={companyName} onChange={e=>setCompanyName(e.target.value)} style={{...ci(300),marginTop:6,display:"block",padding:"7px 10px"}}/>
              </div>
            </div>
            <div style={{background:"#13171f",border:"1px solid #1e2532",borderRadius:10,padding:28,maxWidth:600}}>
              <div style={{borderBottom:"1px solid #1e2532",paddingBottom:14,marginBottom:16}}>
                <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:6}}>
                  <span style={{fontSize:13,color:"#e85c26",fontWeight:700}}>{jobNum}</span>
                  <span style={{fontSize:15,color:"#edf0f4",fontWeight:700}}>{jobName}</span>
                </div>
                <div style={{fontSize:11,color:"#6b7280",marginBottom:6}}>{supplier} | {fmtN(est.totalTons,2)} total tons</div>
                <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                  {WORK_TYPES.map(({id,label,color}) => (
                    <span key={id} style={{fontSize:10}}><span style={{color}}>{label}: </span><span style={{color:"#9ca3af"}}>{fmtN(est.tonsByType[id],2)}T</span></span>
                  ))}
                  {isPW && <span style={{fontSize:10,color:"#a78bfa"}}>| Prevailing Wage</span>}
                  {requiresAISC && <span style={{fontSize:10,color:"#f59e0b"}}>| AISC Required</span>}
                </div>
              </div>

              <QSec label="Materials">
                <R label="Steel / Metal Material" value={fmt(est.matCost)}/>
                {taxPct>0 && <R label={`Sales Tax (${taxPct}%)`} value={fmt(est.taxCost)}/>}
                <R label="Bolts & Hardware" value={fmt(bolts)}/>
                {est.paintMat>0 && <R label="Paint Material (Shop)" value={fmt(est.paintMat)}/>}
                {est.touchCost>0 && <R label="Touch-Up Paint (Field)" value={fmt(est.touchCost)}/>}
                {isGalv && <R label="Galvanizing (Sendout)" value={fmt(est.galvCost)}/>}
              </QSec>
              <QSec label="Shop Labor & Burden">
                {WORK_TYPES.map(({id,label}) => {
                  const lb = est.laborByType[id]||{};
                  return lb.hrs>0 ? <R key={id} label={`${label} (${lb.hrs}h × $${lb.effRate}/hr)`} value={fmt(lb.lab||0)}/> : null;
                })}
                <R label={`Shop Burden ($${fmtN(burdenRate,2)}/hr)`} value={fmt(est.totalBurden)}/>
              </QSec>
              <QSec label="Erection (Field Labor)">
                {est.erectDetail.map((je,i) => (
                  <R key={i} label={`${je.name} — ${je.scope}${isPW?" [PW]":""}`} value={fmt(je.cost)}/>
                ))}
              </QSec>
              <QSec label="Other">
                <R label="Freight" value={fmt(freightC)}/>
                {detail>0 && <R label="Detailing" value={fmt(detail)}/>}
                {inspect>0 && <R label="Inspection" value={fmt(inspect)}/>}
                {miscCost>0 && <R label="Miscellaneous" value={fmt(miscCost)}/>}
                {isPW && <R label="Certified Payroll Admin" value={fmt(est.pwAdmCost)}/>}
              </QSec>

              <div style={{borderTop:"1px solid #2d3340",paddingTop:12}}>
                <R label="Direct Cost" value={fmt(est.direct)}/>
              </div>
              <div style={{marginTop:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,maxWidth:320}}>
                <div>
                  <Lbl>Overhead %</Lbl>
                  <input type="number" value={ovhd} onChange={e=>setOvhd(+e.target.value)} style={{...ci(80),marginTop:6,display:"block"}}/>
                </div>
                <div>
                  <Lbl>Margin %</Lbl>
                  <input type="number" value={marg} onChange={e=>setMarg(+e.target.value)} style={{...ci(80),marginTop:6,display:"block"}}/>
                </div>
              </div>
              <div style={{borderTop:"1px solid #2d3340",marginTop:14,paddingTop:12}}>
                <R label={`Overhead (${ovhd}%)`} value={fmt(est.ovhdCost)}/>
                <R label={`Margin (${marg}%)`} value={fmt(est.margCost)}/>
              </div>
              <div style={{borderTop:"2px solid #e85c26",marginTop:16,paddingTop:16,display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                <span style={{fontSize:14,color:"#edf0f4",fontWeight:700}}>TOTAL QUOTE</span>
                <span style={{fontSize:26,color:"#e85c26",fontWeight:800}}>{fmt(est.total)}</span>
              </div>
              <div style={{marginTop:5,textAlign:"right",fontSize:11,color:"#6b7280"}}>
                {est.totalTons>0 ? fmtD(est.total/est.totalTons)+"/ton" : ""}
              </div>
            </div>

            <div style={{marginTop:20,maxWidth:600}}>
              <Lbl>Quote Notes (printed on client quote)</Lbl>
              <textarea value={quoteNotes} onChange={e=>setQuoteNotes(e.target.value)}
                placeholder="Quote valid for 30 days. Prices subject to material market conditions at time of order. Excludes open web joists, metal deck, rebar, light gage framing, and concrete."
                style={{...ci(600),marginTop:8,display:"block",minHeight:80,resize:"vertical",padding:"10px",lineHeight:1.6}}/>
            </div>

            <div style={{marginTop:20,display:"flex",gap:12,alignItems:"center"}}>
              <button onClick={doPrint} style={{background:"#e85c26",border:"none",borderRadius:8,color:"white",padding:"12px 24px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>
                ⎙ Print Quote
              </button>
              <button onClick={doPrint} style={{background:"#1a2030",border:"1px solid #2d3340",borderRadius:8,color:"#c8cdd6",padding:"12px 24px",fontSize:12,cursor:"pointer",fontFamily:"inherit",letterSpacing:1,textTransform:"uppercase"}}>
                ↓ Download PDF
              </button>
              <span style={{fontSize:10,color:"#4b5563",alignSelf:"center"}}>PDF: in print dialog, choose "Save as PDF" as destination</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
