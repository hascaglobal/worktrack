// @ts-nocheck
import { useState, useEffect, useRef } from "react";

const PRIORITIES=["Low","Medium","High","Urgent"];
const STATUSES=["To Do","In Progress","Done"];
const VIEWS=["My Day","Tasks","By Date","Ongoing","Timeline","Calendar","Time Log","Reports"];
const COLORS=["#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#ec4899","#8b5cf6","#14b8a6","#f97316","#84cc16"];
const TYPE_ICONS=["✅","🔄","🤝","🔍","📝","📊","🛠️","🚀","📞","🎯","💡","📋","⚙️","🧪","📌"];
const HOUR_H=64,START_H=6,TOTAL_H=18;

function today(){return new Date().toISOString().split("T")[0];}
function yesterday(){const d=new Date();d.setDate(d.getDate()-1);return d.toISOString().split("T")[0];}
function fmtDate(d){if(!d)return "";const[y,m,day]=d.split("-");return day+"/"+m+"/"+y;}
function addDays(n){const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().split("T")[0];}
function t2px(h,m){return((h-START_H)+m/60)*HOUR_H;}
function px2m(py){return Math.round((py/HOUR_H)*60/15)*15+START_H*60;}
function fmt(mins){return String(Math.floor(mins/60)).padStart(2,"0")+":"+String(mins%60).padStart(2,"0");}
function dInMonth(y,m){return new Date(y,m+1,0).getDate();}
function fDay(y,m){return new Date(y,m,1).getDay();}

const IT=[{id:1,name:"Task",color:"#6366f1",icon:"✅"},{id:2,name:"Ongoing",color:"#8b5cf6",icon:"🔄"},{id:3,name:"Meeting",color:"#f59e0b",icon:"🤝"},{id:4,name:"Review",color:"#3b82f6",icon:"🔍"}];
const IC=[{id:1,name:"Company A",color:"#6366f1",notes:""},{id:2,name:"Company B",color:"#10b981",notes:""}];
const ITA=[
  {id:1,title:"Review quarterly report",companyId:1,priority:"High",status:"In Progress",type:"Review",due:today(),notes:"",subtasks:[{id:1,title:"Read draft",done:false}],createdAt:Date.now()},
  {id:2,title:"Client meeting prep",companyId:2,priority:"Urgent",status:"To Do",type:"Meeting",due:today(),notes:"",subtasks:[],createdAt:Date.now(),timeStart:540,timeEnd:600},
];
const IL=[{id:1,companyId:1,hours:3,date:today(),note:"Design work",logStartH:9,logStartM:0},{id:2,companyId:2,hours:2,date:today(),note:"Client calls",logStartH:13,logStartM:0}];

function useLS(key,init){
  const keys=Array.isArray(key)?key:[key];
  const [val,setVal]=useState(()=>{try{for(const k of keys){const s=localStorage.getItem(k);if(s)return JSON.parse(s);}}catch{}return init;});
  useEffect(()=>{try{localStorage.setItem(keys[0],JSON.stringify(val));}catch{}},[val]);
  return [val,setVal];
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const css=`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body,#root{height:100%;font-family:'Inter',sans-serif;}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:99px;}
  ::-webkit-scrollbar-thumb:hover{background:#cbd5e1;}
  .app-bg{background:linear-gradient(135deg,#f8faff 0%,#f0f4ff 100%);min-height:100vh;}
  .sidebar{background:linear-gradient(180deg,#1e1b4b 0%,#312e81 100%);box-shadow:4px 0 24px rgba(99,102,241,0.15);}
  .sidebar-logo{background:rgba(255,255,255,0.08);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,0.08);}
  .nav-btn{color:rgba(255,255,255,0.6);transition:all 0.15s;border-radius:10px;padding:8px 10px;}
  .nav-btn:hover{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.9);}
  .nav-btn.active{background:rgba(255,255,255,0.15);color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.2);}
  .nav-section{color:rgba(255,255,255,0.3);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:0 10px;margin:16px 0 6px;}
  .admin-btn{background:rgba(255,255,255,0.06);border-top:1px solid rgba(255,255,255,0.08);}
  .header{background:rgba(255,255,255,0.85);backdrop-filter:blur(12px);border-bottom:1px solid rgba(99,102,241,0.1);box-shadow:0 1px 12px rgba(99,102,241,0.06);}
  .card{background:#fff;border:1px solid rgba(99,102,241,0.08);border-radius:14px;box-shadow:0 2px 12px rgba(99,102,241,0.06);transition:all 0.2s;}
  .card:hover{box-shadow:0 6px 24px rgba(99,102,241,0.12);transform:translateY(-1px);}
  .kpi-card{background:linear-gradient(135deg,#fff 0%,#f8faff 100%);border:1px solid rgba(99,102,241,0.1);border-radius:16px;box-shadow:0 4px 16px rgba(99,102,241,0.08);}
  .btn-primary{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(99,102,241,0.3);transition:all 0.15s;}
  .btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(99,102,241,0.4);}
  .pill{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;}
  .filter-pill{padding:5px 12px;border-radius:99px;font-size:12px;font-weight:500;cursor:pointer;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;transition:all 0.15s;}
  .filter-pill:hover{border-color:#a5b4fc;color:#6366f1;}
  .filter-pill.active{background:linear-gradient(135deg,#6366f1,#4f46e5);border-color:transparent;color:#fff;box-shadow:0 2px 8px rgba(99,102,241,0.3);}
  .modal-overlay{background:rgba(15,23,42,0.5);backdrop-filter:blur(4px);}
  .modal{background:#fff;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,0.15);border:1px solid rgba(99,102,241,0.1);}
  .input{border:1.5px solid #e2e8f0;border-radius:10px;padding:9px 13px;font-size:13px;font-family:'Inter',sans-serif;outline:none;width:100%;transition:all 0.15s;background:#fafbff;}
  .input:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,0.12);background:#fff;}
  .section-title{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;}
  .badge-co{font-size:11px;font-weight:600;padding:3px 9px;border-radius:99px;color:#fff;}
  .task-card{background:#fff;border:1px solid rgba(99,102,241,0.08);border-radius:14px;padding:14px;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 8px rgba(99,102,241,0.04);}
  .task-card:hover{box-shadow:0 8px 24px rgba(99,102,241,0.12);transform:translateY(-1px);border-color:rgba(99,102,241,0.2);}
  .time-grid-line{position:absolute;left:0;right:0;pointer-events:none;}
  .progress-bar{height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;}
  .progress-fill{height:100%;border-radius:99px;transition:width 0.3s;}
  input[type=range]{-webkit-appearance:none;width:100%;height:6px;background:#e2e8f0;border-radius:99px;outline:none;}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#4f46e5);cursor:pointer;box-shadow:0 2px 6px rgba(99,102,241,0.4);}
`;

function Timeline({tasks,logs,cos,date,setDate,onET,onEL,onNew}){
  const ref=useRef(null);const [drag,setDrag]=useState(null);const started=useRef(false);
  const gc=id=>cos.find(c=>c.id===id);
  const tlt=tasks.filter(t=>t.due===date&&t.timeStart!=null);
  const tll=logs.filter(l=>l.date===date);
  const uns=tasks.filter(t=>t.due===date&&t.timeStart==null);
  const pc={Low:"#10b981",Medium:"#3b82f6",High:"#f59e0b",Urgent:"#ef4444"};
  const md=e=>{if(!e.target.classList.contains("tlbg"))return;started.current=false;const py=e.clientY-ref.current.getBoundingClientRect().top+ref.current.scrollTop;const m=px2m(py);setDrag({s:m,e:m+15});};
  const mm=e=>{if(!drag)return;started.current=true;const py=e.clientY-ref.current.getBoundingClientRect().top+ref.current.scrollTop;setDrag(d=>({...d,e:px2m(py)}));};
  const mu=()=>{if(!drag)return;if(!started.current){setDrag(null);return;}const s=Math.min(drag.s,drag.e),e=Math.max(drag.s,drag.e)+15;setDrag(null);started.current=false;onNew({due:date,timeStart:s,timeEnd:Math.min(e,(START_H+TOTAL_H)*60)});};
  const np=date===today()?t2px(new Date().getHours(),new Date().getMinutes()):null;
  const dt=drag?t2px(Math.floor(Math.min(drag.s,drag.e)/60),Math.min(drag.s,drag.e)%60):0;
  const dh=drag?Math.abs(drag.e-drag.s)/60*HOUR_H+HOUR_H/4:0;
  const pd=n=>{const d=new Date(date);d.setDate(d.getDate()+n);setDate(d.toISOString().split("T")[0]);};
  return(
    <div style={{maxWidth:800,margin:"0 auto"}}>
      <style>{css}</style>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <button onClick={()=>pd(-1)} className="btn-primary" style={{padding:"7px 14px",fontSize:15}}>{"‹"}</button>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="input" style={{width:"auto",padding:"7px 13px"}}/>
        <button onClick={()=>pd(1)} className="btn-primary" style={{padding:"7px 14px",fontSize:15}}>{"›"}</button>
        <button onClick={()=>setDate(today())} style={{padding:"7px 16px",borderRadius:10,border:"1.5px solid rgba(99,102,241,0.3)",background:"rgba(99,102,241,0.06)",color:"#6366f1",fontWeight:600,fontSize:13,cursor:"pointer"}}>Today</button>
        <span style={{marginLeft:"auto",fontSize:12,color:"#94a3b8",fontStyle:"italic"}}>Drag to schedule a task</span>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
        {cos.map(c=><span key={c.id} className="pill" style={{background:c.color+"18",color:c.color,border:"1.5px solid "+c.color+"33"}}><span style={{width:6,height:6,borderRadius:"50%",background:c.color,display:"inline-block"}}/>{c.name}</span>)}
      </div>
      <div className="card" style={{overflow:"hidden",padding:0,display:"flex"}}>
        <div style={{width:52,flexShrink:0,background:"#fafbff",borderRight:"1px solid rgba(99,102,241,0.06)"}}>
          {Array.from({length:TOTAL_H+1},(_,i)=>(
            <div key={i} style={{height:HOUR_H,display:"flex",alignItems:"flex-start",paddingTop:3}}>
              <span style={{fontSize:10,color:"#94a3b8",width:"100%",textAlign:"right",paddingRight:8,fontWeight:500}}>{String(START_H+i).padStart(2,"0")+":00"}</span>
            </div>
          ))}
        </div>
        <div ref={ref} className="tlbg" onMouseDown={md} onMouseMove={mm} onMouseUp={mu} onMouseLeave={()=>{setDrag(null);started.current=false;}}
          style={{flex:1,position:"relative",height:TOTAL_H*HOUR_H,background:"#fff",cursor:"crosshair",userSelect:"none"}}>
          {Array.from({length:TOTAL_H+1},(_,i)=><div key={i} className="tlbg" style={{position:"absolute",top:i*HOUR_H,left:0,right:0,borderTop:i%2===0?"1px solid rgba(99,102,241,0.08)":"1px dashed rgba(99,102,241,0.04)",pointerEvents:"none"}}/>)}
          {np!=null&&np>0&&np<TOTAL_H*HOUR_H&&<div style={{position:"absolute",top:np,left:0,right:0,borderTop:"2px solid #ef4444",pointerEvents:"none",zIndex:10}}><div style={{position:"absolute",left:6,top:-5,width:8,height:8,borderRadius:"50%",background:"#ef4444",boxShadow:"0 0 0 3px rgba(239,68,68,0.2)"}}/></div>}
          {drag&&dh>4&&<div style={{position:"absolute",left:6,right:6,top:dt,height:dh,background:"rgba(99,102,241,0.08)",border:"2px dashed #6366f1",borderRadius:10,pointerEvents:"none",zIndex:20}}><span style={{position:"absolute",bottom:4,right:8,fontSize:10,color:"#6366f1",fontWeight:600}}>{fmt(Math.min(drag.s,drag.e))+" – "+fmt(Math.min(Math.max(drag.s,drag.e)+15,(START_H+TOTAL_H)*60))}</span></div>}
          {tll.map(l=>{const co=gc(l.companyId);const top2=t2px(l.logStartH??9,l.logStartM??0);const ht=(l.hours||1)*HOUR_H;return(
            <div key={l.id} onClick={()=>onEL(l)} style={{position:"absolute",left:6,right:6,top:top2,height:ht,background:(co?.color||"#6366f1")+"14",border:"1.5px solid "+(co?.color||"#6366f1")+"40",borderLeft:"3px solid "+(co?.color||"#6366f1"),borderRadius:10,padding:"6px 10px",cursor:"pointer",overflow:"hidden",zIndex:5}}>
              <div style={{fontSize:11,fontWeight:600,color:co?.color||"#6366f1"}}>{"⏱ "+(co?.name||"")+" — "+l.hours+"h"}</div>
              {l.note&&<div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{l.note}</div>}
            </div>
          );})}
          {tlt.map(t=>{const co=gc(t.companyId);const top2=t2px(Math.floor(t.timeStart/60),t.timeStart%60);const ht=Math.max(((t.timeEnd-t.timeStart)/60)*HOUR_H,28);return(
            <div key={t.id} onClick={()=>onET(t)} style={{position:"absolute",left:6,right:6,top:top2,height:ht,background:(co?.color||"#6366f1")+"18",borderLeft:"3px solid "+(co?.color||"#6366f1"),borderRadius:10,padding:"5px 10px",cursor:"pointer",overflow:"hidden",zIndex:6}}>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:pc[t.priority],flexShrink:0,display:"inline-block"}}/>
                <span style={{fontSize:12,fontWeight:600,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</span>
              </div>
              {ht>32&&<div style={{fontSize:10,color:"#64748b",marginTop:2}}>{fmt(t.timeStart)+" – "+fmt(t.timeEnd)}</div>}
            </div>
          );})}
        </div>
      </div>
      {uns.length>0&&<div style={{marginTop:16}}><p className="section-title" style={{marginBottom:10}}>Unscheduled for {fmtDate(date)}</p><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{uns.map(t=>{const co=gc(t.companyId);return(<div key={t.id} onClick={()=>onET(t)} style={{padding:"5px 12px",background:"#fff",border:"1.5px solid "+(co?.color||"#e2e8f0"),borderRadius:99,cursor:"pointer",fontSize:12,color:"#374151",display:"flex",alignItems:"center",gap:6,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}><span style={{width:7,height:7,borderRadius:"50%",background:co?.color||"#94a3b8",display:"inline-block"}}/>{t.title}</div>);})}</div></div>}
    </div>
  );
}

export default function App(){
  const [TT,setTT]=useLS("tt_v1",IT);
  const [cos,setCos]=useLS(["cos_v2","companies_v2","companies_v1","companies"],IC);
  const [tasks,setTasks]=useLS(["tasks_v2","tasks_v1","tasks"],ITA);
  const [logs,setLogs]=useLS(["logs_v2","timelogs_v2","timelogs_v1","timelogs"],IL);
  const [view,setView]=useState("My Day");
  const [modal,setModal]=useState(null);
  const [eTask,setETask]=useState(null);const [eCo,setECo]=useState(null);const [eLog,setELog]=useState(null);const [eTT,setETT]=useState(null);
  const [sb,setSb]=useState(true);const [rm,setRm]=useState(null);const [tlD,setTlD]=useState(today());
  const [calM,setCalM]=useState(new Date().getMonth());const [calY,setCalY]=useState(new Date().getFullYear());
  const [bdF,setBdF]=useState("all");const [bdC,setBdC]=useState("all");
  const [fCo,setFCo]=useState("all");const [fSt,setFSt]=useState("all");const [fPr,setFPr]=useState("all");
  const [fDt,setFDt]=useState("all");const [fFr,setFFr]=useState("");const [fTo,setFTo]=useState("");
  const [fSo,setFSo]=useState("due");const [fSe,setFSe]=useState("");
  const [rCo,setRCo]=useState("all");const [rTp,setRTp]=useState("all");const [rSt,setRSt]=useState("all");const [rPr,setRPr]=useState("all");
  const [rDt,setRDt]=useState("all");const [rFr,setRFr]=useState("");const [rTo,setRTo]=useState("");const [rRng,setRRng]=useState("all");

  const nid=a=>a.length?Math.max(...a.map(x=>x.id))+1:1;
  const gc=id=>cos.find(c=>c.id===id);const gt=n=>TT.find(t=>t.name===n);

  useEffect(()=>{if(!rm)return;const h=()=>setRm(null);document.addEventListener("click",h);return()=>document.removeEventListener("click",h);},[rm]);

  const todT=tasks.filter(t=>t.due===today()&&t.status!=="Done");
  const ovT=tasks.filter(t=>t.due&&t.due<today()&&t.status!=="Done");
  const todH=logs.filter(l=>l.date===today()).reduce((s,l)=>s+l.hours,0);

  const apDt=(due,rng,fr,to)=>{
    if(rng==="yesterday")return due===yesterday();
    if(rng==="today")return due===today();
    if(rng==="tomorrow")return due===addDays(1);
    if(rng==="week")return due&&due<=addDays(7);
    if(rng==="overdue")return due&&due<today();
    if(rng==="nodate")return !due;
    if(rng==="custom")return(!fr||due>=fr)&&(!to||due<=to);
    return true;
  };

  const fTasks=tasks.filter(t=>{
    if(fCo!=="all"&&t.companyId!==+fCo)return false;
    if(fSt!=="all"&&t.status!==fSt)return false;
    if(fPr!=="all"&&t.priority!==fPr)return false;
    if(fSe&&!t.title.toLowerCase().includes(fSe.toLowerCase()))return false;
    if(!apDt(t.due||"",fDt,fFr,fTo))return false;
    return true;
  }).sort((a,b)=>{
    if(fSo==="due")return(a.due||"9999")<(b.due||"9999")?-1:1;
    if(fSo==="priority")return PRIORITIES.indexOf(b.priority)-PRIORITIES.indexOf(a.priority);
    if(fSo==="status")return STATUSES.indexOf(a.status)-STATUSES.indexOf(b.status);
    return b.createdAt-a.createdAt;
  });

  const rTasks=tasks.filter(t=>{
    if(rCo!=="all"&&t.companyId!==+rCo)return false;
    if(rTp!=="all"&&t.type!==rTp)return false;
    if(rSt!=="all"&&t.status!==rSt)return false;
    if(rPr!=="all"&&t.priority!==rPr)return false;
    if(!apDt(t.due||"",rDt,rFr,rTo))return false;
    return true;
  });
  const rLogs=logs.filter(l=>{
    if(rCo!=="all"&&l.companyId!==+rCo)return false;
    const now=new Date();
    if(rRng==="today")return l.date===today();
    if(rRng==="week")return(now-new Date(l.date))/86400000<=7;
    if(rRng==="month")return l.date.startsWith(now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0"));
    return true;
  });
  const vCos=rCo==="all"?cos:cos.filter(c=>c.id===+rCo);
  const rHrs=vCos.map(c=>({...c,hours:rLogs.filter(l=>l.companyId===c.id).reduce((s,l)=>s+l.hours,0)}));
  const totRH=rHrs.reduce((s,c)=>s+c.hours,0);
  const maxRH=Math.max(...rHrs.map(c=>c.hours),1);
  const rDone=rTasks.filter(t=>t.status==="Done").length;
  const rPct=rTasks.length?Math.round(rDone/rTasks.length*100):0;

  const saveTask=t=>{if(t.id)setTasks(p=>p.map(x=>x.id===t.id?t:x));else setTasks(p=>[...p,{...t,id:nid(tasks),createdAt:Date.now()}]);setModal(null);setETask(null);};
  const delTask=id=>{setTasks(p=>p.filter(x=>x.id!==id));setModal(null);setETask(null);};
  const togSt=id=>setTasks(p=>p.map(t=>t.id===id?{...t,status:t.status==="Done"?"To Do":"Done"}:t));
  const resch=(id,d)=>setTasks(p=>p.map(t=>t.id===id?{...t,due:d}:t));
  const nxtD=id=>setTasks(p=>p.map(t=>{if(t.id!==id)return t;const b=t.due&&t.due>=today()?t.due:today();const d=new Date(b);d.setDate(d.getDate()+1);return{...t,due:d.toISOString().split("T")[0]};}));
  const saveCo=c=>{if(c.id)setCos(p=>p.map(x=>x.id===c.id?c:x));else setCos(p=>[...p,{...c,id:nid(cos)}]);setModal(null);setECo(null);};
  const delCo=id=>{setCos(p=>p.filter(c=>c.id!==id));setTasks(p=>p.filter(t=>t.companyId!==id));setLogs(p=>p.filter(l=>l.companyId!==id));setModal(null);};
  const saveLog=l=>{if(l.id)setLogs(p=>p.map(x=>x.id===l.id?l:x));else setLogs(p=>[...p,{...l,id:nid(logs)}]);setModal(null);setELog(null);};
  const delLog=id=>{setLogs(p=>p.filter(x=>x.id!==id));setModal(null);setELog(null);};
  const saveTT=tt=>{if(tt.id)setTT(p=>p.map(x=>x.id===tt.id?tt:x));else setTT(p=>[...p,{...tt,id:nid(TT)}]);setModal(null);setETT(null);};
  const delTT=id=>{setTT(p=>p.filter(t=>t.id!==id));setModal(null);setETT(null);};

  const prC=p=>p==="Urgent"?"#ef4444":p==="High"?"#f97316":p==="Medium"?"#6366f1":"#10b981";
  const stC=s=>s==="Done"?"#10b981":s==="In Progress"?"#f59e0b":"#64748b";
  const prBg=p=>p==="Urgent"?"rgba(239,68,68,0.1)":p==="High"?"rgba(249,115,22,0.1)":p==="Medium"?"rgba(99,102,241,0.1)":"rgba(16,185,129,0.1)";
  const stBg=s=>s==="Done"?"rgba(16,185,129,0.1)":s==="In Progress"?"rgba(245,158,11,0.1)":"rgba(100,116,139,0.1)";

  const PBadge=({p})=><span className="pill" style={{background:prBg(p),color:prC(p)}}>{p}</span>;
  const SBadge=({s})=><span className="pill" style={{background:stBg(s),color:stC(s)}}>{s}</span>;

  const exportPDF=()=>{
    const bdg=(lbl,col)=>"<span style='display:inline-block;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:600;background:"+col+"18;color:"+col+"'>"+lbl+"</span>";
    const fl=[rCo!=="all"&&"Company: "+(cos.find(c=>c.id===+rCo)?.name||""),rTp!=="all"&&"Type: "+rTp,rSt!=="all"&&"Status: "+rSt,rPr!=="all"&&"Priority: "+rPr,rDt!=="all"&&"Date: "+(rDt==="custom"?(rFr||"…")+" to "+(rTo||"…"):rDt),rRng!=="all"&&"Hours: "+rRng].filter(Boolean).join(" · ")||"All data";
    const bars=rHrs.map(c=>{const w=totRH?(c.hours/maxRH*100):0;const p2=totRH?Math.round(c.hours/totRH*100):0;return "<div style='display:flex;align-items:center;gap:12px;margin-bottom:12px'><div style='width:140px;font-size:12px;font-weight:500;color:#374151'>"+c.name+"</div><div style='flex:1;height:8px;background:#f1f5f9;border-radius:99px;overflow:hidden'><div style='width:"+w+"%;height:100%;background:"+c.color+";border-radius:99px'></div></div><div style='font-size:11px;color:#64748b;min-width:64px;text-align:right'>"+c.hours.toFixed(1)+"h ("+p2+"%)</div></div>";}).join("");
    const stB=STATUSES.map(s=>{const cnt=rTasks.filter(t=>t.status===s).length;return "<div style='flex:1;border:1px solid #e2e8f0;border-radius:12px;padding:14px;text-align:center'><div style='font-size:22px;font-weight:700;color:"+stC(s)+"'>"+cnt+"</div><div style='font-size:10px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:.06em'>"+s+"</div></div>";}).join("");
    const tR=rTasks.map((t,i)=>{const co=cos.find(c=>c.id===t.companyId);const tt=TT.find(x=>x.name===t.type);return "<tr><td style='padding:10px 12px;color:#94a3b8;font-size:11px'>"+(i+1)+"</td><td style='padding:10px 12px'><strong style='font-size:12px'>"+t.title+"</strong>"+(t.notes?"<div style='font-size:10px;color:#94a3b8;margin-top:2px'>"+t.notes+"</div>":"")+"</td><td style='padding:10px 12px'>"+(co?bdg(co.name,co.color):"—")+"</td><td style='padding:10px 12px'>"+(tt?bdg(tt.icon+" "+tt.name,tt.color):"—")+"</td><td style='padding:10px 12px'>"+bdg(t.priority,prC(t.priority))+"</td><td style='padding:10px 12px'>"+bdg(t.status,stC(t.status))+"</td><td style='padding:10px 12px;color:#64748b;font-size:12px'>"+(t.due?fmtDate(t.due):"—")+"</td></tr>";}).join("");
    const lR=[...rLogs].sort((a,b)=>b.date<a.date?-1:1).map(l=>{const co=cos.find(c=>c.id===l.companyId);return "<tr><td style='padding:10px 12px;color:#64748b;font-size:12px'>"+fmtDate(l.date)+"</td><td style='padding:10px 12px'>"+(co?bdg(co.name,co.color):"—")+"</td><td style='padding:10px 12px;font-weight:700;color:#374151'>"+l.hours+"h</td><td style='padding:10px 12px;color:#64748b;font-size:12px'>"+(l.note||"—")+"</td></tr>";}).join("");
    const css2="@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter',sans-serif;font-size:13px;color:#1e293b;padding:36px;background:#fff;}h1{font-size:22px;font-weight:700;background:linear-gradient(135deg,#6366f1,#4f46e5);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px;}.meta{font-size:11px;color:#94a3b8;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #f1f5f9;}h2{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;margin:28px 0 14px;padding-bottom:8px;border-bottom:1px solid #f1f5f9;}.kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:8px;}.kb{background:linear-gradient(135deg,#f8faff,#f0f4ff);border:1px solid rgba(99,102,241,0.12);border-radius:14px;padding:16px;text-align:center;}.kv{font-size:24px;font-weight:700;color:#6366f1;}.kl{font-size:10px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:.06em;}table{width:100%;border-collapse:collapse;font-size:12px;}th{text-align:left;padding:10px 12px;font-weight:600;color:#64748b;text-transform:uppercase;font-size:10px;letter-spacing:.06em;background:#f8faff;border-bottom:1px solid #e2e8f0;}tr:not(:last-child) td{border-bottom:1px solid #f8faff;}@media print{body{padding:16px}@page{margin:14mm}}";
    const html="<!DOCTYPE html><html><head><meta charset='utf-8'><title>WorkTrack Report</title><style>"+css2+"</style></head><body>"
      +"<h1>WorkTrack Report</h1>"
      +"<div class='meta'>Generated: "+new Date().toLocaleDateString("en-AE",{weekday:"long",year:"numeric",month:"long",day:"numeric"})+"&nbsp;&nbsp;·&nbsp;&nbsp;Filters: "+fl+"</div>"
      +"<div class='kpi'>"
      +"<div class='kb'><div class='kv'>"+totRH.toFixed(1)+"h</div><div class='kl'>Total Hours</div></div>"
      +"<div class='kb'><div class='kv'>"+rTasks.length+"</div><div class='kl'>Total Tasks</div></div>"
      +"<div class='kb'><div class='kv'>"+rDone+"</div><div class='kl'>Completed</div></div>"
      +"<div class='kb'><div class='kv'>"+rPct+"%</div><div class='kl'>Completion</div></div>"
      +"</div>"
      +"<h2>Hours per Company</h2>"+(bars||"<p style='color:#94a3b8;font-size:12px'>No hours logged.</p>")
      +"<h2>Tasks by Status</h2><div style='display:flex;gap:12px;margin-bottom:8px'>"+stB+"</div>"
      +"<h2>Task List ("+rTasks.length+")</h2>"+(rTasks.length===0?"<p style='color:#94a3b8'>No tasks match filters.</p>":"<table><thead><tr><th>#</th><th>Title</th><th>Company</th><th>Type</th><th>Priority</th><th>Status</th><th>Due</th></tr></thead><tbody>"+tR+"</tbody></table>")
      +"<h2>Time Logs ("+rLogs.length+")</h2>"+(rLogs.length===0?"<p style='color:#94a3b8'>No time logs match filters.</p>":"<table><thead><tr><th>Date</th><th>Company</th><th>Hours</th><th>Description</th></tr></thead><tbody>"+lR+"</tbody></table>")
      +"<scr"+"ipt>window.onload=function(){setTimeout(function(){window.print();},400);};<"+"/script></body></html>";
    const w=window.open("","_blank","width=900,height=700");if(!w){alert("Please allow popups.");return;}w.document.open();w.document.write(html);w.document.close();
  };

  const TCard=({t})=>{
    const co=gc(t.companyId),tt=gt(t.type);
    const ov=t.due&&t.due<today()&&t.status!=="Done";
    return(
      <div className="task-card" onClick={()=>{setETask(t);setModal("task");}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
          <button style={{marginTop:2,width:20,height:20,borderRadius:"50%",border:"2px solid",borderColor:t.status==="Done"?"#10b981":"#cbd5e1",background:t.status==="Done"?"#10b981":"transparent",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}
            onClick={e=>{e.stopPropagation();togSt(t.id);}}>
            {t.status==="Done"&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
          </button>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:13,fontWeight:600,color:t.status==="Done"?"#94a3b8":"#1e293b",textDecoration:t.status==="Done"?"line-through":"none",marginBottom:7,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,alignItems:"center"}}>
              {co&&<span className="pill badge-co" style={{background:co.color}}>{co.name}</span>}
              {tt&&<span className="pill" style={{background:tt.color+"18",color:tt.color}}>{tt.icon+" "+tt.name}</span>}
              <PBadge p={t.priority}/><SBadge s={t.status}/>
              {t.due&&<span style={{fontSize:11,fontWeight:500,color:ov?"#ef4444":"#94a3b8"}}>{"📅 "+fmtDate(t.due)}</span>}
              {t.timeStart!=null&&<span style={{fontSize:11,color:"#6366f1",fontWeight:500}}>{"⏰ "+fmt(t.timeStart)+(t.timeEnd!=null?" – "+fmt(t.timeEnd):"")}</span>}
              {t.subtasks?.length>0&&<span style={{fontSize:11,color:"#94a3b8"}}>{"☑ "+t.subtasks.filter(s=>s.done).length+"/"+t.subtasks.length}</span>}
            </div>
          </div>
          {t.status!=="Done"&&(
            <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
              <button style={{opacity:0,fontSize:11,padding:"4px 8px",borderRadius:8,background:"rgba(99,102,241,0.08)",color:"#6366f1",border:"none",cursor:"pointer",fontWeight:600,transition:"all 0.15s"}}
                className="move-btn"
                onClick={e=>{e.stopPropagation();setRm(rm?.id===t.id?null:{id:t.id});}}>{"📅 Move"}</button>
              {rm?.id===t.id&&(
                <div style={{position:"absolute",right:0,top:28,background:"#fff",border:"1px solid rgba(99,102,241,0.15)",borderRadius:16,boxShadow:"0 16px 40px rgba(0,0,0,0.12)",zIndex:40,padding:12,width:210}} onClick={e=>e.stopPropagation()}>
                  <p style={{fontSize:10,fontWeight:700,color:"#94a3b8",marginBottom:8,textTransform:"uppercase",letterSpacing:".08em"}}>Reschedule</p>
                  <button onClick={()=>{nxtD(t.id);setRm(null);}} style={{width:"100%",textAlign:"left",padding:"8px 10px",borderRadius:8,border:"none",background:"transparent",cursor:"pointer",fontSize:12,color:"#374151",display:"flex",alignItems:"center",gap:6}}>{"➡️ Tomorrow"}</button>
                  <button onClick={()=>{resch(t.id,addDays(7));setRm(null);}} style={{width:"100%",textAlign:"left",padding:"8px 10px",borderRadius:8,border:"none",background:"transparent",cursor:"pointer",fontSize:12,color:"#374151",display:"flex",alignItems:"center",gap:6}}>{"📆 Next Week"}</button>
                  <div style={{borderTop:"1px solid #f1f5f9",margin:"8px 0"}}/>
                  <p style={{fontSize:10,color:"#94a3b8",marginBottom:6,paddingLeft:2}}>Pick a date</p>
                  <input type="date" min={today()} defaultValue={t.due||today()} className="input" style={{fontSize:12,padding:"6px 10px"}}
                    onChange={e=>{if(e.target.value){resch(t.id,e.target.value);setRm(null);}}}/>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const DPills=({cur,set,fr,sfr,to,sto})=>(
    <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
      <span style={{fontSize:11,fontWeight:700,color:"#94a3b8",marginRight:2}}>{"📅 Date:"}</span>
      {[{k:"all",l:"All"},{k:"overdue",l:"⚠️ Overdue"},{k:"yesterday",l:"Yesterday"},{k:"today",l:"Today"},{k:"tomorrow",l:"Tomorrow"},{k:"week",l:"This Week"},{k:"nodate",l:"No Date"},{k:"custom",l:"Custom"}].map(o=>(
        <button key={o.k} onClick={()=>set(o.k)} className={"filter-pill"+(cur===o.k?" active":"")}>{o.l}</button>
      ))}
      {cur==="custom"&&<div style={{display:"flex",alignItems:"center",gap:6}}>
        <input type="date" value={fr} onChange={e=>sfr(e.target.value)} className="input" style={{width:"auto",padding:"5px 10px",fontSize:12}}/>
        <span style={{color:"#94a3b8",fontSize:12}}>{"→"}</span>
        <input type="date" value={to} onChange={e=>sto(e.target.value)} className="input" style={{width:"auto",padding:"5px 10px",fontSize:12}}/>
      </div>}
    </div>
  );

  const TaskModal=()=>{
    const blank={title:"",companyId:cos[0]?.id||"",priority:"Medium",status:"To Do",type:TT[0]?.name||"Task",due:today(),dueEnd:"",notes:"",subtasks:[],timeStart:null,timeEnd:null,progress:0,timeMode:"duration",durationHrs:1};
    const initForm=()=>{
      if(!eTask)return blank;
      const base={...blank,...eTask};
      if(eTask.timeStart!=null&&eTask.timeEnd!=null){base.durationHrs=parseFloat(((eTask.timeEnd-eTask.timeStart)/60).toFixed(2));base.timeMode=eTask.timeMode||"range";}
      else{base.timeMode=eTask.timeMode||"duration";base.durationHrs=eTask.durationHrs||1;}
      return base;
    };
    const [f,setF]=useState(initForm);
    const [ns,setNs]=useState("");
    const s=(k,v)=>setF(x=>({...x,[k]:v}));
    const aS=()=>{if(!ns.trim())return;s("subtasks",[...(f.subtasks||[]),{id:Date.now(),title:ns.trim(),done:false}]);setNs("");};
    const tS=id=>s("subtasks",f.subtasks.map(x=>x.id===id?{...x,done:!x.done}:x));
    const rS=id=>s("subtasks",f.subtasks.filter(x=>x.id!==id));
    const isO=f.type==="Ongoing";
    const lbl={fontSize:11,fontWeight:600,color:"#64748b",marginBottom:5,display:"block",textTransform:"uppercase",letterSpacing:".06em"};
    return(
      <div className="modal-overlay" style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}} onClick={()=>{setModal(null);setETask(null);}}>
        <div className="modal" style={{width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{padding:"20px 24px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,#f8faff,#f0f4ff)",borderRadius:"20px 20px 0 0"}}>
            <div><h2 style={{fontSize:16,fontWeight:700,color:"#1e293b"}}>{f.id?"Edit Task":"New Task"}</h2><p style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Fill in the details below</p></div>
            <button onClick={()=>{setModal(null);setETask(null);}} style={{width:32,height:32,borderRadius:"50%",border:"none",background:"rgba(0,0,0,0.06)",cursor:"pointer",fontSize:16,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center"}}>{"✕"}</button>
          </div>
          <div style={{padding:24,display:"flex",flexDirection:"column",gap:18}}>
            <div><label style={lbl}>Task Title</label><input className="input" placeholder="What needs to be done?" value={f.title} onChange={e=>s("title",e.target.value)} autoFocus style={{fontSize:14,fontWeight:500}}/></div>
            <div>
              <label style={lbl}>Task Type</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {TT.map(tt=>(
                  <button key={tt.id} type="button" onClick={()=>s("type",tt.name)}
                    style={{display:"flex",alignItems:"center",gap:5,padding:"6px 13px",borderRadius:99,fontSize:12,fontWeight:600,border:"1.5px solid",borderColor:f.type===tt.name?"transparent":tt.color+"44",background:f.type===tt.name?tt.color:"transparent",color:f.type===tt.name?"#fff":tt.color,cursor:"pointer",transition:"all 0.15s"}}>
                    {tt.icon+" "+tt.name}
                  </button>
                ))}
                <button type="button" onClick={()=>setModal("tasktype")}
                  style={{padding:"6px 13px",borderRadius:99,fontSize:12,fontWeight:600,border:"1.5px dashed #cbd5e1",background:"transparent",color:"#94a3b8",cursor:"pointer"}}>{"＋ New Type"}</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div><label style={lbl}>Company</label><select className="input" value={f.companyId} onChange={e=>s("companyId",+e.target.value)}>{cos.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label style={lbl}>{isO?"Start Date":"Due Date"}</label><input type="date" className="input" value={f.due||""} onChange={e=>s("due",e.target.value)}/></div>
              {isO&&<div><label style={lbl}>End Date</label><input type="date" className="input" value={f.dueEnd||""} onChange={e=>s("dueEnd",e.target.value)}/></div>}
              <div><label style={lbl}>Priority</label><select className="input" value={f.priority} onChange={e=>s("priority",e.target.value)}>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select></div>
              <div><label style={lbl}>Status</label><select className="input" value={f.status} onChange={e=>s("status",e.target.value)}>{STATUSES.map(x=><option key={x}>{x}</option>)}</select></div>
            </div>
            {isO&&<div><label style={lbl}>{"Progress — "+( f.progress||0)+"%"}</label><input type="range" min="0" max="100" step="5" value={f.progress||0} onChange={e=>s("progress",+e.target.value)}/></div>}
            {!isO&&<div style={{background:"#f8faff",borderRadius:14,padding:14,border:"1px solid rgba(99,102,241,0.08)"}}>
              <label style={lbl}>Time Entry</label>
              <div style={{display:"flex",borderRadius:10,overflow:"hidden",border:"1.5px solid #e2e8f0",marginBottom:14}}>
                {["duration","range"].map(m=>(
                  <button key={m} type="button" style={{flex:1,padding:"8px",fontSize:12,fontWeight:600,border:"none",cursor:"pointer",transition:"all 0.15s",background:(f.timeMode||"duration")===m?"linear-gradient(135deg,#6366f1,#4f46e5)":"#fff",color:(f.timeMode||"duration")===m?"#fff":"#64748b"}}
                    onClick={()=>{setF(p=>({...p,timeMode:m,timeStart:null,timeEnd:null,durationHrs:1}));}}>
                    {m==="duration"?"⏳ Duration":"🕐 Start & End"}
                  </button>
                ))}
              </div>
              {(f.timeMode||"duration")==="duration"?(
                <div>
                  <label style={lbl}>{"Duration — "}<span style={{color:"#6366f1",fontWeight:700}}>{(f.durationHrs??1)+"h"}</span></label>
                  <input type="range" min="0.25" max="12" step="0.25" value={f.durationHrs??1}
                    onChange={e=>{const h=+e.target.value;setF(p=>{const u={...p,durationHrs:h};if(p.timeStart!=null)u.timeEnd=Math.min(p.timeStart+Math.round(h*60),(START_H+TOTAL_H)*60);return u;});}}/>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#94a3b8",marginTop:5,marginBottom:12}}>{"15m 3h 6h 9h 12h".split(" ").map(x=><span key={x}>{x}</span>)}</div>
                  <label style={lbl}>{"Start Time "}<span style={{color:"#94a3b8",textTransform:"none",fontWeight:400}}>(optional)</span></label>
                  <input type="time" className="input" value={f.timeStart!=null?fmt(f.timeStart):""}
                    onChange={e=>{if(!e.target.value){setF(p=>({...p,timeStart:null,timeEnd:null}));return;}const[h,m]=e.target.value.split(":");const sv=+h*60+ +m;setF(p=>({...p,timeStart:sv,timeEnd:Math.min(sv+Math.round((p.durationHrs??1)*60),(START_H+TOTAL_H)*60)}));}}/>
                  {f.timeStart!=null&&f.timeEnd!=null&&<p style={{fontSize:12,color:"#6366f1",fontWeight:600,marginTop:8}}>{"⏰ "+fmt(f.timeStart)+" → "+fmt(f.timeEnd)+" ("+((f.timeEnd-f.timeStart)/60).toFixed(1)+"h)"}</p>}
                </div>
              ):(
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div><label style={lbl}>Start Time</label>
                      <input type="time" className="input" value={f.timeStart!=null?fmt(f.timeStart):""}
                        onChange={e=>{if(!e.target.value){setF(p=>({...p,timeStart:null,timeEnd:null,durationHrs:1}));return;}const[h,m]=e.target.value.split(":");const sv=+h*60+ +m;setF(p=>{const ne=p.timeEnd!=null&&p.timeEnd>sv?p.timeEnd:null;const dur=ne?parseFloat(((ne-sv)/60).toFixed(2)):p.durationHrs??1;return{...p,timeStart:sv,timeEnd:ne,durationHrs:dur};});}}/>
                    </div>
                    <div><label style={lbl}>End Time</label>
                      <input type="time" className="input" value={f.timeEnd!=null?fmt(f.timeEnd):""}
                        onChange={e=>{if(!e.target.value){setF(p=>({...p,timeEnd:null}));return;}const[h,m]=e.target.value.split(":");const ev=+h*60+ +m;setF(p=>{const dur=p.timeStart!=null&&ev>p.timeStart?parseFloat(((ev-p.timeStart)/60).toFixed(2)):p.durationHrs??1;return{...p,timeEnd:ev,durationHrs:dur};});}}/>
                    </div>
                  </div>
                  {f.timeStart!=null&&f.timeEnd!=null&&f.timeEnd>f.timeStart&&(
                    <div style={{marginTop:12}}>
                      <label style={lbl}>{"Duration — "}<span style={{color:"#6366f1",fontWeight:700}}>{ ((f.timeEnd-f.timeStart)/60).toFixed(1)+"h"}</span></label>
                      <input type="range" min="0.25" max="12" step="0.25" value={Math.min((f.timeEnd-f.timeStart)/60,12)}
                        onChange={e=>{const h=+e.target.value;setF(p=>{const u={...p,durationHrs:h};if(p.timeStart!=null)u.timeEnd=Math.min(p.timeStart+Math.round(h*60),(START_H+TOTAL_H)*60);return u;});}}/>
                      <p style={{fontSize:12,color:"#6366f1",fontWeight:600,marginTop:8}}>{"⏰ "+fmt(f.timeStart)+" → "+fmt(f.timeEnd)+" ("+((f.timeEnd-f.timeStart)/60).toFixed(1)+"h)"}</p>
                    </div>
                  )}
                </div>
              )}
            </div>}
            <div><label style={lbl}>Notes</label><textarea className="input" rows={2} placeholder="Add notes or context..." value={f.notes} onChange={e=>s("notes",e.target.value)} style={{resize:"none"}}/></div>
            <div>
              <label style={lbl}>Sub-tasks</label>
              <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:9}}>
                {(f.subtasks||[]).map(x=>(
                  <div key={x.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#f8faff",borderRadius:10}}>
                    <input type="checkbox" checked={x.done} onChange={()=>tS(x.id)} style={{accentColor:"#6366f1"}}/>
                    <span style={{fontSize:13,flex:1,color:x.done?"#94a3b8":"#374151",textDecoration:x.done?"line-through":"none"}}>{x.title}</span>
                    <button onClick={()=>rS(x.id)} style={{border:"none",background:"transparent",cursor:"pointer",color:"#cbd5e1",fontSize:13}}>{"✕"}</button>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <input className="input" placeholder="Add a sub-task..." value={ns} onChange={e=>setNs(e.target.value)} onKeyDown={e=>e.key==="Enter"&&aS()} style={{fontSize:13}}/>
                <button onClick={aS} className="btn-primary" style={{whiteSpace:"nowrap"}}>Add</button>
              </div>
            </div>
          </div>
          <div style={{padding:"16px 24px",borderTop:"1px solid #f1f5f9",display:"flex",gap:8,background:"#fafbff",borderRadius:"0 0 20px 20px"}}>
            {f.id&&<button onClick={()=>delTask(f.id)} style={{padding:"9px 16px",color:"#ef4444",background:"rgba(239,68,68,0.06)",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>Delete</button>}
            <div style={{flex:1}}/>
            <button onClick={()=>{setModal(null);setETask(null);}} style={{padding:"9px 18px",color:"#64748b",background:"#f1f5f9",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={()=>{if(!f.title.trim())return;saveTask({...f,timeMode:f.timeMode,durationHrs:f.durationHrs});}} className="btn-primary">Save Task</button>
          </div>
        </div>
      </div>
    );
  };

  const SimpleModal=({title,subtitle,children,onSave,onDelete,saveLabel})=>(
    <div className="modal-overlay" style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}} onClick={()=>setModal(null)}>
      <div className="modal" style={{width:"100%",maxWidth:420}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"20px 24px",borderBottom:"1px solid #f1f5f9",background:"linear-gradient(135deg,#f8faff,#f0f4ff)",borderRadius:"20px 20px 0 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><h2 style={{fontSize:15,fontWeight:700,color:"#1e293b"}}>{title}</h2>{subtitle&&<p style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{subtitle}</p>}</div>
          <button onClick={()=>setModal(null)} style={{width:32,height:32,borderRadius:"50%",border:"none",background:"rgba(0,0,0,0.06)",cursor:"pointer",fontSize:16,color:"#64748b"}}>{"✕"}</button>
        </div>
        <div style={{padding:24}}>{children}</div>
        <div style={{padding:"16px 24px",borderTop:"1px solid #f1f5f9",display:"flex",gap:8,background:"#fafbff",borderRadius:"0 0 20px 20px"}}>
          {onDelete&&<button onClick={onDelete} style={{padding:"9px 16px",color:"#ef4444",background:"rgba(239,68,68,0.06)",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>Delete</button>}
          <div style={{flex:1}}/>
          <button onClick={()=>setModal(null)} style={{padding:"9px 18px",color:"#64748b",background:"#f1f5f9",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button onClick={onSave} className="btn-primary">{saveLabel||"Save"}</button>
        </div>
      </div>
    </div>
  );

  const CoModal=()=>{
    const [f,setF]=useState(eCo||{name:"",color:COLORS[0],notes:""});
    const s=(k,v)=>setF(x=>({...x,[k]:v}));
    const lbl={fontSize:11,fontWeight:600,color:"#64748b",marginBottom:6,display:"block",textTransform:"uppercase",letterSpacing:".06em"};
    return(
      <SimpleModal title={f.id?"Edit Company":"New Company"} subtitle="Manage your client or employer" saveLabel={f.id?"Update":"Add Company"} onSave={()=>{if(!f.name.trim())return;saveCo(f);}} onDelete={f.id?()=>delCo(f.id):null}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><label style={lbl}>Company Name</label><input className="input" placeholder="e.g. Acme Corp" value={f.name} onChange={e=>s("name",e.target.value)} autoFocus/></div>
          <div><label style={lbl}>Brand Color</label><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{COLORS.map(c=><button key={c} onClick={()=>s("color",c)} style={{width:28,height:28,borderRadius:"50%",background:c,border:f.color===c?"3px solid #1e293b":"3px solid transparent",cursor:"pointer",transform:f.color===c?"scale(1.15)":"scale(1)",transition:"all 0.15s"}}/>)}</div></div>
          <div><label style={lbl}>Notes</label><textarea className="input" rows={2} placeholder="Optional notes..." value={f.notes} onChange={e=>s("notes",e.target.value)} style={{resize:"none"}}/></div>
        </div>
      </SimpleModal>
    );
  };

  const TTModal=()=>{
    const [f,setF]=useState(eTT||{name:"",color:COLORS[0],icon:"✅"});
    const s=(k,v)=>setF(x=>({...x,[k]:v}));
    const lbl={fontSize:11,fontWeight:600,color:"#64748b",marginBottom:6,display:"block",textTransform:"uppercase",letterSpacing:".06em"};
    return(
      <SimpleModal title={f.id?"Edit Task Type":"New Task Type"} subtitle="Create a custom category" saveLabel={f.id?"Update":"Create Type"} onSave={()=>{if(!f.name.trim())return;saveTT(f);}} onDelete={f.id?()=>delTT(f.id):null}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><label style={lbl}>Type Name</label><input className="input" placeholder="e.g. Bug Fix, Research..." value={f.name} onChange={e=>s("name",e.target.value)} autoFocus/></div>
          <div><label style={lbl}>Icon</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{TYPE_ICONS.map(ic=><button key={ic} onClick={()=>s("icon",ic)} style={{width:34,height:34,borderRadius:10,fontSize:16,border:f.icon===ic?"2px solid #6366f1":"2px solid transparent",background:f.icon===ic?"rgba(99,102,241,0.08)":"#f8faff",cursor:"pointer",transition:"all 0.15s"}}>{ic}</button>)}</div></div>
          <div><label style={lbl}>Color</label><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{COLORS.map(c=><button key={c} onClick={()=>s("color",c)} style={{width:28,height:28,borderRadius:"50%",background:c,border:f.color===c?"3px solid #1e293b":"3px solid transparent",cursor:"pointer",transform:f.color===c?"scale(1.15)":"scale(1)",transition:"all 0.15s"}}/>)}</div></div>
          {f.name&&<div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:11,color:"#94a3b8"}}>Preview:</span><span className="pill" style={{background:f.color+"18",color:f.color,border:"1.5px solid "+f.color+"33"}}>{f.icon+" "+f.name}</span></div>}
        </div>
      </SimpleModal>
    );
  };

  const LogModal=()=>{
    const [f,setF]=useState(eLog||{companyId:cos[0]?.id||"",hours:"",date:today(),note:"",logStartH:9,logStartM:0});
    const s=(k,v)=>setF(x=>({...x,[k]:v}));
    const lbl={fontSize:11,fontWeight:600,color:"#64748b",marginBottom:6,display:"block",textTransform:"uppercase",letterSpacing:".06em"};
    return(
      <SimpleModal title={f.id?"Edit Time Log":"Log Hours"} subtitle="Track your work hours" saveLabel={f.id?"Update":"Log Hours"} onSave={()=>{if(!f.hours||!f.companyId)return;saveLog(f);}} onDelete={f.id?()=>delLog(f.id):null}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><label style={lbl}>Company</label><select className="input" value={f.companyId} onChange={e=>s("companyId",+e.target.value)}>{cos.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={lbl}>Hours</label><input type="number" step="0.5" min="0" max="24" className="input" placeholder="e.g. 3.5" value={f.hours} onChange={e=>s("hours",+e.target.value)}/></div>
            <div><label style={lbl}>Date</label><input type="date" className="input" value={f.date} onChange={e=>s("date",e.target.value)}/></div>
            <div><label style={lbl}>Start Time</label><input type="time" className="input" value={String(f.logStartH??9).padStart(2,"0")+":"+String(f.logStartM??0).padStart(2,"0")} onChange={e=>{const[h,m]=e.target.value.split(":");s("logStartH",+h);s("logStartM",+m);}}/></div>
            <div><label style={lbl}>Description</label><input className="input" placeholder="What did you work on?" value={f.note} onChange={e=>s("note",e.target.value)}/></div>
          </div>
        </div>
      </SimpleModal>
    );
  };

  const CalView=()=>{
    const days=dInMonth(calY,calM),first=fDay(calY,calM);
    const ms=calY+"-"+String(calM+1).padStart(2,"0");
    const MN=["January","February","March","April","May","June","July","August","September","October","November","December"];
    return(
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <button onClick={()=>{if(calM===0){setCalM(11);setCalY(y=>y-1);}else setCalM(m=>m-1);}} className="btn-primary" style={{padding:"7px 14px",fontSize:15}}>{"‹"}</button>
          <h3 style={{fontSize:16,fontWeight:700,color:"#1e293b"}}>{MN[calM]+" "+calY}</h3>
          <button onClick={()=>{if(calM===11){setCalM(0);setCalY(y=>y+1);}else setCalM(m=>m+1);}} className="btn-primary" style={{padding:"7px 14px",fontSize:15}}>{"›"}</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>{["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#94a3b8",letterSpacing:".06em",padding:"4px 0"}}>{d}</div>)}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
          {Array(first).fill(null).map((_,i)=><div key={"e"+i}/>)}
          {Array(days).fill(null).map((_,i)=>{
            const d=i+1,ds=ms+"-"+String(d).padStart(2,"0");
            const dt=tasks.filter(t=>t.due===ds);
            const isT=ds===today();
            return(
              <div key={d} style={{minHeight:68,padding:6,borderRadius:10,border:"1px solid",borderColor:isT?"#6366f1":"rgba(99,102,241,0.06)",background:isT?"rgba(99,102,241,0.06)":"#fff",cursor:"pointer",transition:"all 0.15s"}}
                onClick={()=>{setETask({due:ds,companyId:cos[0]?.id,priority:"Medium",status:"To Do",type:TT[0]?.name,subtasks:[],timeStart:null,timeEnd:null});setModal("task");}}>
                <div style={{fontSize:11,fontWeight:700,marginBottom:3,color:isT?"#6366f1":"#64748b"}}>{d}</div>
                {dt.slice(0,2).map(t=>{const co=gc(t.companyId);return <div key={t.id} style={{fontSize:10,padding:"2px 5px",borderRadius:5,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"#fff",fontWeight:500,background:co?.color||"#6366f1"}} onClick={e=>{e.stopPropagation();setETask(t);setModal("task");}}>{t.title}</div>;})}
                {dt.length>2&&<div style={{fontSize:9,color:"#94a3b8",fontWeight:600}}>{"+"+(dt.length-2)+" more"}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const OngView=()=>{
    const ong=tasks.filter(t=>t.type==="Ongoing");
    const act=ong.filter(t=>t.status!=="Done"),don=ong.filter(t=>t.status==="Done");
    const dB=(a,b)=>{if(!a||!b)return null;return Math.ceil((new Date(b)-new Date(a))/86400000)+1;};
    const dP=s=>{if(!s)return 0;return Math.max(0,Math.ceil((new Date(today())-new Date(s))/86400000));};
    const gP=t=>{const tot=dB(t.due,t.dueEnd);if(!tot)return t.progress||0;return t.progress!=null?t.progress:Math.min(Math.round((dP(t.due)/tot)*100),99);};
    const OC=({t})=>{
      const co=gc(t.companyId),tot=dB(t.due,t.dueEnd);
      const rem=t.dueEnd?Math.ceil((new Date(t.dueEnd)-new Date(today()))/86400000):null;
      const p=gP(t),pC=p>=80?"#10b981":p>=40?"#f59e0b":"#6366f1";
      const ov=t.dueEnd&&t.dueEnd<today()&&t.status!=="Done";
      return(
        <div className="card" style={{padding:18,cursor:"pointer",borderLeft:ov?"4px solid #ef4444":"4px solid "+(co?.color||"#6366f1")}} onClick={()=>{setETask(t);setModal("task");}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
            <button style={{marginTop:2,width:20,height:20,borderRadius:"50%",border:"2px solid",borderColor:t.status==="Done"?"#10b981":"#cbd5e1",background:t.status==="Done"?"#10b981":"transparent",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
              onClick={e=>{e.stopPropagation();togSt(t.id);}}>
              {t.status==="Done"&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
            </button>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:8}}>
                <p style={{fontSize:14,fontWeight:700,color:t.status==="Done"?"#94a3b8":"#1e293b",textDecoration:t.status==="Done"?"line-through":"none"}}>{t.title}</p>
                <PBadge p={t.priority}/><SBadge s={t.status}/>
                {ov&&<span className="pill" style={{background:"rgba(239,68,68,0.1)",color:"#ef4444"}}>{"⚠️ Overdue"}</span>}
              </div>
              {co&&<span className="pill badge-co" style={{background:co.color,marginBottom:10,display:"inline-flex"}}>{co.name}</span>}
              <div style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:"#94a3b8",marginBottom:8}}>
                <span>{"📅 "+fmtDate(t.due)}</span>
                <div style={{flex:1,borderTop:"1px dashed #e2e8f0"}}/>
                <span style={{color:rem!=null&&rem<0?"#ef4444":"#94a3b8"}}>{t.dueEnd?"📅 "+fmtDate(t.dueEnd):"No end date"}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                <div className="progress-bar" style={{flex:1}}><div className="progress-fill" style={{width:Math.min(p,100)+"%",background:pC}}/></div>
                <span style={{fontSize:12,fontWeight:700,color:pC,minWidth:36}}>{p+"%"}</span>
              </div>
              <div style={{display:"flex",gap:12,fontSize:11,color:"#94a3b8"}}>
                {tot&&<span>{"⏳ "+tot+" day"+(tot!==1?"s":"")}</span>}
                {rem!=null&&t.status!=="Done"&&<span style={{color:rem<0?"#ef4444":rem<=2?"#f97316":"#94a3b8",fontWeight:rem<=2?600:400}}>{rem<0?Math.abs(rem)+"d overdue":rem===0?"Due today!":rem+"d left"}</span>}
              </div>
              {t.status!=="Done"&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}} onClick={e=>e.stopPropagation()}>
                <span style={{fontSize:11,color:"#94a3b8",fontWeight:500}}>Progress:</span>
                <input type="range" min="0" max="100" step="5" value={t.progress??gP(t)} style={{flex:1}} onChange={e=>setTasks(p=>p.map(x=>x.id===t.id?{...x,progress:+e.target.value}:x))}/>
                <span style={{fontSize:11,color:"#64748b",fontWeight:600,minWidth:32}}>{(t.progress??gP(t))+"%"}</span>
              </div>}
            </div>
          </div>
        </div>
      );
    };
    return(
      <div style={{maxWidth:680,margin:"0 auto",display:"flex",flexDirection:"column",gap:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",gap:10}}>
            <span className="pill" style={{background:"rgba(139,92,246,0.1)",color:"#8b5cf6",fontSize:12,padding:"5px 12px"}}>{"🔄 "+act.length+" Active"}</span>
            <span className="pill" style={{background:"rgba(16,185,129,0.1)",color:"#10b981",fontSize:12,padding:"5px 12px"}}>{"✅ "+don.length+" Done"}</span>
          </div>
          <button onClick={()=>{setETask({type:"Ongoing",due:today(),dueEnd:"",companyId:cos[0]?.id,priority:"Medium",status:"In Progress",subtasks:[],progress:0});setModal("task");}} className="btn-primary">{"+ New Ongoing"}</button>
        </div>
        {ong.length===0&&<div style={{textAlign:"center",padding:64,color:"#94a3b8"}}><div style={{fontSize:48,marginBottom:12}}>{"🔄"}</div><div style={{fontSize:14}}>No ongoing tasks yet</div></div>}
        {act.length>0&&<div style={{display:"flex",flexDirection:"column",gap:10}}>{act.map(t=><OC key={t.id} t={t}/>)}</div>}
        {don.length>0&&<div><p className="section-title" style={{marginBottom:12}}>Completed</p><div style={{display:"flex",flexDirection:"column",gap:10}}>{don.map(t=><OC key={t.id} t={t}/>)}</div></div>}
      </div>
    );
  };

  const BDView=()=>{
    const grouped={},add=(label,ts)=>{if(ts.length)grouped[label]=ts;};
    const all=tasks.filter(t=>{if(bdC!=="all"&&t.companyId!==+bdC)return false;if(bdF==="pending"&&t.status==="Done")return false;if(bdF==="done"&&t.status!=="Done")return false;return true;});
    const tS=addDays(1),wS=addDays(7);
    const lG={};all.filter(t=>t.due&&t.due>wS).forEach(t=>{if(!lG[t.due])lG[t.due]=[];lG[t.due].push(t);});
    add("⚠️ Overdue",all.filter(t=>t.due&&t.due<today()).sort((a,b)=>a.due<b.due?-1:1));
    add("☀️ Today",all.filter(t=>t.due===today()));
    add("🌅 Tomorrow",all.filter(t=>t.due===tS));
    add("📅 This Week",all.filter(t=>t.due&&t.due>tS&&t.due<=wS));
    Object.keys(lG).sort().forEach(d=>add("📆 "+fmtDate(d),lG[d]));
    add("📌 No Due Date",all.filter(t=>!t.due));
    return(
      <div style={{maxWidth:680,margin:"0 auto",display:"flex",flexDirection:"column",gap:24}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
          <select className="input" style={{width:"auto",padding:"6px 12px",fontSize:13}} value={bdC} onChange={e=>setBdC(e.target.value)}><option value="all">All Companies</option>{cos.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
          {["all","pending","done"].map(f=><button key={f} onClick={()=>setBdF(f)} className={"filter-pill"+(bdF===f?" active":"")}>{f==="all"?"All":f==="pending"?"Pending":"Completed"}</button>)}
          <span style={{fontSize:12,color:"#94a3b8",marginLeft:"auto",fontWeight:500}}>{all.length+" tasks"}</span>
        </div>
        {Object.keys(grouped).length===0&&<div style={{textAlign:"center",padding:64,color:"#94a3b8"}}><div style={{fontSize:48,marginBottom:12}}>{"🗓️"}</div><div>No tasks found</div></div>}
        {Object.entries(grouped).map(([label,ts])=>{const ov=label.startsWith("⚠️");return(
          <div key={label}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <span style={{fontSize:13,fontWeight:700,color:ov?"#ef4444":"#374151"}}>{label}</span>
              <span className="pill" style={{background:ov?"rgba(239,68,68,0.1)":"rgba(99,102,241,0.08)",color:ov?"#ef4444":"#6366f1",fontSize:11}}>{ts.length}</span>
              <div style={{flex:1,height:1,background:"linear-gradient(to right,rgba(99,102,241,0.1),transparent)"}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>{ts.map(t=><TCard key={t.id} t={t}/>)}</div>
          </div>
        );})}
      </div>
    );
  };

  const RptView=()=>{
    const sc=s=>s==="Done"?"#10b981":s==="In Progress"?"#f59e0b":"#64748b";
    return(
      <div style={{display:"flex",flexDirection:"column",gap:20}}>
        <div className="card" style={{padding:20}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:14}}>
            {[{v:rCo,s:setRCo,opts:[{value:"all",label:"All Companies"},...cos.map(c=>({value:c.id,label:c.name}))]},{v:rTp,s:setRTp,opts:[{value:"all",label:"All Types"},...TT.map(t=>({value:t.name,label:t.icon+" "+t.name}))]},{v:rSt,s:setRSt,opts:[{value:"all",label:"All Status"},...STATUSES.map(s=>({value:s,label:s}))]},{v:rPr,s:setRPr,opts:[{value:"all",label:"All Priority"},...PRIORITIES.map(p=>({value:p,label:p}))]}].map((sel,i)=>(
              <select key={i} className="input" style={{width:"auto",padding:"6px 12px",fontSize:13}} value={sel.v} onChange={e=>sel.s(e.target.value)}>{sel.opts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
            ))}
            <button onClick={exportPDF} className="btn-primary" style={{marginLeft:"auto"}}>{"📄 Export PDF"}</button>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
            <span style={{fontSize:11,fontWeight:700,color:"#94a3b8",marginRight:2,alignSelf:"center"}}>{"⏱ Hours:"}</span>
            {["today","week","month","all"].map(r=><button key={r} onClick={()=>setRRng(r)} className={"filter-pill"+(rRng===r?" active":"")} style={{textTransform:"capitalize"}}>{r}</button>)}
          </div>
          <DPills cur={rDt} set={setRDt} fr={rFr} sfr={setRFr} to={rTo} sto={setRTo}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
          {[{v:totRH.toFixed(1)+"h",l:"Total Hours",c:"#6366f1"},{v:rTasks.length,l:"Tasks",c:"#374151"},{v:rDone,l:"Completed",c:"#10b981"},{v:rPct+"%",l:"Completion",c:"#f97316"}].map(k=>(
            <div key={k.l} className="kpi-card" style={{padding:18,textAlign:"center"}}>
              <div style={{fontSize:26,fontWeight:700,color:k.c,lineHeight:1}}>{k.v}</div>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:5,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em"}}>{k.l}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{padding:20}}>
          <p className="section-title" style={{marginBottom:16}}>Hours per Company</p>
          {rHrs.every(c=>c.hours===0)?<div style={{textAlign:"center",padding:24,color:"#94a3b8",fontSize:13}}>No hours logged</div>:<div style={{display:"flex",flexDirection:"column",gap:12}}>{rHrs.map(c=>(
            <div key={c.id}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}><span style={{fontWeight:600,color:"#374151"}}>{c.name}</span><span style={{color:"#94a3b8"}}>{c.hours.toFixed(1)+"h ("+( totRH?Math.round(c.hours/totRH*100):0)+"%)"}</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{width:(c.hours/maxRH*100)+"%",background:c.color}}/></div>
            </div>
          ))}</div>}
        </div>
        <div className="card" style={{padding:20}}>
          <p className="section-title" style={{marginBottom:16}}>Tasks by Status</p>
          <div style={{display:"flex",gap:12}}>{STATUSES.map(s=>{const cnt=rTasks.filter(t=>t.status===s).length;return <div key={s} style={{flex:1,textAlign:"center",padding:16,background:stBg(s),borderRadius:12}}><div style={{fontSize:22,fontWeight:700,color:sc(s)}}>{cnt}</div><div style={{fontSize:11,color:sc(s),marginTop:4,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em"}}>{s}</div></div>;})}</div>
        </div>
        <div className="card" style={{padding:20}}>
          <p className="section-title" style={{marginBottom:14}}>Tasks by Type</p>
          {TT.map(tt=>{const cnt=rTasks.filter(t=>t.type===tt.name).length;const dc=rTasks.filter(t=>t.type===tt.name&&t.status==="Done").length;return(
            <div key={tt.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f1f5f9"}}>
              <span style={{fontSize:16}}>{tt.icon}</span><div style={{width:8,height:8,borderRadius:"50%",background:tt.color}}/><span style={{flex:1,fontSize:13,fontWeight:500,color:"#374151"}}>{tt.name}</span>
              <span className="pill" style={{background:tt.color+"18",color:tt.color}}>{dc+"/"+cnt+" done"}</span>
            </div>
          );})}
        </div>
        <div className="card" style={{overflow:"hidden",padding:0}}>
          <div style={{padding:"14px 20px",borderBottom:"1px solid #f1f5f9",background:"#fafbff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <p style={{fontSize:13,fontWeight:700,color:"#374151"}}>Task List</p>
            <span className="pill" style={{background:"rgba(99,102,241,0.08)",color:"#6366f1"}}>{rTasks.length+" tasks"}</span>
          </div>
          {rTasks.length===0?<div style={{textAlign:"center",padding:40,color:"#94a3b8",fontSize:13}}>No tasks match filters</div>:(
            <div>{rTasks.map(t=>{const co=gc(t.companyId);const tt=gt(t.type);const ov=t.due&&t.due<today()&&t.status!=="Done";return(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 20px",borderBottom:"1px solid #f8faff",cursor:"pointer",transition:"background 0.15s"}} onClick={()=>{setETask(t);setModal("task");}}>
                <div style={{width:14,height:14,borderRadius:"50%",border:"2px solid",borderColor:t.status==="Done"?"#10b981":"#cbd5e1",background:t.status==="Done"?"#10b981":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {t.status==="Done"&&<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span style={{fontSize:13,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:t.status==="Done"?"#94a3b8":"#1e293b",textDecoration:t.status==="Done"?"line-through":"none",fontWeight:500}}>{t.title}</span>
                {co&&<span className="pill badge-co" style={{background:co.color,flexShrink:0}}>{co.name}</span>}
                {tt&&<span className="pill" style={{background:tt.color+"18",color:tt.color,flexShrink:0}}>{tt.icon}</span>}
                {t.due&&<span style={{fontSize:11,color:ov?"#ef4444":"#94a3b8",flexShrink:0,fontWeight:ov?600:400}}>{fmtDate(t.due)}</span>}
              </div>
            );})}
            </div>
          )}
        </div>
      </div>
    );
  };

  const vI={"My Day":"☀️",Tasks:"✅","By Date":"🗓️",Ongoing:"🔄",Timeline:"⏰",Calendar:"📅","Time Log":"⏱️",Reports:"📊"};
  const S={display:"flex",height:"100vh",overflow:"hidden"};

  return(
    <div style={S}>
      <style>{css}</style>
      {/* Sidebar */}
      <div className="sidebar" style={{width:sb?224:60,flexShrink:0,display:"flex",flexDirection:"column",transition:"width 0.2s"}}>
        <div className="sidebar-logo" style={{padding:"14px 12px",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setSb(o=>!o)} style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.1)",border:"none",cursor:"pointer",color:"#fff",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{"☰"}</button>
          {sb&&<div><div style={{fontSize:14,fontWeight:800,color:"#fff",letterSpacing:".02em"}}>WorkTrack</div><div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:500,letterSpacing:".06em",textTransform:"uppercase"}}>Pro</div></div>}
        </div>
        <nav style={{flex:1,padding:"12px 8px",overflowY:"auto",display:"flex",flexDirection:"column",gap:2}}>
          {sb&&<p className="nav-section">Main</p>}
          {VIEWS.map(v=>(
            <button key={v} onClick={()=>setView(v)} className={"nav-btn"+(view===v?" active":"")} style={{width:"100%",display:"flex",alignItems:"center",gap:10,border:"none",cursor:"pointer",textAlign:"left",fontSize:13,fontWeight:500}}>
              <span style={{fontSize:16,flexShrink:0,width:22,textAlign:"center"}}>{vI[v]}</span>
              {sb&&<span>{v}</span>}
            </button>
          ))}
          {sb&&<p className="nav-section" style={{marginTop:16}}>Companies</p>}
          {!sb&&<div style={{height:1,background:"rgba(255,255,255,0.08)",margin:"8px 4px"}}/>}
          {cos.map(c=>(
            <button key={c.id} onClick={()=>setView("Admin Settings")} className="nav-btn" style={{width:"100%",display:"flex",alignItems:"center",gap:10,border:"none",cursor:"pointer",fontSize:12,fontWeight:500}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:c.color,flexShrink:0,marginLeft:6}}/>
              {sb&&<span style={{color:"rgba(255,255,255,0.7)"}}>{c.name}</span>}
            </button>
          ))}
        </nav>
        <div className="admin-btn" style={{padding:8}}>
          <button onClick={()=>setView("Admin Settings")} className={"nav-btn"+(view==="Admin Settings"?" active":"")} style={{width:"100%",display:"flex",alignItems:"center",gap:10,border:"none",cursor:"pointer",fontSize:13,fontWeight:500}}>
            <span style={{fontSize:16,flexShrink:0,width:22,textAlign:"center"}}>{"⚙️"}</span>
            {sb&&<span>Admin Settings</span>}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"linear-gradient(135deg,#f8faff 0%,#f0f4ff 100%)"}}>
        {/* Header */}
        <div className="header" style={{padding:"14px 24px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:0}}>
            <h1 style={{fontSize:17,fontWeight:700,color:"#1e293b"}}>{view}</h1>
            {view==="My Day"&&<p style={{fontSize:12,color:"#94a3b8",marginTop:1}}>{new Date().toLocaleDateString("en-AE",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>}
          </div>
          {view==="Tasks"&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                <input className="input" style={{width:140,padding:"6px 12px",fontSize:13}} placeholder="🔍 Search..." value={fSe} onChange={e=>setFSe(e.target.value)}/>
                {[{v:fCo,s:setFCo,opts:[{value:"all",label:"All Companies"},...cos.map(c=>({value:c.id,label:c.name}))]},{v:fSt,s:setFSt,opts:[{value:"all",label:"All Status"},...STATUSES.map(s=>({value:s,label:s}))]},{v:fPr,s:setFPr,opts:[{value:"all",label:"All Priority"},...PRIORITIES.map(p=>({value:p,label:p}))]},{v:fSo,s:setFSo,opts:[{value:"due",label:"Sort: Due"},{value:"priority",label:"Sort: Priority"},{value:"status",label:"Sort: Status"},{value:"created",label:"Sort: Created"}]}].map((sel,i)=>(
                  <select key={i} className="input" style={{width:"auto",padding:"6px 12px",fontSize:13}} value={sel.v} onChange={e=>sel.s(e.target.value)}>{sel.opts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
                ))}
              </div>
              <DPills cur={fDt} set={setFDt} fr={fFr} sfr={setFFr} to={fTo} sto={setFTo}/>
              <span style={{fontSize:11,color:"#94a3b8",fontWeight:500}}>{fTasks.length+" task"+(fTasks.length!==1?"s":"")}</span>
            </div>
          )}
          {["My Day","Tasks","By Date","Timeline"].includes(view)&&(
            <button onClick={()=>{setETask(null);setModal("task");}} className="btn-primary">{"+ New Task"}</button>
          )}
          {view==="Time Log"&&(
            <button onClick={()=>{setELog(null);setModal("log");}} className="btn-primary">{"+ Log Hours"}</button>
          )}
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:24}}>
          {view==="My Day"&&(
            <div style={{maxWidth:700,margin:"0 auto",display:"flex",flexDirection:"column",gap:20}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                {[{v:todT.length,l:"Tasks Today",c:"#6366f1",bg:"rgba(99,102,241,0.08)"},{v:ovT.length,l:"Overdue",c:"#ef4444",bg:"rgba(239,68,68,0.06)"},{v:todH.toFixed(1)+"h",l:"Hours Today",c:"#10b981",bg:"rgba(16,185,129,0.06)"}].map(k=>(
                  <div key={k.l} className="kpi-card" style={{padding:20,textAlign:"center"}}>
                    <div style={{fontSize:28,fontWeight:800,color:k.c}}>{k.v}</div>
                    <div style={{fontSize:11,color:"#94a3b8",marginTop:5,fontWeight:600,textTransform:"uppercase",letterSpacing:".08em"}}>{k.l}</div>
                  </div>
                ))}
              </div>
              {ovT.length>0&&<div><p style={{fontSize:13,fontWeight:700,color:"#ef4444",marginBottom:10}}>{"⚠️ Overdue Tasks"}</p><div style={{display:"flex",flexDirection:"column",gap:8}}>{ovT.map(t=><TCard key={t.id} t={t}/>)}</div></div>}
              <div>
                <p className="section-title" style={{marginBottom:12}}>{"Today's Tasks"}</p>
                {todT.length===0?<div style={{textAlign:"center",padding:40,color:"#94a3b8",fontSize:13,background:"#fff",borderRadius:14,border:"1px dashed #e2e8f0"}}>{"🎉 All clear for today!"}</div>:<div style={{display:"flex",flexDirection:"column",gap:8}}>{todT.map(t=><TCard key={t.id} t={t}/>)}</div>}
              </div>
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <p className="section-title">{"Today's Time"}</p>
                  <button onClick={()=>{setELog(null);setModal("log");}} style={{fontSize:12,color:"#6366f1",fontWeight:600,background:"rgba(99,102,241,0.08)",border:"none",borderRadius:8,padding:"5px 12px",cursor:"pointer"}}>{"+ Log Hours"}</button>
                </div>
                {logs.filter(l=>l.date===today()).length===0?<div style={{textAlign:"center",padding:32,color:"#94a3b8",fontSize:13,background:"#fff",borderRadius:14,border:"1px dashed #e2e8f0"}}>No time logged today yet</div>
                  :<div style={{display:"flex",flexDirection:"column",gap:8}}>{logs.filter(l=>l.date===today()).map(l=>{const co=gc(l.companyId);return(
                    <div key={l.id} className="card" style={{padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}} onClick={()=>{setELog(l);setModal("log");}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:co?.color,flexShrink:0}}/>
                      <span style={{fontSize:13,fontWeight:600,color:"#374151",flex:1}}>{co?.name}</span>
                      <span style={{fontSize:15,fontWeight:800,color:co?.color}}>{l.hours+"h"}</span>
                      {l.note&&<span style={{fontSize:12,color:"#94a3b8",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.note}</span>}
                    </div>
                  );})}
                </div>}
              </div>
            </div>
          )}
          {view==="Tasks"&&<div style={{maxWidth:700,margin:"0 auto"}}>{fTasks.length===0?<div style={{textAlign:"center",padding:64,color:"#94a3b8"}}><div style={{fontSize:48,marginBottom:12}}>{"📋"}</div><div style={{fontSize:14}}>No tasks found</div></div>:<div style={{display:"flex",flexDirection:"column",gap:8}}>{fTasks.map(t=><TCard key={t.id} t={t}/>)}</div>}</div>}
          {view==="By Date"&&<BDView/>}
          {view==="Ongoing"&&<OngView/>}
          {view==="Timeline"&&<Timeline tasks={tasks} logs={logs} cos={cos} date={tlD} setDate={setTlD} onET={t=>{setETask(t);setModal("task");}} onEL={l=>{setELog(l);setModal("log");}} onNew={t=>{setETask({...t,companyId:cos[0]?.id,priority:"Medium",status:"To Do",type:TT[0]?.name,subtasks:[],title:"",timeMode:"range"});setModal("task");}}/>}
          {view==="Calendar"&&<div style={{maxWidth:820,margin:"0 auto"}} className="card" style={{padding:24}}><CalView/></div>}
          {view==="Time Log"&&(
            <div style={{maxWidth:700,margin:"0 auto",display:"flex",flexDirection:"column",gap:16}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
                {cos.map(c=>{const h=logs.filter(l=>l.companyId===c.id&&l.date===today()).reduce((s,l)=>s+l.hours,0);const tot=logs.filter(l=>l.companyId===c.id).reduce((s,l)=>s+l.hours,0);return(
                  <div key={c.id} className="kpi-card" style={{padding:18,borderLeft:"4px solid "+c.color}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><div style={{width:10,height:10,borderRadius:"50%",background:c.color}}/><span style={{fontSize:13,fontWeight:700,color:"#374151"}}>{c.name}</span></div>
                    <div style={{fontSize:24,fontWeight:800,color:c.color}}>{h+"h"}<span style={{fontSize:12,color:"#94a3b8",fontWeight:400,marginLeft:5}}>today</span></div>
                    <div style={{fontSize:11,color:"#94a3b8",marginTop:4,fontWeight:500}}>{tot+"h total logged"}</div>
                  </div>
                );})}
              </div>
              {[...new Set(logs.map(l=>l.date))].sort((a,b)=>b<a?-1:1).map(date=>(
                <div key={date}>
                  <p className="section-title" style={{marginBottom:10}}>{date===today()?"Today — "+fmtDate(date):fmtDate(date)}</p>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>{logs.filter(l=>l.date===date).map(l=>{const co=gc(l.companyId);return(
                    <div key={l.id} className="card" style={{padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}} onClick={()=>{setELog(l);setModal("log");}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:co?.color,flexShrink:0}}/>
                      <span style={{fontSize:13,fontWeight:600,color:"#374151",flex:1}}>{co?.name}</span>
                      <span style={{fontSize:12,color:"#94a3b8",flex:1}}>{l.note}</span>
                      <span style={{fontSize:15,fontWeight:800,color:co?.color}}>{l.hours+"h"}</span>
                    </div>
                  );})}</div>
                </div>
              ))}
              {logs.length===0&&<div style={{textAlign:"center",padding:64,color:"#94a3b8"}}><div style={{fontSize:48,marginBottom:12}}>{"⏱️"}</div><div style={{fontSize:14}}>No time logged yet</div></div>}
            </div>
          )}
          {view==="Reports"&&<div style={{maxWidth:720,margin:"0 auto"}}><RptView/></div>}
          {view==="Admin Settings"&&(
            <div style={{maxWidth:700,margin:"0 auto",display:"flex",flexDirection:"column",gap:24}}>
              {[{title:"🏢 Companies",sub:"Manage the companies you work for",items:cos,onAdd:()=>{setECo(null);setModal("company");},addLabel:"+ Add Company",renderItem:(c)=>{
                const tc=tasks.filter(t=>t.companyId===c.id).length;const lh=logs.filter(l=>l.companyId===c.id).reduce((s,l)=>s+l.hours,0);
                return(<div key={c.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",borderBottom:"1px solid #f8faff",cursor:"pointer",transition:"background 0.15s"}} onClick={()=>{setECo(c);setModal("company");}}>
                  <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,"+c.color+","+c.color+"cc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:16,flexShrink:0}}>{c.name.charAt(0)}</div>
                  <div style={{flex:1}}><p style={{fontSize:14,fontWeight:600,color:"#1e293b"}}>{c.name}</p><p style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{tc+" tasks · "+lh+"h logged"+(c.notes?" · "+c.notes:"")}</p></div>
                  <span style={{fontSize:12,color:"#94a3b8",fontWeight:500}}>{"Edit →"}</span>
                </div>);
              }},{title:"🏷️ Task Types",sub:"Customize categories for your tasks",items:TT,onAdd:()=>{setETT(null);setModal("tasktype");},addLabel:"+ Add Type",renderItem:(tt)=>{
                const cnt=tasks.filter(t=>t.type===tt.name).length;
                return(<div key={tt.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",borderBottom:"1px solid #f8faff",cursor:"pointer",transition:"background 0.15s"}} onClick={()=>{setETT(tt);setModal("tasktype");}}>
                  <div style={{width:40,height:40,borderRadius:12,background:tt.color+"18",border:"1.5px solid "+tt.color+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{tt.icon}</div>
                  <div style={{flex:1}}><p style={{fontSize:14,fontWeight:600,color:"#1e293b"}}>{tt.name}</p><p style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{cnt+" task"+(cnt!==1?"s":"")}</p></div>
                  <span className="pill" style={{background:tt.color+"18",color:tt.color,border:"1px solid "+tt.color+"33"}}>{tt.icon+" "+tt.name}</span>
                  <span style={{fontSize:12,color:"#94a3b8",fontWeight:500,marginLeft:8}}>{"Edit →"}</span>
                </div>);
              }}].map(sec=>(
                <div key={sec.title} className="card" style={{padding:0,overflow:"hidden"}}>
                  <div style={{padding:"16px 20px",borderBottom:"1px solid #f1f5f9",background:"linear-gradient(135deg,#f8faff,#f0f4ff)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div><h2 style={{fontSize:15,fontWeight:700,color:"#1e293b"}}>{sec.title}</h2><p style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{sec.sub}</p></div>
                    <button onClick={sec.onAdd} className="btn-primary" style={{fontSize:12,padding:"7px 14px"}}>{sec.addLabel}</button>
                  </div>
                  <div>{sec.items.length===0?<div style={{textAlign:"center",padding:32,color:"#94a3b8",fontSize:13}}>Nothing here yet</div>:sec.items.map(sec.renderItem)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal==="tasktype"&&<TTModal/>}
      {modal==="task"&&<TaskModal/>}
      {modal==="company"&&<CoModal/>}
      {modal==="log"&&<LogModal/>}
      <style>{`.task-card:hover .move-btn{opacity:1!important;}`}</style>
    </div>
  );
}