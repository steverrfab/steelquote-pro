import { useState, useMemo, useRef } from 'react'
import {
  WORK_TYPES, ERECTOR_SCOPES,
  DEFAULT_SUPPLIERS, DEFAULT_ERECTOR_LIST, DEFAULT_GALVANIZERS,
  DEFAULT_TAKEOFF, DEFAULT_JOB_ERECTORS,
  fmt, fmtD, fmtN, ci, sel,
} from './constants'
import { SH, SecLbl, QSec, R, Lbl, Note, Badge, Chip, Toggle, Btn } from './components'

export default function App() {
  const [tab, setTab]         = useState('takeoff')
  const [jobNum, setJobNum]   = useState('J-001')
  const [jobName, setJobName] = useState('Sample Structural Package')
  const [takeoff, setTakeoff] = useState(DEFAULT_TAKEOFF)

  const [suppliers,   setSuppliers]   = useState(DEFAULT_SUPPLIERS)
  const [erectorList, setErectorList] = useState(DEFAULT_ERECTOR_LIST)
  const [galvanizers, setGalvanizers] = useState(DEFAULT_GALVANIZERS)
  const [jobErectors, setJobErectors] = useState(DEFAULT_JOB_ERECTORS)
  const [requiresAISC, setRequiresAISC] = useState(false)

  const [supplier, setSupplier] = useState('Metals USA')
  const [taxPct,   setTaxPct]   = useState(0)

  const [laborRates, setLaborRates] = useState({ structural: 95, misc: 90, stainless: 110 })
  const [shopHours,  setShopHours]  = useState({ structural: 280, misc: 40, stainless: 0 })
  const [monthlyOvhd, setMonthlyOvhd] = useState(70000)
  const [monthlyHrs,  setMonthlyHrs]  = useState(1400)

  const [isPW,    setIsPW]    = useState(false)
  const [pwAdd,   setPwAdd]   = useState(28)
  const [pwAdmin, setPwAdmin] = useState(1200)

  const [paintType, setPaintType] = useState('primer')
  const [pgal, setPgal] = useState(20); const [ppg, setPpg] = useState(48)
  const [tgal, setTgal] = useState(5);  const [tpg, setTpg] = useState(52)

  const [isGalv,  setIsGalv]  = useState(false)
  const [galvAmt, setGalvAmt] = useState(0)

  const [bolts,    setBolts]    = useState(1200)
  const [freightC, setFreightC] = useState(2400)
  const [detail,   setDetail]   = useState(0)
  const [inspect,  setInspect]  = useState(0)
  const [miscCost, setMiscCost] = useState(500)

  const [ovhd, setOvhd] = useState(18)
  const [marg, setMarg] = useState(22)

  const burdenRate = monthlyHrs > 0 ? monthlyOvhd / monthlyHrs : 0

  const availableErectors = requiresAISC ? erectorList.filter(e => e.aisc) : erectorList

  const calc = (sup) => {
    const prices = {}
    ;(suppliers[sup] || []).forEach(r => { prices[r.section] = r.ppl })

    let matCost = 0
    const tonsByType = { structural: 0, misc: 0, stainless: 0 }
    const rows = takeoff.map(r => {
      const tons = (r.wplf * r.len * r.qty) / 2000
      const ppl  = prices[r.section] || 0
      const cost = ppl * r.wplf * r.len * r.qty
      matCost += cost
      if (tonsByType[r.type] !== undefined) tonsByType[r.type] += tons
      return { ...r, tons, cost, ppl }
    })

    const totalTons = Object.values(tonsByType).reduce((a, b) => a + b, 0)
    const taxCost   = matCost * (taxPct / 100)

    let totalLabor = 0, totalBurden = 0
    const laborByType = {}
    WORK_TYPES.forEach(({ id }) => {
      const effRate = isPW ? (laborRates[id] || 0) + pwAdd : (laborRates[id] || 0)
      const hrs     = shopHours[id] || 0
      const lab     = hrs * effRate
      const burden  = hrs * burdenRate
      laborByType[id] = { hrs, effRate, lab, burden }
      totalLabor  += lab
      totalBurden += burden
    })

    let totalErection = 0
    const scopeMap = { Structural: 'structural', 'Misc Metals': 'misc', Stainless: 'stainless' }
    const erectDetail = jobErectors.map(je => {
      const master = erectorList.find(e => e.name === je.name)
      if (!master) return { ...je, cost: 0, effRate: 0, tons: 0, master: null }
      const effRate = master.rate + (isPW ? master.pwAdd : 0)
      let tons = je.useManualTons ? je.manualTons : totalTons
      if (!je.useManualTons && je.scope !== 'Other' && je.scope !== 'Punch List') {
        const key = scopeMap[je.scope]
        if (key) tons = tonsByType[key] || totalTons
      }
      const cost = effRate * tons + (master.mob || 0)
      totalErection += cost
      return { ...je, cost, effRate, tons, master }
    })

    const paintMat  = paintType !== 'none' ? pgal * ppg : 0
    const touchCost = tgal * tpg
    const galvCost  = isGalv ? galvAmt : 0
    const pwAdmCost = isPW ? pwAdmin : 0

    const direct = matCost + taxCost + totalLabor + totalBurden + totalErection +
                   paintMat + touchCost + galvCost +
                   bolts + freightC + detail + inspect + miscCost + pwAdmCost

    const ovhdCost = direct * (ovhd / 100)
    const sub      = direct + ovhdCost
    const margCost = sub * (marg / 100)
    const total    = sub + margCost

    return {
      rows, matCost, taxCost, totalLabor, totalBurden, laborByType,
      totalErection, erectDetail, paintMat, touchCost, galvCost, pwAdmCost,
      direct, ovhdCost, sub, margCost, total, totalTons, tonsByType,
    }
  }

  const sharedDeps = [
    takeoff, suppliers, erectorList, jobErectors, isPW, pwAdd, pwAdmin, taxPct,
    laborRates, shopHours, monthlyOvhd, monthlyHrs, paintType, pgal, ppg, tgal, tpg,
    isGalv, galvAmt, bolts, freightC, detail, inspect, miscCost, ovhd, marg,
  ]

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const est = useMemo(() => calc(supplier), [supplier, ...sharedDeps])

  const addJobErector = () => {
    const first = availableErectors[0]
    if (!first) return
    setJobErectors(e => [...e, { id: Date.now(), name: first.name, scope: 'Structural', useManualTons: false, manualTons: 0 }])
  }

  const TABS = [
    { id: 'takeoff',    label: 'Takeoff' },
    { id: 'materials',  label: 'Materials' },
    { id: 'labor',      label: 'Labor & Burden' },
    { id: 'erection',   label: 'Erection' },
    { id: 'finishes',   label: 'Paint & Galv' },
    { id: 'other',      label: 'Other Costs' },
    { id: 'pw',         label: isPW ? 'Prev. Wage ●' : 'Prev. Wage' },
    { id: 'pricelists', label: 'Price Lists' },
    { id: 'quote',      label: 'Quote' },
  ]

  return (
    <div style={{ fontFamily: "'IBM Plex Mono',monospace", background: '#0e1117', minHeight: '100vh', color: '#c8cdd6' }}>

      {/* HEADER */}
      <div style={{ background: '#13171f', borderBottom: '2px solid #e85c26', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: '#e85c26', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>SteelQuote Pro</div>
          <div style={{ fontSize: 18, color: '#edf0f4', fontWeight: 700 }}>Fabrication Estimating System</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {isPW && <Badge color="#7c3aed" text="PREVAILING WAGE" />}
          {requiresAISC && <Badge color="#f59e0b" text="AISC REQUIRED" />}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 3 }}>Job #</div>
            <input value={jobNum} onChange={e => setJobNum(e.target.value)}
              style={{ background: 'transparent', border: '1px solid #2d3340', borderRadius: 4, color: '#e85c26', padding: '4px 10px', fontSize: 14, fontWeight: 700, width: 90, fontFamily: 'inherit', textAlign: 'right' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 3 }}>Job Name</div>
            <input value={jobName} onChange={e => setJobName(e.target.value)}
              style={{ background: 'transparent', border: '1px solid #2d3340', borderRadius: 4, color: '#edf0f4', padding: '4px 10px', fontSize: 13, width: 220, fontFamily: 'inherit', textAlign: 'right' }} />
          </div>
        </div>
      </div>

      {/* SUMMARY BAR */}
      <div style={{ background: '#161b24', borderBottom: '1px solid #1e2532', padding: '10px 28px', display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
        {WORK_TYPES.map(({ id, label, color }) => (
          <div key={id}>
            <div style={{ fontSize: 9, color, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, color: '#c8cdd6', fontWeight: 600 }}>{fmtN(est.tonsByType[id], 2)} T</div>
          </div>
        ))}
        <div style={{ width: 1, height: 28, background: '#2d3340' }} />
        {[['Material', fmt(est.matCost)], ['Labor', fmt(est.totalLabor)], ['Burden', fmt(est.totalBurden)], ['Erection', fmt(est.totalErection)]].map(([l, v]) => (
          <div key={l}>
            <div style={{ fontSize: 9, color: '#6b7280', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
            <div style={{ fontSize: 13, color: '#c8cdd6', fontWeight: 600 }}>{v}</div>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: '#e85c26', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>Total Quote</div>
          <div style={{ fontSize: 24, color: '#edf0f4', fontWeight: 800 }}>{fmt(est.total)}</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e2532', padding: '0 28px', background: '#0e1117', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '10px 14px',
            fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', whiteSpace: 'nowrap',
            color: tab === t.id ? '#e85c26' : '#6b7280',
            borderBottom: tab === t.id ? '2px solid #e85c26' : '2px solid transparent',
            fontFamily: 'inherit', marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: 28 }}>

        {tab === 'takeoff' && (
          <TakeoffTab takeoff={takeoff} setTakeoff={setTakeoff} est={est} />
        )}
        {tab === 'materials' && (
          <MaterialsTab est={est} supplier={supplier} setSupplier={setSupplier} suppliers={suppliers} taxPct={taxPct} setTaxPct={setTaxPct} sel={sel} />
        )}
        {tab === 'labor' && (
          <LaborTab est={est} laborRates={laborRates} setLaborRates={setLaborRates} shopHours={shopHours} setShopHours={setShopHours} monthlyOvhd={monthlyOvhd} setMonthlyOvhd={setMonthlyOvhd} monthlyHrs={monthlyHrs} setMonthlyHrs={setMonthlyHrs} burdenRate={burdenRate} />
        )}
        {tab === 'erection' && (
          <ErectionTab est={est} jobErectors={jobErectors} setJobErectors={setJobErectors} erectorList={erectorList} availableErectors={availableErectors} requiresAISC={requiresAISC} setRequiresAISC={setRequiresAISC} addJobErector={addJobErector} isPW={isPW} />
        )}
        {tab === 'finishes' && (
          <FinishesTab est={est} paintType={paintType} setPaintType={setPaintType} pgal={pgal} setPgal={setPgal} ppg={ppg} setPpg={setPpg} tgal={tgal} setTgal={setTgal} tpg={tpg} setTpg={setTpg} isGalv={isGalv} setIsGalv={setIsGalv} galvAmt={galvAmt} setGalvAmt={setGalvAmt} sel={sel} />
        )}
        {tab === 'other' && (
          <OtherTab bolts={bolts} setBolts={setBolts} freightC={freightC} setFreightC={setFreightC} detail={detail} setDetail={setDetail} inspect={inspect} setInspect={setInspect} miscCost={miscCost} setMiscCost={setMiscCost} />
        )}
        {tab === 'pw' && (
          <PrevWageTab isPW={isPW} setIsPW={setIsPW} pwAdd={pwAdd} setPwAdd={setPwAdd} pwAdmin={pwAdmin} setPwAdmin={setPwAdmin} laborRates={laborRates} est={est} />
        )}
        {tab === 'pricelists' && (
          <PriceListsTab suppliers={suppliers} setSuppliers={setSuppliers} erectorList={erectorList} setErectorList={setErectorList} galvanizers={galvanizers} setGalvanizers={setGalvanizers} />
        )}
        {tab === 'quote' && (
          <QuoteTab est={est} jobNum={jobNum} jobName={jobName} supplier={supplier} isPW={isPW} requiresAISC={requiresAISC} taxPct={taxPct} isGalv={isGalv} detail={detail} inspect={inspect} miscCost={miscCost} ovhd={ovhd} setOvhd={setOvhd} marg={marg} setMarg={setMarg} burdenRate={burdenRate} />
        )}

      </div>
    </div>
  )
}

// ── TAB COMPONENTS ─────────────────────────────────────────────────────────────

function TakeoffTab({ takeoff, setTakeoff, est }) {
  const u = (id, k, v) => setTakeoff(rows => rows.map(x => x.id === id ? { ...x, [k]: v } : x))
  return (
    <div>
      <SH title="Takeoff List" sub="Tag each member by work type. Types drive separate labor rates and erection scope assignments." />
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr style={{ color: '#6b7280', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {['Type', 'Mark', 'Section', 'Description', 'Qty', 'Wt/Ft', 'Len', 'Tons', ''].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #1e2532' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {takeoff.map((r, i) => {
              const t = (r.wplf * r.len * r.qty) / 2000
              const wt = WORK_TYPES.find(w => w.id === r.type)
              return (
                <tr key={r.id} style={{ background: i % 2 === 0 ? '#13171f' : 'transparent' }}>
                  <td style={{ padding: '7px 10px' }}>
                    <select value={r.type} onChange={e => u(r.id, 'type', e.target.value)}
                      style={{ background: '#0e1117', border: `1px solid ${wt?.color || '#2d3340'}55`, borderRadius: 4, color: wt?.color, padding: '3px 6px', fontSize: 10, fontFamily: 'inherit', width: 95 }}>
                      {WORK_TYPES.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '7px 10px' }}><input value={r.mark} onChange={e => u(r.id, 'mark', e.target.value)} style={ci(48)} /></td>
                  <td style={{ padding: '7px 10px' }}><input value={r.section} onChange={e => u(r.id, 'section', e.target.value)} style={ci(110)} /></td>
                  <td style={{ padding: '7px 10px' }}><input value={r.desc} onChange={e => u(r.id, 'desc', e.target.value)} style={ci(170)} /></td>
                  <td style={{ padding: '7px 10px' }}><input type="number" value={r.qty} onChange={e => u(r.id, 'qty', +e.target.value)} style={ci(48)} /></td>
                  <td style={{ padding: '7px 10px' }}><input type="number" value={r.wplf} onChange={e => u(r.id, 'wplf', +e.target.value)} style={ci(62)} /></td>
                  <td style={{ padding: '7px 10px' }}><input type="number" value={r.len} onChange={e => u(r.id, 'len', +e.target.value)} style={ci(58)} /></td>
                  <td style={{ padding: '7px 10px', color: wt?.color, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtN(t, 2)} T</td>
                  <td style={{ padding: '7px 10px' }}><button onClick={() => setTakeoff(rows => rows.filter(x => x.id !== r.id))} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 16 }}>×</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {WORK_TYPES.map(({ id, label, color }) => (
          <button key={id} onClick={() => setTakeoff(r => [...r, { id: Date.now() + Math.random(), mark: '', type: id, section: 'W8X31', desc: 'New Member', qty: 1, wplf: 31, len: 20 }])}
            style={{ background: '#1a2030', border: `1px solid ${color}44`, borderRadius: 6, color, padding: '7px 14px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1, textTransform: 'uppercase' }}>
            + {label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, background: '#1a2030', border: '1px solid #2d3340', borderRadius: 6, padding: '8px 16px' }}>
          {WORK_TYPES.map(({ id, label, color }) => (
            <span key={id} style={{ fontSize: 11 }}><span style={{ color }}>{label.split(' ')[0]}: </span><strong style={{ color: '#edf0f4' }}>{fmtN(est.tonsByType[id], 2)}T</strong></span>
          ))}
          <span style={{ color: '#6b7280' }}>|</span>
          <strong style={{ color: '#e85c26' }}>{fmtN(est.totalTons, 2)}T total</strong>
        </div>
      </div>
    </div>
  )
}

function MaterialsTab({ est, supplier, setSupplier, suppliers, taxPct, setTaxPct, sel }) {
  return (
    <div>
      <SH title="Material Costs" sub="Switch supplier to reprice all members instantly." />
      <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <Lbl>Active Supplier</Lbl>
          <select value={supplier} onChange={e => setSupplier(e.target.value)} style={{ ...sel, marginTop: 6, display: 'block' }}>
            {Object.keys(suppliers).map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <Lbl>Sales Tax (%)</Lbl>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <input type="number" value={taxPct} onChange={e => setTaxPct(+e.target.value)} style={ci(60)} />
            <span style={{ fontSize: 11, color: '#6b7280' }}>= {fmt(est.taxCost)}</span>
          </div>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr style={{ color: '#6b7280', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {['Type', 'Mark', 'Section', 'Description', 'Qty', 'Len', 'Lbs', '$/Lb', 'Cost'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #1e2532' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {est.rows.map((r, i) => {
              const wt = WORK_TYPES.find(w => w.id === r.type)
              return (
                <tr key={r.id} style={{ background: i % 2 === 0 ? '#13171f' : 'transparent' }}>
                  <td style={{ padding: '7px 10px' }}><span style={{ fontSize: 9, color: wt?.color, textTransform: 'uppercase', letterSpacing: 1 }}>{r.type}</span></td>
                  <td style={{ padding: '7px 10px', color: '#6b7280', fontSize: 11 }}>{r.mark}</td>
                  <td style={{ padding: '7px 10px', color: '#edf0f4', fontWeight: 600 }}>{r.section}</td>
                  <td style={{ padding: '7px 10px', color: '#9ca3af', fontSize: 11 }}>{r.desc}</td>
                  <td style={{ padding: '7px 10px' }}>{r.qty}</td>
                  <td style={{ padding: '7px 10px' }}>{r.len}'</td>
                  <td style={{ padding: '7px 10px' }}>{fmtN(r.wplf * r.len * r.qty, 0)}</td>
                  <td style={{ padding: '7px 10px', color: r.ppl ? '#c8cdd6' : '#ef4444', fontWeight: r.ppl ? 400 : 700 }}>{r.ppl ? `$${r.ppl.toFixed(2)}` : 'NOT FOUND'}</td>
                  <td style={{ padding: '7px 10px', color: wt?.color, fontWeight: 600 }}>{fmt(r.cost)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #2d3340' }}>
              <td colSpan={8} style={{ padding: '10px 10px', color: '#9ca3af' }}>Total Material</td>
              <td style={{ padding: '10px 10px', color: '#edf0f4', fontWeight: 700, fontSize: 14 }}>{fmt(est.matCost)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function LaborTab({ est, laborRates, setLaborRates, shopHours, setShopHours, monthlyOvhd, setMonthlyOvhd, monthlyHrs, setMonthlyHrs, burdenRate }) {
  return (
    <div>
      <SH title="Labor & Shop Burden" sub="Separate rates per work type. Burden covers all shop overhead calculated from monthly costs." />
      <div style={{ background: '#13171f', border: '1px solid #1e2532', borderRadius: 10, padding: 20, maxWidth: 640, marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: '#e85c26', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Shop Burden Rate Calculator</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <Lbl>Monthly Overhead ($)</Lbl>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <span style={{ color: '#6b7280' }}>$</span>
              <input type="number" value={monthlyOvhd} onChange={e => setMonthlyOvhd(+e.target.value)} style={{ ...ci(110), fontSize: 14, fontWeight: 700 }} />
            </div>
            <div style={{ fontSize: 9, color: '#4b5563', marginTop: 4 }}>Rent, utilities, gas, insurance, vehicles, equipment</div>
          </div>
          <div>
            <Lbl>Monthly Billable Hours</Lbl>
            <input type="number" value={monthlyHrs} onChange={e => setMonthlyHrs(+e.target.value)} style={{ ...ci(110), fontSize: 14, fontWeight: 700, marginTop: 6, display: 'block' }} />
            <div style={{ fontSize: 9, color: '#4b5563', marginTop: 4 }}>8 workers × 173 hrs ≈ 1,384/mo</div>
          </div>
          <div style={{ background: '#0e1117', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid #e85c2633' }}>
            <div style={{ fontSize: 9, color: '#e85c26', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Burden Rate</div>
            <div style={{ fontSize: 28, color: '#e85c26', fontWeight: 800 }}>${fmtN(burdenRate, 2)}</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>per shop hour</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
        {WORK_TYPES.map(({ id, label, color }) => {
          const lb = est.laborByType[id] || {}
          return (
            <div key={id} style={{ background: '#13171f', border: `1px solid ${color}33`, borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 10, color, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>{label}</div>
              <div style={{ marginBottom: 12 }}>
                <Lbl>Labor Rate ($/hr)</Lbl>
                <input type="number" value={laborRates[id] || 0} onChange={e => setLaborRates(r => ({ ...r, [id]: +e.target.value }))}
                  style={{ ...ci(90), marginTop: 6, display: 'block', fontSize: 16, fontWeight: 700 }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <Lbl>Shop Hours</Lbl>
                <input type="number" value={shopHours[id] || 0} onChange={e => setShopHours(h => ({ ...h, [id]: +e.target.value }))}
                  style={{ ...ci(90), marginTop: 6, display: 'block', fontSize: 16, fontWeight: 700 }} />
              </div>
              <div style={{ borderTop: `1px solid ${color}33`, paddingTop: 12 }}>
                <R label="Direct Labor" value={fmt(lb.lab || 0)} />
                <R label={`Burden ($${fmtN(burdenRate, 2)}/hr)`} value={fmt(lb.burden || 0)} />
                <R label="Total Shop Cost" value={fmt((lb.lab || 0) + (lb.burden || 0))} hi />
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ background: '#13171f', border: '1px solid #1e2532', borderRadius: 8, padding: 18, maxWidth: 440 }}>
        <R label="Total Direct Labor" value={fmt(est.totalLabor)} />
        <R label="Total Shop Burden" value={fmt(est.totalBurden)} />
        <R label="Combined Shop Cost" value={fmt(est.totalLabor + est.totalBurden)} hi />
        <div style={{ paddingTop: 10, marginTop: 6, borderTop: '1px solid #1e2532' }}>
          <R label="Blended $/Ton (fab)" value={est.totalTons > 0 ? fmtD((est.totalLabor + est.totalBurden) / est.totalTons) + '/T' : '-'} />
        </div>
      </div>
    </div>
  )
}

function ErectionTab({ est, jobErectors, setJobErectors, erectorList, availableErectors, requiresAISC, setRequiresAISC, addJobErector, isPW }) {
  return (
    <div>
      <SH title="Erection" sub="Add one erector per scope. Mix and match — structural erector, misc crew, road crew for punch list, etc." />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, background: '#13171f', border: '1px solid #1e2532', borderRadius: 8, padding: 16, maxWidth: 560, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Toggle value={requiresAISC} onChange={setRequiresAISC} />
          <div>
            <div style={{ fontSize: 12, color: requiresAISC ? '#f59e0b' : '#6b7280', fontWeight: 600 }}>AISC Certified Erectors Required</div>
            <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>When on, only AISC-certified crews appear in dropdowns</div>
          </div>
        </div>
        {requiresAISC && (
          <div style={{ marginLeft: 'auto', fontSize: 10, color: '#f59e0b' }}>{availableErectors.length} AISC crew{availableErectors.length !== 1 ? 's' : ''} available</div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
        {est.erectDetail.map((je) => {
          const master = je.master
          return (
            <div key={je.id} style={{ background: '#13171f', border: '1px solid #1e2532', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: '0 0 200px' }}>
                  <Lbl>Erector</Lbl>
                  <select value={je.name}
                    onChange={e => setJobErectors(ers => ers.map(x => x.id === je.id ? { ...x, name: e.target.value } : x))}
                    style={{ ...sel, display: 'block', marginTop: 6, width: '100%' }}>
                    {availableErectors.map(e => (
                      <option key={e.name} value={e.name}>{e.name}{e.inHouse ? ' (In-House)' : ''}</option>
                    ))}
                  </select>
                  {master && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {master.aisc && <Chip color="#f59e0b" text="AISC" />}
                      {master.inHouse && <Chip color="#10b981" text="In-House" />}
                    </div>
                  )}
                </div>
                <div style={{ flex: '0 0 160px' }}>
                  <Lbl>Scope</Lbl>
                  <select value={je.scope}
                    onChange={e => setJobErectors(ers => ers.map(x => x.id === je.id ? { ...x, scope: e.target.value } : x))}
                    style={{ ...sel, display: 'block', marginTop: 6, width: '100%' }}>
                    {ERECTOR_SCOPES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ flex: '0 0 220px' }}>
                  <Lbl>Tons</Lbl>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <Toggle value={je.useManualTons}
                      onChange={v => setJobErectors(ers => ers.map(x => x.id === je.id ? { ...x, useManualTons: v } : x))} />
                    <span style={{ fontSize: 10, color: '#6b7280' }}>{je.useManualTons ? 'Manual' : 'Auto from scope'}</span>
                  </div>
                  {je.useManualTons
                    ? <input type="number" value={je.manualTons}
                        onChange={e => setJobErectors(ers => ers.map(x => x.id === je.id ? { ...x, manualTons: +e.target.value } : x))}
                        style={{ ...ci(90), marginTop: 8, display: 'block' }} />
                    : <div style={{ fontSize: 11, color: '#e85c26', marginTop: 6, fontWeight: 600 }}>{fmtN(je.tons, 2)} T auto</div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 160, background: '#0e1117', borderRadius: 8, padding: 14 }}>
                  {master && <>
                    <R label="Rate" value={`$${je.effRate.toLocaleString()}/ton`} />
                    <R label="Tons" value={`${fmtN(je.tons, 2)} T`} />
                    <R label="Mob" value={fmt(master.mob)} />
                    <R label="Subtotal" value={fmt(je.cost)} hi />
                  </>}
                </div>
                <button onClick={() => setJobErectors(ers => ers.filter(x => x.id !== je.id))}
                  style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 18, padding: 4, alignSelf: 'flex-start' }}>×</button>
              </div>
              {master?.notes && <div style={{ marginTop: 10, fontSize: 10, color: '#4b5563' }}>{master.notes}</div>}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Btn onClick={addJobErector}>+ Add Erector to Job</Btn>
        <div style={{ marginLeft: 'auto', background: '#1a2030', border: '1px solid #2d3340', borderRadius: 6, padding: '8px 16px', fontSize: 12 }}>
          Total Erection: <strong style={{ color: '#e85c26' }}>{fmt(est.totalErection)}</strong>
        </div>
      </div>
      {requiresAISC && availableErectors.length === 0 && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: '#ef444415', border: '1px solid #ef444455', borderRadius: 6, fontSize: 11, color: '#ef4444' }}>
          No AISC-certified erectors in your list. Add them in the Price Lists tab.
        </div>
      )}
    </div>
  )
}

function FinishesTab({ est, paintType, setPaintType, pgal, setPgal, ppg, setPpg, tgal, setTgal, tpg, setTpg, isGalv, setIsGalv, galvAmt, setGalvAmt, sel }) {
  return (
    <div>
      <SH title="Paint & Galvanizing" sub="Paint = material cost only. Application labor is in shop hours. Galvanizing is a sendout." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <SecLbl>Shop Paint</SecLbl>
          <div style={{ marginBottom: 14 }}>
            <Lbl>Paint Type</Lbl>
            <select value={paintType} onChange={e => setPaintType(e.target.value)} style={{ ...sel, display: 'block', marginTop: 6 }}>
              <option value="primer">Primer Only (1-coat)</option>
              <option value="two-coat">Two-Coat System</option>
              <option value="none">No Paint (bare / galvanized)</option>
            </select>
          </div>
          {paintType !== 'none' && (
            <div style={{ background: '#13171f', border: '1px solid #1e2532', borderRadius: 8, padding: 16, marginBottom: 14 }}>
              <Lbl>Shop Paint Material</Lbl>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginTop: 8 }}>
                <div><div style={{ fontSize: 9, color: '#6b7280', marginBottom: 4 }}>Gallons</div><input type="number" value={pgal} onChange={e => setPgal(+e.target.value)} style={ci(70)} /></div>
                <div><div style={{ fontSize: 9, color: '#6b7280', marginBottom: 4 }}>$/Gallon</div><input type="number" value={ppg} onChange={e => setPpg(+e.target.value)} style={ci(70)} /></div>
                <div style={{ fontSize: 14, color: '#e85c26', fontWeight: 700, paddingBottom: 4 }}>= {fmt(est.paintMat)}</div>
              </div>
            </div>
          )}
          <div style={{ background: '#13171f', border: '1px solid #1e2532', borderRadius: 8, padding: 16 }}>
            <Lbl>Field Touch-Up Paint</Lbl>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginTop: 8 }}>
              <div><div style={{ fontSize: 9, color: '#6b7280', marginBottom: 4 }}>Gallons</div><input type="number" value={tgal} onChange={e => setTgal(+e.target.value)} style={ci(70)} /></div>
              <div><div style={{ fontSize: 9, color: '#6b7280', marginBottom: 4 }}>$/Gallon</div><input type="number" value={tpg} onChange={e => setTpg(+e.target.value)} style={ci(70)} /></div>
              <div style={{ fontSize: 14, color: '#e85c26', fontWeight: 700, paddingBottom: 4 }}>= {fmt(est.touchCost)}</div>
            </div>
            <Note tight>Touch-up after erection is easy to forget. Always include it.</Note>
          </div>
        </div>
        <div>
          <SecLbl>Galvanizing (Sendout)</SecLbl>
          <div style={{ background: '#13171f', border: '1px solid #1e2532', borderRadius: 8, padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Toggle value={isGalv} onChange={setIsGalv} />
              <span style={{ fontSize: 12, color: isGalv ? '#edf0f4' : '#6b7280' }}>This job requires galvanizing</span>
            </div>
            {isGalv ? (
              <div>
                <Lbl>Galvanizer Quote (Lump Sum)</Lbl>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 10 }}>
                  <span style={{ color: '#6b7280' }}>$</span>
                  <input type="number" value={galvAmt} onChange={e => setGalvAmt(+e.target.value)}
                    style={{ background: '#0e1117', border: '1px solid #2d3340', borderRadius: 4, color: '#edf0f4', padding: '8px 10px', fontSize: 16, fontWeight: 700, width: 140, fontFamily: 'inherit' }} />
                </div>
                <div style={{ color: '#e85c26', fontWeight: 700 }}>{fmt(galvAmt)}</div>
                <Note tight>Typical: $0.35–0.60/lb. Add freight to/from galvanizer in Other Costs. Set paint to "No Paint" if galvanizing.</Note>
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#4b5563' }}>Toggle on when galvanizing is required.</div>
            )}
          </div>
          <div style={{ background: '#13171f', border: '1px solid #1e2532', borderRadius: 8, padding: 16 }}>
            <Lbl>Summary</Lbl>
            <div style={{ marginTop: 10 }}>
              <R label="Shop Paint" value={fmt(est.paintMat)} />
              <R label="Touch-Up (Field)" value={fmt(est.touchCost)} />
              <R label="Galvanizing" value={isGalv ? fmt(est.galvCost) : 'N/A'} />
              <R label="Total Finishes" value={fmt(est.paintMat + est.touchCost + est.galvCost)} hi />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OtherTab({ bolts, setBolts, freightC, setFreightC, detail, setDetail, inspect, setInspect, miscCost, setMiscCost }) {
  const rows = [
    ['Bolts, Anchor Rods & Hardware', bolts, setBolts],
    ['Freight / Delivery to Site', freightC, setFreightC],
    ['Steel Detailing / Shop Drawings', detail, setDetail],
    ['Inspection & Testing', inspect, setInspect],
    ['Miscellaneous', miscCost, setMiscCost],
  ]
  return (
    <div>
      <SH title="Other Direct Costs" sub="Freight, hardware, detailing, inspection, and miscellaneous." />
      <div style={{ background: '#13171f', border: '1px solid #1e2532', borderRadius: 8, padding: 20, maxWidth: 500 }}>
        {rows.map(([label, val, setter]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1a1f2b' }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#6b7280', fontSize: 12 }}>$</span>
              <input type="number" value={val} onChange={e => setter(+e.target.value)}
                style={{ background: '#0e1117', border: '1px solid #2d3340', borderRadius: 4, color: '#edf0f4', padding: '5px 8px', fontSize: 13, width: 100, fontFamily: 'inherit', textAlign: 'right' }} />
            </div>
          </div>
        ))}
        <div style={{ paddingTop: 12, marginTop: 4 }}>
          <R label="Total Other Costs" value={fmt(bolts + freightC + detail + inspect + miscCost)} hi />
        </div>
      </div>
      <Note>Bolts and hardware are almost always underestimated. Budget $800–2,000 minimum on structural packages. Detailing: $4–8/ton.</Note>
    </div>
  )
}

function PrevWageTab({ isPW, setIsPW, pwAdd, setPwAdd, pwAdmin, setPwAdmin, laborRates, est }) {
  return (
    <div>
      <SH title="Prevailing Wage" sub="For public, government, school, or bond-funded jobs. Affects all labor rates and adds certified payroll burden." />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, background: '#13171f', border: '1px solid #1e2532', borderRadius: 8, padding: 18, maxWidth: 500 }}>
        <Toggle value={isPW} onChange={setIsPW} large />
        <div>
          <div style={{ fontSize: 13, color: isPW ? '#edf0f4' : '#6b7280', fontWeight: 600, marginBottom: 3 }}>{isPW ? 'This is a Prevailing Wage job' : 'Standard (non-prevailing wage)'}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Toggle on for public, government, school, or bond-funded projects</div>
        </div>
      </div>
      {isPW && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 680 }}>
          <div style={{ background: '#13171f', border: '1px solid #7c3aed44', borderRadius: 8, padding: 18 }}>
            <div style={{ fontSize: 10, color: '#a78bfa', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Labor Rate Adder</div>
            <div style={{ marginBottom: 14 }}>
              <Lbl>PW Adder ($/hr — all work types)</Lbl>
              <input type="number" value={pwAdd} onChange={e => setPwAdd(+e.target.value)} style={{ ...ci(80), display: 'block', marginTop: 6 }} />
              <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>dol.gov/agencies/whd/wage-rates to look up your county/trade rate</div>
            </div>
            <div style={{ borderTop: '1px solid #1e2532', paddingTop: 12 }}>
              {WORK_TYPES.map(({ id, label }) => (
                <R key={id} label={label} value={`$${(laborRates[id] || 0) + pwAdd}/hr effective`} />
              ))}
            </div>
          </div>
          <div style={{ background: '#13171f', border: '1px solid #7c3aed44', borderRadius: 8, padding: 18 }}>
            <div style={{ fontSize: 10, color: '#a78bfa', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Compliance & Admin</div>
            <Lbl>Certified Payroll Admin Cost</Lbl>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 10 }}>
              <span style={{ color: '#6b7280' }}>$</span>
              <input type="number" value={pwAdmin} onChange={e => setPwAdmin(+e.target.value)}
                style={{ background: '#0e1117', border: '1px solid #2d3340', borderRadius: 4, color: '#edf0f4', padding: '6px 10px', fontSize: 15, fontWeight: 700, width: 110, fontFamily: 'inherit' }} />
            </div>
            <Note tight>Certified payroll is mandatory on PW jobs. Budget $1,000–3,000 depending on job duration.</Note>
          </div>
        </div>
      )}
      {!isPW && (
        <div style={{ maxWidth: 500, background: '#13171f', border: '1px solid #1e2532', borderRadius: 8, padding: 20, fontSize: 12, color: '#6b7280', lineHeight: 1.9 }}>
          <strong style={{ color: '#9ca3af' }}>What is prevailing wage?</strong><br />
          On public projects — schools, government buildings, bond-funded work — Davis-Bacon requires you pay workers the locally prevailing wage for their trade and county. Always verify before bidding any public job.
        </div>
      )}
    </div>
  )
}

function PriceListsTab({ suppliers, setSuppliers, erectorList, setErectorList, galvanizers, setGalvanizers }) {
  const [section, setSection]     = useState('suppliers')
  const [activeSup, setActiveSup] = useState(Object.keys(suppliers)[0])
  const [newSupName, setNewSupName] = useState('')
  const fileRef = useRef()

  const handleUpload = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const lines = ev.target.result.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',')
        const obj = {}; headers.forEach((h, i) => { obj[h] = vals[i]?.trim() || '' })
        return obj
      })
      if (!rows.length) return
      const supName = rows[0].supplier || activeSup
      const items = rows.map(r => ({ section: r.section || '', desc: r.description || r.desc || '', ppl: parseFloat(r.price_per_lb || r.ppl) || 0 }))
      setSuppliers(s => ({ ...s, [supName]: items }))
      setActiveSup(supName)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const SUB = [{ id: 'suppliers', label: 'Material Suppliers' }, { id: 'erectors', label: 'Erectors' }, { id: 'galv', label: 'Galvanizers' }]

  return (
    <div>
      <SH title="Price Lists" sub="Manage all vendor pricing. Upload CSV to replace a supplier's list instantly, or edit inline." />
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid #1e2532' }}>
        {SUB.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '8px 18px',
            fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
            color: section === s.id ? '#10b981' : '#6b7280',
            borderBottom: section === s.id ? '2px solid #10b981' : '2px solid transparent',
            fontFamily: 'inherit', marginBottom: -1,
          }}>{s.label}</button>
        ))}
      </div>

      {section === 'suppliers' && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div><Lbl>Supplier</Lbl>
              <select value={activeSup} onChange={e => setActiveSup(e.target.value)} style={{ ...sel, marginTop: 6, display: 'block' }}>
                {Object.keys(suppliers).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><Lbl>New Supplier</Lbl>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <input value={newSupName} onChange={e => setNewSupName(e.target.value)} placeholder="Name" style={{ ...ci(150), padding: '6px 10px' }} />
                <Btn onClick={() => { if (!newSupName.trim()) return; setSuppliers(s => ({ ...s, [newSupName.trim()]: [] })); setActiveSup(newSupName.trim()); setNewSupName('') }}>Add</Btn>
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Lbl>Upload CSV (supplier, section, description, price_per_lb)</Lbl>
              <div style={{ marginTop: 6 }}>
                <input ref={fileRef} type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
                <Btn onClick={() => fileRef.current.click()}>Upload CSV → {activeSup}</Btn>
              </div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr style={{ color: '#6b7280', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {['Section', 'Description', '$/Lb', ''].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #1e2532' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {(suppliers[activeSup] || []).map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#13171f' : 'transparent' }}>
                    <td style={{ padding: '6px 10px' }}><input value={row.section} onChange={e => setSuppliers(s => ({ ...s, [activeSup]: s[activeSup].map((r, j) => j === i ? { ...r, section: e.target.value } : r) }))} style={ci(120)} /></td>
                    <td style={{ padding: '6px 10px' }}><input value={row.desc} onChange={e => setSuppliers(s => ({ ...s, [activeSup]: s[activeSup].map((r, j) => j === i ? { ...r, desc: e.target.value } : r) }))} style={ci(200)} /></td>
                    <td style={{ padding: '6px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#6b7280', fontSize: 12 }}>$</span>
                        <input type="number" value={row.ppl} onChange={e => setSuppliers(s => ({ ...s, [activeSup]: s[activeSup].map((r, j) => j === i ? { ...r, ppl: +e.target.value } : r) }))} style={{ ...ci(80), textAlign: 'right' }} />
                        <span style={{ color: '#6b7280', fontSize: 11 }}>/lb</span>
                      </div>
                    </td>
                    <td style={{ padding: '6px 10px' }}><button onClick={() => setSuppliers(s => ({ ...s, [activeSup]: s[activeSup].filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 16 }}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12 }}><Btn onClick={() => setSuppliers(s => ({ ...s, [activeSup]: [...(s[activeSup] || []), { section: '', desc: '', ppl: 0 }] }))}>+ Add Row to {activeSup}</Btn></div>
        </div>
      )}

      {section === 'erectors' && (
        <div>
          <Note>AISC toggle: erector appears in AISC-required jobs. In-House: flags your own crew (Road Crew, etc.).</Note>
          <div style={{ height: 12 }} />
          <div style={{ overflowX: 'auto', marginBottom: 14 }}>
            <table>
              <thead><tr style={{ color: '#6b7280', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {['Company', '$/Ton', 'Mob ($)', 'PW Add/T', 'AISC', 'In-House', 'Notes', ''].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #1e2532', whiteSpace: 'nowrap' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {erectorList.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#13171f' : 'transparent' }}>
                    <td style={{ padding: '6px 10px' }}><input value={row.name} onChange={e => setErectorList(r => r.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} style={ci(170)} /></td>
                    <td style={{ padding: '6px 10px' }}><input type="number" value={row.rate} onChange={e => setErectorList(r => r.map((x, j) => j === i ? { ...x, rate: +e.target.value } : x))} style={{ ...ci(75), textAlign: 'right' }} /></td>
                    <td style={{ padding: '6px 10px' }}><input type="number" value={row.mob} onChange={e => setErectorList(r => r.map((x, j) => j === i ? { ...x, mob: +e.target.value } : x))} style={{ ...ci(75), textAlign: 'right' }} /></td>
                    <td style={{ padding: '6px 10px' }}><input type="number" value={row.pwAdd} onChange={e => setErectorList(r => r.map((x, j) => j === i ? { ...x, pwAdd: +e.target.value } : x))} style={{ ...ci(75), textAlign: 'right' }} /></td>
                    <td style={{ padding: '6px 10px' }}><Toggle value={row.aisc} onChange={v => setErectorList(r => r.map((x, j) => j === i ? { ...x, aisc: v } : x))} /></td>
                    <td style={{ padding: '6px 10px' }}><Toggle value={row.inHouse} onChange={v => setErectorList(r => r.map((x, j) => j === i ? { ...x, inHouse: v } : x))} /></td>
                    <td style={{ padding: '6px 10px' }}><input value={row.notes} onChange={e => setErectorList(r => r.map((x, j) => j === i ? { ...x, notes: e.target.value } : x))} style={ci(200)} /></td>
                    <td style={{ padding: '6px 10px' }}><button onClick={() => setErectorList(r => r.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 16 }}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Btn onClick={() => setErectorList(r => [...r, { name: 'New Erector', rate: 4000, mob: 3000, pwAdd: 1500, aisc: false, inHouse: false, notes: '' }])}>+ Add Erector</Btn>
        </div>
      )}

      {section === 'galv' && (
        <div>
          <div style={{ overflowX: 'auto', marginBottom: 14 }}>
            <table>
              <thead><tr style={{ color: '#6b7280', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {['Company', '$/Lb', 'Lead Days', 'Notes', ''].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #1e2532' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {galvanizers.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#13171f' : 'transparent' }}>
                    <td style={{ padding: '6px 10px' }}><input value={row.name} onChange={e => setGalvanizers(r => r.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} style={ci(180)} /></td>
                    <td style={{ padding: '6px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#6b7280', fontSize: 12 }}>$</span>
                        <input type="number" value={row.pplb} onChange={e => setGalvanizers(r => r.map((x, j) => j === i ? { ...x, pplb: +e.target.value } : x))} style={{ ...ci(70), textAlign: 'right' }} />
                        <span style={{ fontSize: 10, color: '#6b7280' }}>/lb</span>
                      </div>
                    </td>
                    <td style={{ padding: '6px 10px' }}><input type="number" value={row.leadDays} onChange={e => setGalvanizers(r => r.map((x, j) => j === i ? { ...x, leadDays: +e.target.value } : x))} style={ci(60)} /></td>
                    <td style={{ padding: '6px 10px' }}><input value={row.notes} onChange={e => setGalvanizers(r => r.map((x, j) => j === i ? { ...x, notes: e.target.value } : x))} style={ci(260)} /></td>
                    <td style={{ padding: '6px 10px' }}><button onClick={() => setGalvanizers(r => r.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 16 }}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Btn onClick={() => setGalvanizers(r => [...r, { name: 'New Galvanizer', pplb: 0.45, leadDays: 5, notes: '' }])}>+ Add Galvanizer</Btn>
        </div>
      )}
    </div>
  )
}

function QuoteTab({ est, jobNum, jobName, supplier, isPW, requiresAISC, taxPct, isGalv, detail, inspect, miscCost, ovhd, setOvhd, marg, setMarg, burdenRate }) {
  return (
    <div>
      <SH title="Quote Summary" sub="Full rollup. Adjust overhead and margin before client review." />
      <div style={{ background: '#13171f', border: '1px solid #1e2532', borderRadius: 10, padding: 28, maxWidth: 600 }}>
        <div style={{ borderBottom: '1px solid #1e2532', paddingBottom: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#e85c26', fontWeight: 700 }}>{jobNum}</span>
            <span style={{ fontSize: 15, color: '#edf0f4', fontWeight: 700 }}>{jobName}</span>
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{supplier} | {fmtN(est.totalTons, 2)} total tons</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {WORK_TYPES.map(({ id, label, color }) => (
              <span key={id} style={{ fontSize: 10 }}><span style={{ color }}>{label}: </span><span style={{ color: '#9ca3af' }}>{fmtN(est.tonsByType[id], 2)}T</span></span>
            ))}
            {isPW && <span style={{ fontSize: 10, color: '#a78bfa' }}>| Prevailing Wage</span>}
            {requiresAISC && <span style={{ fontSize: 10, color: '#f59e0b' }}>| AISC Required</span>}
          </div>
        </div>

        <QSec label="Materials">
          <R label="Steel / Metal Material" value={fmt(est.matCost)} />
          {taxPct > 0 && <R label={`Sales Tax (${taxPct}%)`} value={fmt(est.taxCost)} />}
          <R label="Bolts & Hardware" value={fmt(est.bolts || 0)} />
          {est.paintMat > 0 && <R label="Paint Material (Shop)" value={fmt(est.paintMat)} />}
          {est.touchCost > 0 && <R label="Touch-Up Paint (Field)" value={fmt(est.touchCost)} />}
          {isGalv && <R label="Galvanizing (Sendout)" value={fmt(est.galvCost)} />}
        </QSec>

        <QSec label="Shop Labor & Burden">
          {WORK_TYPES.map(({ id, label }) => {
            const lb = est.laborByType[id] || {}
            return lb.hrs > 0 ? <R key={id} label={`${label} (${lb.hrs}h × $${lb.effRate}/hr)`} value={fmt(lb.lab || 0)} /> : null
          })}
          <R label={`Shop Burden ($${fmtN(burdenRate, 2)}/hr)`} value={fmt(est.totalBurden)} />
        </QSec>

        <QSec label="Erection">
          {est.erectDetail.map((je, i) => (
            <R key={i} label={`${je.name} — ${je.scope} (${fmtN(je.tons, 2)}T + mob)`} value={fmt(je.cost)} />
          ))}
        </QSec>

        <QSec label="Other">
          <R label="Freight" value={fmt(est.freightC || 0)} />
          {detail > 0 && <R label="Detailing" value={fmt(detail)} />}
          {inspect > 0 && <R label="Inspection" value={fmt(inspect)} />}
          {miscCost > 0 && <R label="Miscellaneous" value={fmt(miscCost)} />}
          {isPW && <R label="Certified Payroll Admin" value={fmt(est.pwAdmCost)} />}
        </QSec>

        <div style={{ borderTop: '1px solid #2d3340', paddingTop: 12 }}>
          <R label="Direct Cost" value={fmt(est.direct)} />
        </div>
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 320 }}>
          <div><Lbl>Overhead %</Lbl><input type="number" value={ovhd} onChange={e => setOvhd(+e.target.value)} style={{ ...ci(80), marginTop: 6, display: 'block' }} /></div>
          <div><Lbl>Margin %</Lbl><input type="number" value={marg} onChange={e => setMarg(+e.target.value)} style={{ ...ci(80), marginTop: 6, display: 'block' }} /></div>
        </div>
        <div style={{ borderTop: '1px solid #2d3340', marginTop: 14, paddingTop: 12 }}>
          <R label={`Overhead (${ovhd}%)`} value={fmt(est.ovhdCost)} />
          <R label={`Margin (${marg}%)`} value={fmt(est.margCost)} />
        </div>
        <div style={{ borderTop: '2px solid #e85c26', marginTop: 16, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 14, color: '#edf0f4', fontWeight: 700 }}>TOTAL QUOTE</span>
          <span style={{ fontSize: 26, color: '#e85c26', fontWeight: 800 }}>{fmt(est.total)}</span>
        </div>
        <div style={{ marginTop: 5, textAlign: 'right', fontSize: 11, color: '#6b7280' }}>
          {est.totalTons > 0 ? fmtD(est.total / est.totalTons) + '/ton' : ''}
        </div>
      </div>
    </div>
  )
}
