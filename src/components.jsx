import React from 'react';
import { ci, sel } from './constants.js';

export function SH({ title, sub }) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:800,color:"#ffffff",letterSpacing:"1px",marginBottom:4}}>{title}</div>
      {sub && <div style={{fontSize:12,color:"#444444"}}>{sub}</div>}
    </div>
  );
}

export function SecLbl({ children }) {
  return <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:"#ffffff",letterSpacing:"0.5px",marginBottom:14,paddingBottom:8,borderBottom:"1px solid #1a1a1a"}}>{children}</div>;
}

export function QSec({ label, children }) {
  const kids = React.Children.toArray(children).filter(Boolean);
  if (!kids.length) return null;
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:10,fontWeight:700,color:"#444444",letterSpacing:"2px",textTransform:"uppercase",marginBottom:8,paddingBottom:6,borderBottom:"1px solid #1a1a1a"}}>{label}</div>
      {kids}
    </div>
  );
}

export function R({ label, value, hi }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #1a1a1a"}}>
      <span style={{fontSize:12,color:"#444444"}}>{label}</span>
      <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,color:hi?"#ffffff":"#888888",fontWeight:hi?700:500}}>{value}</span>
    </div>
  );
}

export function Lbl({ children }) {
  return <div style={{fontSize:10,fontWeight:700,color:"#444444",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:5}}>{children}</div>;
}

export function Note({ children, tight }) {
  return <div style={{marginTop:tight?6:12,fontSize:11,color:"#444444",lineHeight:1.7,padding:"8px 12px",background:"#0a0a0a",borderRadius:4,border:"1px solid #1a1a1a"}}>{children}</div>;
}

export function Badge({ color, text }) {
  return <span style={{background:color+"22",border:"1px solid "+color,borderRadius:4,padding:"3px 10px",fontSize:10,color,letterSpacing:"1.5px",fontWeight:700,textTransform:"uppercase"}}>{text}</span>;
}

export function Chip({ color, text }) {
  return <span style={{background:color+"22",border:"1px solid "+color+"55",borderRadius:4,padding:"2px 8px",fontSize:9,color,letterSpacing:"1px",fontWeight:700,textTransform:"uppercase"}}>{text}</span>;
}

export function Toggle({ value, onChange, large }) {
  const w=large?48:38, h=large?26:20, d=large?20:14;
  return (
    <div onClick={()=>onChange(!value)} style={{width:w,height:h,background:value?"#e85c26":"#222222",borderRadius:h,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0,border:"1px solid #333333"}}>
      <div style={{position:"absolute",top:(h-d)/2,left:value?w-d-(h-d)/2:(h-d)/2,width:d,height:d,background:"#ffffff",borderRadius:"50%",transition:"left 0.2s"}}/>
    </div>
  );
}

export function Btn({ children, onClick, color }) {
  return (
    <button onClick={onClick} style={{background:"transparent",border:"1px solid "+(color||"#333333"),borderRadius:4,color:color||"#888888",padding:"8px 16px",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",transition:"all 0.15s"}}>
      {children}
    </button>
  );
}
