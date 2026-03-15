import React from 'react';
import { ci, sel } from './constants.js';

export function SH({ title, sub }) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:700,color:"#e6edf3",letterSpacing:0.5,marginBottom:4}}>{title}</div>
      {sub && <div style={{fontSize:12,color:"#8b949e"}}>{sub}</div>}
    </div>
  );
}

export function SecLbl({ children }) {
  return <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:"#e6edf3",letterSpacing:0.5,marginBottom:14}}>{children}</div>;
}

export function QSec({ label, children }) {
  const kids = React.Children.toArray(children).filter(Boolean);
  if (!kids.length) return null;
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:10,fontWeight:700,color:"#8b949e",letterSpacing:2,textTransform:"uppercase",marginBottom:8,paddingBottom:6,borderBottom:"1px solid #21262d"}}>{label}</div>
      {kids}
    </div>
  );
}

export function R({ label, value, hi }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #21262d"}}>
      <span style={{fontSize:12,color:"#8b949e"}}>{label}</span>
      <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,color:hi?"#e6edf3":"#8b949e",fontWeight:hi?700:500}}>{value}</span>
    </div>
  );
}

export function Lbl({ children }) {
  return <div style={{fontSize:10,fontWeight:700,color:"#8b949e",letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>{children}</div>;
}

export function Note({ children, tight }) {
  return <div style={{marginTop:tight?6:12,fontSize:11,color:"#484f58",lineHeight:1.7,padding:"8px 12px",background:"#0d111788",borderRadius:6,border:"1px solid #21262d"}}>{children}</div>;
}

export function Badge({ color, text }) {
  return (
    <span style={{background:color+"22",border:`1px solid ${color}`,borderRadius:20,padding:"3px 12px",fontSize:10,color,letterSpacing:1.5,fontWeight:700,textTransform:"uppercase"}}>{text}</span>
  );
}

export function Chip({ color, text }) {
  return (
    <span style={{background:color+"22",border:`1px solid ${color}55`,borderRadius:20,padding:"2px 8px",fontSize:9,color,letterSpacing:1,fontWeight:700,textTransform:"uppercase"}}>{text}</span>
  );
}

export function Toggle({ value, onChange, large }) {
  const w=large?48:38, h=large?26:20, d=large?20:14;
  return (
    <div onClick={()=>onChange(!value)} style={{width:w,height:h,background:value?"#e85c26":"#30363d",borderRadius:h,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
      <div style={{position:"absolute",top:(h-d)/2,left:value?w-d-(h-d)/2:(h-d)/2,width:d,height:d,background:"#e6edf3",borderRadius:"50%",transition:"left 0.2s"}}/>
    </div>
  );
}

export function Btn({ children, onClick, color }) {
  return (
    <button onClick={onClick} style={{background:"#161b22",border:`1px solid ${color||"#30363d"}`,borderRadius:7,color:color||"#8b949e",padding:"8px 16px",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>
      {children}
    </button>
  );
}
