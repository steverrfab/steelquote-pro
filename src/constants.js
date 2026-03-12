// ── CONSTANTS ─────────────────────────────────────────────────────────────────

export const ERECTOR_SCOPES = ['Structural', 'Misc Metals', 'Stainless', 'Punch List', 'Other']

export const WORK_TYPES = [
  { id: 'structural', label: 'Structural', color: '#e85c26' },
  { id: 'misc',       label: 'Misc Metals', color: '#3b82f6' },
  { id: 'stainless',  label: 'Stainless',   color: '#10b981' },
]

// ── DEFAULT DATA ───────────────────────────────────────────────────────────────

export const DEFAULT_ERECTOR_LIST = [
  { name: 'Metro Steel Erectors',  rate: 4200, mob: 3500, pwAdd: 1800, aisc: true,  inHouse: false, notes: 'Local. Strong on commercial. Min 10T.' },
  { name: 'Allied Field Services', rate: 3850, mob: 4200, pwAdd: 1600, aisc: true,  inHouse: false, notes: 'Regional. Good on tight sites.' },
  { name: 'Ironwork Solutions',    rate: 4600, mob: 2800, pwAdd: 2100, aisc: true,  inHouse: false, notes: 'Premium. Complex/high-rise.' },
  { name: 'Budget Iron Works',     rate: 3400, mob: 5000, pwAdd: 1400, aisc: false, inHouse: false, notes: 'Best on large tonnage jobs.' },
  { name: 'Road Crew (In-House)',  rate: 1800, mob: 0,    pwAdd: 800,  aisc: false, inHouse: true,  notes: 'Own crew. Misc, punch list, small installs.' },
]

export const DEFAULT_SUPPLIERS = {
  'Metals USA': [
    { section: 'W8X31',      desc: 'Wide Flange',       ppl: 1.82 },
    { section: 'W10X33',     desc: 'Wide Flange',       ppl: 1.86 },
    { section: 'W10X49',     desc: 'Wide Flange',       ppl: 2.14 },
    { section: 'W12X26',     desc: 'Wide Flange',       ppl: 1.89 },
    { section: 'W12X50',     desc: 'Wide Flange',       ppl: 2.12 },
    { section: 'W12X65',     desc: 'Wide Flange',       ppl: 2.89 },
    { section: 'W14X82',     desc: 'Wide Flange',       ppl: 3.45 },
    { section: 'W18X35',     desc: 'Wide Flange',       ppl: 1.88 },
    { section: 'HSS4X4X1/4', desc: 'HSS Square',        ppl: 1.12 },
    { section: 'HSS6X6X3/8', desc: 'HSS Square',        ppl: 1.98 },
    { section: 'HSS6X6X1/2', desc: 'HSS Square',        ppl: 1.95 },
    { section: 'L4X4X3/8',   desc: 'Angle',             ppl: 1.06 },
    { section: 'L4X4X1/2',   desc: 'Angle',             ppl: 1.05 },
    { section: 'C8X11.5',    desc: 'Channel',            ppl: 0.98 },
    { section: 'PL1/2',      desc: 'Plate A36',         ppl: 2.15 },
    { section: 'PL3/4',      desc: 'Plate A36',         ppl: 2.18 },
    { section: 'A36-PLATE',  desc: 'Plate A36 (generic)', ppl: 1.95 },
    { section: 'PIPE3STD',   desc: 'Pipe Std',          ppl: 1.45 },
  ],
  'BMG Metals': [
    { section: 'W8X31',      desc: 'Wide Flange',       ppl: 1.75 },
    { section: 'W10X33',     desc: 'Wide Flange',       ppl: 1.79 },
    { section: 'W10X49',     desc: 'Wide Flange',       ppl: 2.08 },
    { section: 'W12X26',     desc: 'Wide Flange',       ppl: 1.82 },
    { section: 'W12X50',     desc: 'Wide Flange',       ppl: 2.06 },
    { section: 'W12X65',     desc: 'Wide Flange',       ppl: 2.79 },
    { section: 'W14X82',     desc: 'Wide Flange',       ppl: 3.31 },
    { section: 'W18X35',     desc: 'Wide Flange',       ppl: 1.81 },
    { section: 'HSS4X4X1/4', desc: 'HSS Square',        ppl: 1.08 },
    { section: 'HSS6X6X3/8', desc: 'HSS Square',        ppl: 1.91 },
    { section: 'HSS6X6X1/2', desc: 'HSS Square',        ppl: 1.88 },
    { section: 'L4X4X3/8',   desc: 'Angle',             ppl: 1.02 },
    { section: 'L4X4X1/2',   desc: 'Angle',             ppl: 1.01 },
    { section: 'C8X11.5',    desc: 'Channel',            ppl: 0.94 },
    { section: 'PL1/2',      desc: 'Plate A36',         ppl: 2.08 },
    { section: 'PL3/4',      desc: 'Plate A36',         ppl: 2.11 },
    { section: 'A36-PLATE',  desc: 'Plate A36 (generic)', ppl: 1.88 },
    { section: 'PIPE3STD',   desc: 'Pipe Std',          ppl: 1.40 },
  ],
  'ABC Steel': [
    { section: 'W8X31',      desc: 'Wide Flange',       ppl: 1.71 },
    { section: 'W10X33',     desc: 'Wide Flange',       ppl: 1.73 },
    { section: 'W10X49',     desc: 'Wide Flange',       ppl: 2.01 },
    { section: 'W12X26',     desc: 'Wide Flange',       ppl: 1.76 },
    { section: 'W12X50',     desc: 'Wide Flange',       ppl: 2.00 },
    { section: 'W12X65',     desc: 'Wide Flange',       ppl: 2.71 },
    { section: 'W14X82',     desc: 'Wide Flange',       ppl: 3.18 },
    { section: 'W18X35',     desc: 'Wide Flange',       ppl: 1.75 },
    { section: 'HSS4X4X1/4', desc: 'HSS Square',        ppl: 1.04 },
    { section: 'HSS6X6X3/8', desc: 'HSS Square',        ppl: 1.85 },
    { section: 'HSS6X6X1/2', desc: 'HSS Square',        ppl: 1.82 },
    { section: 'L4X4X3/8',   desc: 'Angle',             ppl: 0.98 },
    { section: 'L4X4X1/2',   desc: 'Angle',             ppl: 0.97 },
    { section: 'C8X11.5',    desc: 'Channel',            ppl: 0.91 },
    { section: 'PL1/2',      desc: 'Plate A36',         ppl: 2.01 },
    { section: 'PL3/4',      desc: 'Plate A36',         ppl: 2.04 },
    { section: 'A36-PLATE',  desc: 'Plate A36 (generic)', ppl: 1.82 },
    { section: 'PIPE3STD',   desc: 'Pipe Std',          ppl: 1.36 },
  ],
}

export const DEFAULT_GALVANIZERS = [
  { name: 'AZZ Galvanizing',     pplb: 0.45, leadDays: 7,  notes: 'Large volume. Call for quotes over 10T.' },
  { name: 'Thomas Galvanizing',  pplb: 0.42, leadDays: 4,  notes: 'Regional. Good turnaround.' },
  { name: 'Valmont Galvanizing', pplb: 0.48, leadDays: 9,  notes: 'Premium finish for spec jobs.' },
  { name: 'Local Galv Co',       pplb: 0.38, leadDays: 3,  notes: 'Small shop. Quick small jobs.' },
]

export const DEFAULT_TAKEOFF = [
  { id: 1, mark: 'B1',  type: 'structural', section: 'W12X50',     desc: 'Main Beam - East Bay',  qty: 4,  wplf: 50,   len: 30 },
  { id: 2, mark: 'B2',  type: 'structural', section: 'W12X50',     desc: 'Main Beam - West Bay',  qty: 4,  wplf: 50,   len: 30 },
  { id: 3, mark: 'B3',  type: 'structural', section: 'W10X33',     desc: 'Secondary Beam',        qty: 12, wplf: 33,   len: 15 },
  { id: 4, mark: 'C1',  type: 'structural', section: 'HSS6X6X3/8', desc: 'Column - Interior',     qty: 8,  wplf: 35.1, len: 16 },
  { id: 5, mark: 'B5',  type: 'structural', section: 'W8X31',      desc: 'Spandrel Beam',         qty: 8,  wplf: 31,   len: 20 },
  { id: 6, mark: 'PL1', type: 'structural', section: 'PL1/2',      desc: 'Base Plates 12x12',     qty: 12, wplf: 20.4, len: 1  },
  { id: 7, mark: 'R1',  type: 'misc',       section: 'PIPE3STD',   desc: 'Handrail - Pipe',       qty: 6,  wplf: 7.58, len: 12 },
  { id: 8, mark: 'S1',  type: 'misc',       section: 'A36-PLATE',  desc: 'Stair Stringer',        qty: 4,  wplf: 40,   len: 10 },
]

export const DEFAULT_JOB_ERECTORS = [
  { id: 1, name: 'Metro Steel Erectors', scope: 'Structural', useManualTons: false, manualTons: 0 },
]

// ── FORMATTERS ─────────────────────────────────────────────────────────────────

export const fmt  = n => (!isFinite(n) || isNaN(n)) ? '-' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
export const fmtD = n => (!isFinite(n) || isNaN(n)) ? '-' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const fmtN = (n, d = 1) => (!isFinite(n) || isNaN(n)) ? '-' : n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })

// ── SHARED STYLES ──────────────────────────────────────────────────────────────

export const ci = (w = 100) => ({
  background: '#0e1117',
  border: '1px solid #2d3340',
  borderRadius: 4,
  color: '#edf0f4',
  padding: '4px 8px',
  fontSize: 12,
  fontFamily: 'inherit',
  width: w,
})

export const sel = {
  background: '#0e1117',
  border: '1px solid #2d3340',
  borderRadius: 4,
  color: '#edf0f4',
  padding: '6px 10px',
  fontSize: 12,
  fontFamily: 'inherit',
}
