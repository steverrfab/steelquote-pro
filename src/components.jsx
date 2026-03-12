import React from 'react';
import { ci, sel } from './constants.js';

export function SH({ title, sub }) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{fontSize:15,color:"#edf0f4",fontWeight:700,marginBottom:4}}>{title}</div>
      <div style={{fontSize:11,color:"#6b7280"}}>{sub}</div>
    </div>
  );
}

export function SecLbl({ children }) {
  return <div style={{fontSize:10,color:"#e85c26",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>{children}</div>;
}

export function QSec({ label, children }) {
  const kids = React.Children.toArray(children).filter(Boolean);
  if (!kids.length) return null;
  return (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:9,color:"#6b7280",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{label}</div>
      {kids}
    </div>
  );
}

export function R({ label, value, hi }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #1a1f2b"}}>
      <span style={{fontSize:12,color:"#9ca3af"}}>{label}</span>
      <span style={{fontSize:12,color:hi?"#edf0f4":"#c8cdd6",fontWeight:hi?700:400}}>{value}</span>
    </div>
  );
}

export function Lbl({ children }) {
  return <div style={{fontSize:10,color:"#6b7280",letterSpacing:1.5,textTransform:"uppercase"}}>{children}</div>;
}

export function Note({ children, tight }) {
  return <div style={{marginTop:tight?6:12,fontSize:10,color:"#4b5563",lineHeight:1.6}}>{children}</div>;
}

export function Badge({ color, text }) {
  return (
    <div style={{background:color+"22",border:`1px solid ${color}`,borderRadius:4,padding:"4px 10px",fontSize:10,color,letterSpacing:2}}>
      {text}
    </div>
  );
}

export function Chip({ color, text }) {
  return (
    <span style={{background:color+"22",border:`1px solid ${color}55`,borderRadius:3,padding:"2px 6px",fontSize:9,color,letterSpacing:1}}>
      {text}
    </span>
  );
}

export function Toggle({ value, onChange, large }) {
  const w=large?48:38, h=large?26:20, d=large?20:14;
  return (
    <div onClick={()=>onChange(!value)} style={{
      width:w,height:h,background:value?"#7c3aed":"#1e2532",
      borderRadius:h,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0,
    }}>
      <div style={{
        position:"absolute",top:(h-d)/2,
        left:value?w-d-(h-d)/2:(h-d)/2,
        width:d,height:d,background:"#edf0f4",borderRadius:"50%",transition:"left 0.2s",
      }}/>
    </div>
  );
}

export function Btn({ children, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      background:"#1a2030",border:`1px solid ${color||"#2d3340"}`,borderRadius:6,
      color:color||"#c8cdd6",padding:"8px 14px",fontSize:10,cursor:"pointer",
      fontFamily:"inherit",letterSpacing:1,textTransform:"uppercase",
    }}>
      {children}
    </button>
  );
}
