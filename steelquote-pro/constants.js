export const ERECTOR_SCOPES = ["Structural","Misc Metals","Stainless","Punch List","Other"];

export const WORK_TYPES = [
  {id:"structural", label:"Structural",   color:"#e85c26"},
  {id:"misc",       label:"Misc Metals",  color:"#3b82f6"},
  {id:"stainless",  label:"Stainless",    color:"#10b981"},
];

export const DEFAULT_ERECTOR_LIST = [
  {name:"Metro Steel Erectors",  rate:4200, mob:3500, pwAdd:1800, aisc:true,  inHouse:false, notes:"Local. Strong on commercial. Min 10T."},
  {name:"Allied Field Services", rate:3850, mob:4200, pwAdd:1600, aisc:true,  inHouse:false, notes:"Regional. Good on tight sites."},
  {name:"Ironwork Solutions",    rate:4600, mob:2800, pwAdd:2100, aisc:true,  inHouse:false, notes:"Premium. Complex/high-rise."},
  {name:"Budget Iron Works",     rate:3400, mob:5000, pwAdd:1400, aisc:false, inHouse:false, notes:"Best on large tonnage jobs."},
  {name:"Road Crew (In-House)",  rate:1800, mob:0,    pwAdd:800,  aisc:false, inHouse:true,  notes:"Own crew. Misc, punch list, small installs."},
];

export const DEFAULT_SUPPLIERS = {
  "Metals USA": [
    {section:"W8X31",      desc:"Wide Flange",          ppl:1.82},
    {section:"W10X33",     desc:"Wide Flange",          ppl:1.86},
    {section:"W10X49",     desc:"Wide Flange",          ppl:2.14},
    {section:"W12X26",     desc:"Wide Flange",          ppl:1.89},
    {section:"W12X50",     desc:"Wide Flange",          ppl:2.12},
    {section:"W12X65",     desc:"Wide Flange",          ppl:2.89},
    {section:"W14X82",     desc:"Wide Flange",          ppl:3.45},
    {section:"W18X35",     desc:"Wide Flange",          ppl:1.88},
    {section:"HSS4X4X1/4", desc:"HSS Square",           ppl:1.12},
    {section:"HSS6X6X3/8", desc:"HSS Square",           ppl:1.98},
    {section:"HSS6X6X1/2", desc:"HSS Square",           ppl:1.95},
    {section:"L4X4X3/8",   desc:"Angle",                ppl:1.06},
    {section:"C8X11.5",    desc:"Channel",              ppl:0.98},
    {section:"PL1/2",      desc:"Plate A36",            ppl:2.15},
    {section:"A36-PLATE",  desc:"Plate A36 (generic)",  ppl:1.95},
    {section:"PIPE3STD",   desc:"Pipe Std",             ppl:1.45},
  ],
  "BMG Metals": [
    {section:"W8X31",      desc:"Wide Flange",          ppl:1.75},
    {section:"W10X33",     desc:"Wide Flange",          ppl:1.79},
    {section:"W10X49",     desc:"Wide Flange",          ppl:2.08},
    {section:"W12X26",     desc:"Wide Flange",          ppl:1.82},
    {section:"W12X50",     desc:"Wide Flange",          ppl:2.06},
    {section:"W12X65",     desc:"Wide Flange",          ppl:2.79},
    {section:"W14X82",     desc:"Wide Flange",          ppl:3.31},
    {section:"W18X35",     desc:"Wide Flange",          ppl:1.81},
    {section:"HSS4X4X1/4", desc:"HSS Square",           ppl:1.08},
    {section:"HSS6X6X3/8", desc:"HSS Square",           ppl:1.91},
    {section:"HSS6X6X1/2", desc:"HSS Square",           ppl:1.88},
    {section:"L4X4X3/8",   desc:"Angle",                ppl:1.02},
    {section:"C8X11.5",    desc:"Channel",              ppl:0.94},
    {section:"PL1/2",      desc:"Plate A36",            ppl:2.08},
    {section:"A36-PLATE",  desc:"Plate A36 (generic)",  ppl:1.88},
    {section:"PIPE3STD",   desc:"Pipe Std",             ppl:1.40},
  ],
  "ABC Steel": [
    {section:"W8X31",      desc:"Wide Flange",          ppl:1.71},
    {section:"W10X33",     desc:"Wide Flange",          ppl:1.73},
    {section:"W10X49",     desc:"Wide Flange",          ppl:2.01},
    {section:"W12X26",     desc:"Wide Flange",          ppl:1.76},
    {section:"W12X50",     desc:"Wide Flange",          ppl:2.00},
    {section:"W12X65",     desc:"Wide Flange",          ppl:2.71},
    {section:"W14X82",     desc:"Wide Flange",          ppl:3.18},
    {section:"W18X35",     desc:"Wide Flange",          ppl:1.75},
    {section:"HSS4X4X1/4", desc:"HSS Square",           ppl:1.04},
    {section:"HSS6X6X3/8", desc:"HSS Square",           ppl:1.85},
    {section:"HSS6X6X1/2", desc:"HSS Square",           ppl:1.82},
    {section:"L4X4X3/8",   desc:"Angle",                ppl:0.98},
    {section:"C8X11.5",    desc:"Channel",              ppl:0.91},
    {section:"PL1/2",      desc:"Plate A36",            ppl:2.01},
    {section:"A36-PLATE",  desc:"Plate A36 (generic)",  ppl:1.82},
    {section:"PIPE3STD",   desc:"Pipe Std",             ppl:1.36},
  ],
};

export const DEFAULT_GALVANIZERS = [
  {name:"AZZ Galvanizing",    pplb:0.45, leadDays:7, notes:"Large volume. Call for quotes over 10T."},
  {name:"Thomas Galvanizing", pplb:0.42, leadDays:4, notes:"Regional. Good turnaround."},
  {name:"Valmont Galvanizing",pplb:0.48, leadDays:9, notes:"Premium finish for spec jobs."},
  {name:"Local Galv Co",      pplb:0.38, leadDays:3, notes:"Small shop. Quick small jobs."},
];

// Plate weights in lbs/sqft by thickness
export const PLATE_WEIGHTS = {
  "3/16":7.65,"1/4":10.21,"5/16":12.76,"3/8":15.31,"7/16":17.86,
  "1/2":20.41,"9/16":22.96,"5/8":25.52,"3/4":30.62,"7/8":35.73,
  "1":40.84,"1-1/8":45.94,"1-1/4":51.05,"1-3/8":56.15,"1-1/2":61.25,
  "1-3/4":71.46,"2":81.67,"2-1/2":102.09,
};

// New takeoff row: no mark, costFactor ($/cwt), isPlate+plateThickness+plateWidthIn for plates
export const DEFAULT_TAKEOFF = [
  {id:1, type:"structural", section:"W12X50",     wplf:50,   costFactor:180, qty:8,  len:30, isPlate:false, plateThickness:"", plateWidthIn:0},
  {id:2, type:"structural", section:"W10X33",     wplf:33,   costFactor:175, qty:12, len:15, isPlate:false, plateThickness:"", plateWidthIn:0},
  {id:3, type:"structural", section:"HSS6X6X3/8", wplf:27.4, costFactor:195, qty:8,  len:16, isPlate:false, plateThickness:"", plateWidthIn:0},
  {id:4, type:"structural", section:"W8X31",      wplf:31,   costFactor:178, qty:8,  len:20, isPlate:false, plateThickness:"", plateWidthIn:0},
  {id:5, type:"structural", section:"PL1/2",      wplf:20.4, costFactor:200, qty:12, len:1,  isPlate:true,  plateThickness:"1/2", plateWidthIn:12},
];

export const DEFAULT_MISC_ITEMS = [
  {id:1, desc:"Handrail - Pipe 3/4 SCH40", qty:1, unit:"LS", unitCost:2400},
  {id:2, desc:"Embed Plates 6x6x3/8",      qty:16, unit:"EA", unitCost:85},
];

export const DEFAULT_JOB_ERECTORS = [
  {id:1, name:"Metro Steel Erectors", scope:"Structural", useManualTons:false, manualTons:0},
];

export const fmt  = n => (!isFinite(n)||isNaN(n)) ? "-" : n.toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:0});
export const fmtD = n => (!isFinite(n)||isNaN(n)) ? "-" : n.toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2});
export const fmtN = (n,d=1) => (!isFinite(n)||isNaN(n)) ? "-" : n.toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
export const today = () => new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});

export const ci = (w=100) => ({
  background:"#0e1117", border:"1px solid #2d3340", borderRadius:4,
  color:"#edf0f4", padding:"4px 8px", fontSize:12, fontFamily:"inherit", width:w,
});
export const sel = {
  background:"#0e1117", border:"1px solid #2d3340", borderRadius:4,
  color:"#edf0f4", padding:"6px 10px", fontSize:12, fontFamily:"inherit",
};
