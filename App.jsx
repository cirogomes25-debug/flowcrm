import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, off } from "firebase/database";

// ===== FIREBASE =====
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FB_KEY,
  authDomain:        import.meta.env.VITE_FB_DOMAIN,
  databaseURL:       import.meta.env.VITE_FB_URL,
  projectId:         import.meta.env.VITE_FB_PROJECT,
  storageBucket:     import.meta.env.VITE_FB_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_SENDER,
  appId:             import.meta.env.VITE_FB_APP,
};
let db = null;
try { const app = initializeApp(firebaseConfig); db = getDatabase(app); } catch(e) { console.warn("Firebase:", e.message); }
const fbSet = (path, data) => { if (!db) return; set(ref(db, `crm/${path}`), data).catch(console.error); };
const fbListen = (path, cb) => {
  if (!db) return () => {};
  const r = ref(db, `crm/${path}`);
  onValue(r, snap => cb(snap.val()));
  return () => off(r);
};
const toArr = v => v ? (Array.isArray(v) ? v : Object.values(v)) : null;

// ===== THEME =====
const C = {
  bg:"#0c0f1a", s1:"#131929", s2:"#1b2237", s3:"#222d44",
  border:"#2a3654", accent:"#00c9a7",
  indigo:"#6366f1", amber:"#f59e0b", red:"#ef4444", green:"#10b981",
  text:"#e8edf5", muted:"#7b8ca4", dim:"#3d4f6a", purple:"#a855f7"
};
const STAGES = ["Lead","Qualificado","Proposta","Negociação","Ganho","Perdido"];
const SC = { Lead:"#6366f1", Qualificado:"#3b82f6", Proposta:"#f59e0b", Negociação:"#a855f7", Ganho:"#10b981", Perdido:"#ef4444" };
const PIPE_STAGES = ["Lead","Qualificado","Proposta","Negociação","Ganho"];
const SDR_COLORS = ["#00c9a7","#6366f1","#f59e0b","#ec4899","#10b981","#3b82f6","#a855f7","#ef4444"];
const g = () => Math.random().toString(36).slice(2,9);
const fmtBRL = v => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(v||0);
const fmtD = d => d ? new Date(d+"T12:00").toLocaleDateString("pt-BR") : "-";
const fmtDT = d => d ? new Date(d).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}) : "-";
const tod = () => new Date().toISOString().split("T")[0];

// ===== DEMO DATA =====
const SDRS0 = [
  {id:"sdr1",name:"Carlos Almeida",initials:"CA",color:"#00c9a7",email:"carlos@empresa.com",meta:50000},
  {id:"sdr2",name:"Marina Silva",initials:"MS",color:"#6366f1",email:"marina@empresa.com",meta:45000},
  {id:"sdr3",name:"Rafael Gomes",initials:"RG",color:"#f59e0b",email:"rafael@empresa.com",meta:40000},
];
const CONTACTS0 = [
  {id:"c1",name:"Ana Silva",email:"ana@techcorp.com",phone:"11999887766",company:"TechCorp",stage:"Qualificado",tags:["hot","enterprise"],value:45000,source:"LinkedIn",createdAt:"2024-01-10",lastContact:"2024-01-22",notes:"Decisora principal",score:92,assignedTo:"sdr1"},
  {id:"c2",name:"Bruno Costa",email:"bruno@startup.io",phone:"21988776655",company:"StartupIO",stage:"Proposta",tags:["warm"],value:12000,source:"Site",createdAt:"2024-01-05",lastContact:"2024-01-20",notes:"Aguardando proposta",score:68,assignedTo:"sdr2"},
  {id:"c3",name:"Carla Mendes",email:"carla@bigco.com",phone:"11977665544",company:"BigCo",stage:"Negociação",tags:["vip","enterprise"],value:85000,source:"Indicação",createdAt:"2023-12-20",lastContact:"2024-01-21",notes:"Negociando desconto",score:88,assignedTo:"sdr1"},
  {id:"c4",name:"Diego Ferreira",email:"diego@agencia.com",phone:"31966554433",company:"Agência F",stage:"Lead",tags:["cold"],value:8000,source:"WhatsApp",createdAt:"2024-01-18",lastContact:"2024-01-18",notes:"Primeiro contato",score:30,assignedTo:"sdr3"},
  {id:"c5",name:"Eduarda Lima",email:"edu@fintech.br",phone:"41955443322",company:"FinTech BR",stage:"Ganho",tags:["vip"],value:120000,source:"LinkedIn",createdAt:"2023-11-15",lastContact:"2024-01-15",notes:"Contrato assinado",score:100,assignedTo:"sdr2"},
  {id:"c6",name:"Felipe Santos",email:"felipe@varejo.com",phone:"51944332211",company:"Varejo Plus",stage:"Proposta",tags:["warm"],value:22000,source:"E-mail",createdAt:"2024-01-08",lastContact:"2024-01-19",notes:"Pediu referências",score:72,assignedTo:"sdr1"},
  {id:"c7",name:"Gabriela Rocha",email:"gabi@saude.org",phone:"61933221100",company:"Saúde Ativa",stage:"Qualificado",tags:["hot"],value:35000,source:"Indicação",createdAt:"2024-01-12",lastContact:"2024-01-23",notes:"Reunião marcada",score:85,assignedTo:"sdr3"},
  {id:"c8",name:"Henrique Alves",email:"h@construtora.com",phone:"11922110099",company:"Construtora HA",stage:"Lead",tags:["cold"],value:15000,source:"Site",createdAt:"2024-01-20",lastContact:"2024-01-20",notes:"Lead via formulário",score:25,assignedTo:"sdr2"},
  {id:"c9",name:"Isabela Torres",email:"isa@edu.br",phone:"11911009988",company:"EduTech",stage:"Perdido",tags:["cold"],value:18000,source:"E-mail",createdAt:"2023-12-10",lastContact:"2024-01-05",notes:"Escolheu concorrente",score:10,assignedTo:"sdr3"},
  {id:"c10",name:"João Neves",email:"joao@industria.com",phone:"21900998877",company:"IndusCo",stage:"Negociação",tags:["warm","enterprise"],value:67000,source:"LinkedIn",createdAt:"2024-01-02",lastContact:"2024-01-22",notes:"Decisão até fim do mês",score:78,assignedTo:"sdr1"},
];
const FU0 = [
  {id:"f1",contactId:"c1",type:"reunião",title:"Demo do produto",dueDate:tod(),completed:false,priority:"alta",assignedTo:"sdr1"},
  {id:"f2",contactId:"c3",type:"ligação",title:"Negociação final",dueDate:tod(),completed:false,priority:"alta",assignedTo:"sdr1"},
  {id:"f3",contactId:"c2",type:"e-mail",title:"Enviar proposta",dueDate:tod(),completed:false,priority:"média",assignedTo:"sdr2"},
  {id:"f4",contactId:"c7",type:"whatsapp",title:"Confirmar reunião",dueDate:tod(),completed:false,priority:"média",assignedTo:"sdr3"},
  {id:"f5",contactId:"c4",type:"ligação",title:"Qualificação inicial",dueDate:tod(),completed:false,priority:"baixa",assignedTo:"sdr3"},
];
const ACTS0 = [
  {id:"a1",type:"deal",desc:"Lead criado: Ana Silva",cId:"c1",ts:new Date().toISOString(),sdrId:"sdr1"},
  {id:"a2",type:"call",desc:"Ligação com Carla Mendes",cId:"c3",ts:new Date().toISOString(),sdrId:"sdr1"},
  {id:"a3",type:"won",desc:"🎉 Contrato fechado: Eduarda Lima!",cId:"c5",ts:new Date().toISOString(),sdrId:"sdr2"},
];

// ===== SHARED COMPONENTS =====
function Btn({onClick,v="p",sz="m",st={},dis,children}){
  const vs={p:{background:C.accent,color:"#0c0f1a",border:"none"},s:{background:C.s3,color:C.text,border:`1px solid ${C.border}`},d:{background:C.red,color:"#fff",border:"none"},g:{background:"transparent",color:C.muted,border:`1px solid ${C.border}`}};
  const ss={s:{padding:"4px 10px",fontSize:12},m:{padding:"7px 15px",fontSize:13},l:{padding:"10px 20px",fontSize:14}};
  return <button onClick={onClick} disabled={dis} style={{...vs[v],...ss[sz],borderRadius:8,fontWeight:600,cursor:dis?"not-allowed":"pointer",opacity:dis?.5:1,transition:"all .15s",...st}}>{children}</button>;
}
function Card({children,st={}}){return <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:12,padding:20,...st}}>{children}</div>;}
function Modal({title,children,onClose,w=540}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:16,padding:24,width:w,maxHeight:"88vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{color:C.text,fontSize:16,fontWeight:700,margin:0}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer",lineHeight:1}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Field({label,children}){return <div style={{marginBottom:13}}><label style={{display:"block",color:C.muted,fontSize:11,fontWeight:600,marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>{label}</label>{children}</div>;}
function Inp({value,onChange,placeholder,type="text",st={}}){return <input type={type} value={value||""} onChange={onChange} placeholder={placeholder} style={{width:"100%",background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",...st}}/>;}
function Sel({value,onChange,children,st={}}){return <select value={value||""} onChange={onChange} style={{width:"100%",background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",...st}}>{children}</select>;}
function StageBadge({stage}){return <span style={{background:(SC[stage]||C.indigo)+"22",color:SC[stage]||C.indigo,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>{stage}</span>;}
function ScorePill({score}){const c=score>=80?C.green:score>=60?C.amber:score>=40?C.indigo:C.muted;return <span style={{background:c+"22",color:c,borderRadius:6,padding:"2px 7px",fontSize:11,fontWeight:700}}>{score}</span>;}
function SdrAvatar({sdr,size=28}){
  if(!sdr)return null;
  return <div title={sdr.name} style={{width:size,height:size,borderRadius:"50%",background:sdr.color+"33",border:`2px solid ${sdr.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.38,fontWeight:700,color:sdr.color,flexShrink:0}}>{sdr.initials}</div>;
}

// ===== CONTACT DETAIL MODAL =====
function ContactDetail({contact,contacts,followUps,setFollowUps,activities,setActivities,sdrs,onClose,setContacts,currentSdr}){
  const [tab,setTab]=useState("resumo");
  const [note,setNote]=useState("");
  const [notes,setNotes]=useState(()=>{try{return JSON.parse(localStorage.getItem("notes_"+contact.id)||"[]");}catch{return[];}});
  const [editStage,setEditStage]=useState(false);
  const cFU=followUps.filter(f=>f.contactId===contact.id);
  const cActs=activities.filter(a=>a.cId===contact.id);
  const sdr=sdrs.find(s=>s.id===contact.assignedTo);
  const addNote=()=>{
    if(!note.trim())return;
    const n={id:g(),text:note,ts:new Date().toISOString(),sdrId:currentSdr?.id};
    const upd=[n,...notes];
    setNotes(upd);
    localStorage.setItem("notes_"+contact.id,JSON.stringify(upd));
    setActivities(p=>[{id:g(),type:"note",desc:`📝 Nota adicionada em ${contact.name}`,cId:contact.id,ts:new Date().toISOString(),sdrId:currentSdr?.id},...p]);
    setNote("");
  };
  const changeStage=s=>{
    setContacts(p=>p.map(c=>c.id===contact.id?{...c,stage:s,lastContact:tod()}:c));
    setActivities(p=>[{id:g(),type:"deal",desc:`${contact.name} → ${s}`,cId:contact.id,ts:new Date().toISOString(),sdrId:currentSdr?.id},...p]);
    setEditStage(false);
  };
  const typeI={deal:"🤝",call:"📞",email:"📧",whatsapp:"💬",note:"📝",won:"🏆"};
  const tabs=[["resumo","Resumo"],["followups",`Follow-ups (${cFU.length})`],["atividades",`Atividades (${cActs.length})`],["notas",`Notas (${notes.length})`]];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:18,width:620,maxHeight:"88vh",overflowY:"auto"}}>
        <div style={{padding:"20px 24px 14px",borderBottom:`1px solid ${C.border}`,background:C.s2,borderRadius:"18px 18px 0 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div style={{display:"flex",gap:11,alignItems:"center"}}>
              <div style={{width:46,height:46,borderRadius:"50%",background:C.accent+"22",border:`2px solid ${C.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:700,color:C.accent}}>{contact.name[0]}</div>
              <div><div style={{color:C.text,fontSize:17,fontWeight:700}}>{contact.name}</div><div style={{color:C.muted,fontSize:13}}>{contact.company} • {contact.email}</div></div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>✕</button>
          </div>
          <div style={{display:"flex",gap:9,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
            <div style={{position:"relative"}}>
              <button onClick={()=>setEditStage(p=>!p)} style={{background:(SC[contact.stage]||C.indigo)+"22",color:SC[contact.stage]||C.indigo,border:`1px solid ${SC[contact.stage]||C.indigo}44`,borderRadius:7,padding:"4px 10px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{contact.stage} ▾</button>
              {editStage&&<div style={{position:"absolute",top:"100%",left:0,background:C.s2,border:`1px solid ${C.border}`,borderRadius:9,marginTop:4,overflow:"hidden",zIndex:10,minWidth:130}}>{STAGES.map(s=><button key={s} onClick={()=>changeStage(s)} style={{width:"100%",padding:"7px 12px",background:"transparent",border:"none",color:SC[s]||C.text,fontSize:12,fontWeight:600,cursor:"pointer",textAlign:"left",borderBottom:`1px solid ${C.border}`}}>{s}</button>)}</div>}
            </div>
            <span style={{color:C.accent,fontWeight:700,fontSize:13}}>{fmtBRL(contact.value)}</span>
            <ScorePill score={contact.score||0}/>
            {sdr&&<div style={{display:"flex",alignItems:"center",gap:5}}><SdrAvatar sdr={sdr} size={18}/><span style={{color:C.muted,fontSize:11}}>{sdr.name.split(" ")[0]}</span></div>}
          </div>
          <div style={{display:"flex",gap:7}}>
            <a href={`https://wa.me/55${(contact.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{background:"#25D36620",color:"#25D366",borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:600,textDecoration:"none"}}>💬 WhatsApp</a>
            <a href={`mailto:${contact.email}`} style={{background:C.indigo+"20",color:C.indigo,borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:600,textDecoration:"none"}}>📧 E-mail</a>
            <a href={`tel:${contact.phone}`} style={{background:C.s3,color:C.muted,borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:600,textDecoration:"none"}}>📞 Ligar</a>
          </div>
        </div>
        <div style={{display:"flex",gap:2,padding:"7px 24px 0",background:C.s2,borderBottom:`1px solid ${C.border}`}}>
          {tabs.map(([v,l])=><button key={v} onClick={()=>setTab(v)} style={{padding:"7px 13px",background:"transparent",border:"none",borderBottom:`2px solid ${tab===v?C.accent:"transparent"}`,color:tab===v?C.accent:C.muted,cursor:"pointer",fontSize:12.5,fontWeight:600,transition:"all .15s"}}>{l}</button>)}
        </div>
        <div style={{padding:22}}>
          {tab==="resumo"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {[["📧 E-mail",contact.email],["📞 Telefone",contact.phone||"-"],["🏢 Empresa",contact.company||"-"],["🌐 Origem",contact.source||"-"],["📅 Criado",fmtD(contact.createdAt)],["🕐 Últ. contato",fmtD(contact.lastContact)]].map(([l,v])=>(
                  <div key={l} style={{background:C.s2,borderRadius:8,padding:"9px 12px"}}><div style={{color:C.muted,fontSize:11,marginBottom:2}}>{l}</div><div style={{color:C.text,fontSize:13,fontWeight:500}}>{v}</div></div>
                ))}
              </div>
              {(contact.tags||[]).length>0&&<div style={{marginBottom:12}}><div style={{color:C.muted,fontSize:11,marginBottom:5}}>TAGS</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{contact.tags.map(t=><span key={t} style={{background:C.s3,color:C.muted,borderRadius:5,padding:"3px 9px",fontSize:12}}>{t}</span>)}</div></div>}
              {contact.notes&&<div style={{background:C.s2,borderRadius:8,padding:11,color:C.muted,fontSize:13,lineHeight:1.6}}>{contact.notes}</div>}
            </div>
          )}
          {tab==="followups"&&(
            <div>
              {cFU.length===0&&<div style={{textAlign:"center",color:C.muted,padding:30}}>Nenhum follow-up para este contato</div>}
              {cFU.map(f=>(
                <div key={f.id} style={{background:C.s2,borderRadius:9,padding:11,marginBottom:8,display:"flex",gap:9,opacity:f.completed?.6:1}}>
                  <span style={{fontSize:15}}>{({ligação:"📞","e-mail":"📧",reunião:"🤝",whatsapp:"💬",tarefa:"✅"})[f.type]||"📌"}</span>
                  <div style={{flex:1}}>
                    <div style={{color:f.completed?C.muted:C.text,fontSize:13,fontWeight:600,textDecoration:f.completed?"line-through":"none"}}>{f.title}</div>
                    <div style={{color:C.muted,fontSize:11,marginTop:2}}>📅 {fmtD(f.dueDate)} • <span style={{color:{alta:C.red,média:C.amber,baixa:C.green}[f.priority]}}>{f.priority}</span></div>
                  </div>
                  {f.completed&&<span style={{color:C.green,fontSize:12}}>✓</span>}
                </div>
              ))}
            </div>
          )}
          {tab==="atividades"&&(
            <div>
              {cActs.length===0&&<div style={{textAlign:"center",color:C.muted,padding:30}}>Nenhuma atividade registrada</div>}
              {cActs.map(a=>{
                const sdrA=sdrs.find(s=>s.id===a.sdrId);
                return(
                  <div key={a.id} style={{display:"flex",gap:9,marginBottom:11}}>
                    <div style={{width:26,height:26,borderRadius:"50%",background:C.s2,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{typeI[a.type]||"•"}</div>
                    <div style={{flex:1}}>
                      <div style={{color:C.text,fontSize:13}}>{a.desc}</div>
                      <div style={{display:"flex",gap:7,alignItems:"center",marginTop:2}}>
                        <span style={{color:C.dim,fontSize:11}}>{fmtDT(a.ts)}</span>
                        {sdrA&&<div style={{display:"flex",alignItems:"center",gap:3}}><SdrAvatar sdr={sdrA} size={14}/><span style={{color:C.dim,fontSize:10}}>{sdrA.name.split(" ")[0]}</span></div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {tab==="notas"&&(
            <div>
              <div style={{marginBottom:14}}>
                <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Adicione uma nota..." style={{width:"100%",background:C.s2,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",minHeight:65,resize:"vertical",fontFamily:"inherit"}}/>
                <div style={{display:"flex",justifyContent:"flex-end",marginTop:6}}><Btn sz="s" dis={!note.trim()} onClick={addNote}>➕ Adicionar</Btn></div>
              </div>
              {notes.length===0&&<div style={{textAlign:"center",color:C.muted,padding:20}}>Nenhuma nota ainda</div>}
              {notes.map(n=>{
                const sdrN=sdrs.find(s=>s.id===n.sdrId);
                return(
                  <div key={n.id} style={{background:C.s2,borderRadius:9,padding:11,marginBottom:8}}>
                    <div style={{color:C.text,fontSize:13,lineHeight:1.6,marginBottom:5}}>{n.text}</div>
                    <div style={{display:"flex",gap:7,alignItems:"center"}}>
                      {sdrN&&<div style={{display:"flex",alignItems:"center",gap:3}}><SdrAvatar sdr={sdrN} size={15}/><span style={{color:C.dim,fontSize:11}}>{sdrN.name.split(" ")[0]}</span></div>}
                      <span style={{color:C.dim,fontSize:11}}>{fmtDT(n.ts)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== NAV =====
const NAV=[{id:"dashboard",icon:"⬡",label:"Dashboard"},{id:"contacts",icon:"◈",label:"Contatos"},{id:"pipeline",icon:"▤",label:"Pipeline"},{id:"funnel",icon:"▽",label:"Funil de Vendas"},{id:"followups",icon:"◉",label:"Follow-ups"},{id:"reports",icon:"◫",label:"Relatórios"},{id:"team",icon:"◑",label:"Equipe"},{id:"whatsapp",icon:"◎",label:"WhatsApp"},{id:"import",icon:"⊞",label:"Importar Planilha"},{id:"ai",icon:"✦",label:"IA Assistente"},{id:"settings",icon:"⚙",label:"Configurações"}];

// ===== SIDEBAR =====
function Sidebar({view,setView,fu,currentSdr,sdrs,setCurrentSdr,syncing}){
  const [open,setOpen]=useState(false);
  return(
    <div style={{width:218,background:C.s1,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"16px 14px 13px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{fontSize:17,fontWeight:800,color:C.accent}}>⚡ FlowCRM</div>
        <div style={{fontSize:11,color:C.dim,marginTop:2}}>Multi-SDR • Firebase</div>
      </div>
      <nav style={{padding:"7px",flex:1,overflowY:"auto"}}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setView(n.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,border:"none",background:view===n.id?C.accent+"18":"transparent",color:view===n.id?C.accent:C.muted,cursor:"pointer",fontSize:12.5,fontWeight:view===n.id?600:400,textAlign:"left",transition:"all .12s",marginBottom:1}}>
            <span style={{fontSize:13,opacity:.8}}>{n.icon}</span>
            <span style={{flex:1}}>{n.label}</span>
            {n.id==="followups"&&fu>0&&<span style={{background:C.red,color:"#fff",borderRadius:10,fontSize:10,padding:"1px 5px",fontWeight:700}}>{fu}</span>}
          </button>
        ))}
      </nav>
      <div style={{padding:"8px 10px",borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",background:syncing?C.amber+"18":C.green+"18",border:`1px solid ${syncing?C.amber:C.green}44`,borderRadius:20,marginBottom:8}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:syncing?C.amber:C.green,animation:syncing?"pulse 1s infinite":"none"}}/>
          <span style={{fontSize:11,fontWeight:600,color:syncing?C.amber:C.green}}>{syncing?"Salvando...":"Sincronizado"}</span>
        </div>
        <div style={{color:C.dim,fontSize:10,textTransform:"uppercase",letterSpacing:".05em",marginBottom:5}}>Você é:</div>
        <button onClick={()=>setOpen(p=>!p)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,background:C.s2,border:`1px solid ${C.border}`,borderRadius:9,padding:"7px 10px",cursor:"pointer"}}>
          {currentSdr?<SdrAvatar sdr={currentSdr} size={26}/>:<div style={{width:26,height:26,borderRadius:"50%",background:C.s3,border:`1px solid ${C.border}`}}/>}
          <span style={{flex:1,textAlign:"left",color:currentSdr?C.text:C.muted,fontSize:12,fontWeight:600}}>{currentSdr?.name||"Selecionar SDR"}</span>
          <span style={{color:C.muted,fontSize:10}}>{open?"▲":"▼"}</span>
        </button>
        {open&&(
          <div style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",marginTop:4}}>
            {sdrs.map(s=>(
              <button key={s.id} onClick={()=>{setCurrentSdr(s);setOpen(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"9px 11px",background:currentSdr?.id===s.id?C.accent+"18":"transparent",border:"none",cursor:"pointer",borderBottom:`1px solid ${C.border}`}}>
                <SdrAvatar sdr={s} size={24}/>
                <span style={{color:currentSdr?.id===s.id?C.accent:C.text,fontSize:12,fontWeight:500}}>{s.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== HEADER =====
function Header({contacts,followUps,setView,setSelContact}){
  const [search,setSearch]=useState("");
  const [showS,setShowS]=useState(false);
  const [showN,setShowN]=useState(false);
  const todStr=tod();
  const overdue=followUps.filter(f=>!f.completed&&f.dueDate<todStr);
  const dueToday=followUps.filter(f=>!f.completed&&f.dueDate===todStr);
  const total=overdue.length+dueToday.length;
  const results=search.length>1?contacts.filter(c=>`${c.name} ${c.email} ${c.company}`.toLowerCase().includes(search.toLowerCase())).slice(0,6):[];
  return(
    <div style={{height:52,background:C.s1,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 20px",gap:14,flexShrink:0,position:"relative",zIndex:50}}>
      <div style={{flex:1,position:"relative"}}>
        <div style={{display:"flex",alignItems:"center",background:C.s2,border:`1px solid ${showS?C.accent:C.border}`,borderRadius:9,padding:"0 12px",gap:8}}>
          <span style={{color:C.dim,fontSize:13}}>🔍</span>
          <input value={search} onChange={e=>{setSearch(e.target.value);setShowS(true);}} onFocus={()=>setShowS(true)} onBlur={()=>setTimeout(()=>{setShowS(false);setSearch("");},200)} placeholder="Busca global — contatos, empresas..." style={{flex:1,background:"transparent",border:"none",padding:"8px 0",color:C.text,fontSize:13,outline:"none"}}/>
          {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14}}>✕</button>}
        </div>
        {showS&&results.length>0&&(
          <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:C.s2,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,.4)"}}>
            {results.map(c=>(
              <button key={c.id} onMouseDown={()=>{setSelContact(c);setSearch("");setShowS(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 14px",background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,cursor:"pointer",textAlign:"left"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.s3} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{width:30,height:30,borderRadius:"50%",background:C.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:C.accent,flexShrink:0}}>{c.name[0]}</div>
                <div style={{flex:1}}><div style={{color:C.text,fontSize:13,fontWeight:500}}>{c.name}</div><div style={{color:C.muted,fontSize:11}}>{c.company} • {c.stage}</div></div>
                <span style={{color:C.accent,fontSize:12,fontWeight:700}}>{fmtBRL(c.value)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{position:"relative"}}>
        <button onClick={()=>setShowN(p=>!p)} style={{width:36,height:36,borderRadius:9,background:total>0?C.red+"20":C.s2,border:`1px solid ${total>0?C.red+"60":C.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,position:"relative"}}>
          🔔{total>0&&<span style={{position:"absolute",top:-4,right:-4,background:C.red,color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{total}</span>}
        </button>
        {showN&&(
          <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,width:300,background:C.s2,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,.4)"}}>
            <div style={{padding:"11px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:C.text,fontSize:13,fontWeight:600}}>Notificações</span>
              <button onClick={()=>setShowN(false)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14}}>✕</button>
            </div>
            {overdue.length>0&&(
              <div style={{padding:"8px 14px",borderBottom:`1px solid ${C.border}`}}>
                <div style={{color:C.red,fontSize:11,fontWeight:600,marginBottom:5,textTransform:"uppercase"}}>⚠ Atrasados ({overdue.length})</div>
                {overdue.slice(0,3).map(f=>(
                  <div key={f.id} onClick={()=>{setView("followups");setShowN(false);}} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",cursor:"pointer"}}>
                    <span style={{color:C.text,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:180}}>{f.title}</span>
                    <span style={{color:C.red,fontSize:11}}>{fmtD(f.dueDate)}</span>
                  </div>
                ))}
              </div>
            )}
            {dueToday.length>0&&(
              <div style={{padding:"8px 14px"}}>
                <div style={{color:C.amber,fontSize:11,fontWeight:600,marginBottom:5,textTransform:"uppercase"}}>📅 Hoje ({dueToday.length})</div>
                {dueToday.slice(0,3).map(f=>(
                  <div key={f.id} onClick={()=>{setView("followups");setShowN(false);}} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",cursor:"pointer"}}>
                    <span style={{color:C.text,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:190}}>{f.title}</span>
                    <span style={{color:C.amber,fontSize:11}}>Hoje</span>
                  </div>
                ))}
              </div>
            )}
            {total===0&&<div style={{padding:"24px 14px",textAlign:"center",color:C.muted,fontSize:13}}>✅ Tudo em dia!</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== DASHBOARD =====
function Dashboard({contacts,followUps,activities,sdrs,currentSdr}){
  const [showAll,setShowAll]=useState(true);
  const filtered=showAll?contacts:contacts.filter(c=>c.assignedTo===currentSdr?.id);
  const won=filtered.filter(c=>c.stage==="Ganho");
  const open=filtered.filter(c=>!["Ganho","Perdido"].includes(c.stage));
  const pending=followUps.filter(f=>!f.completed&&(showAll||f.assignedTo===currentSdr?.id)).length;
  const kpis=[
    {l:"Total Leads",v:filtered.length,icon:"👥",c:C.indigo},
    {l:"Pipeline",v:fmtBRL(open.reduce((s,c)=>s+c.value,0)),icon:"💰",c:C.amber},
    {l:"Receita Fechada",v:fmtBRL(won.reduce((s,c)=>s+c.value,0)),icon:"🏆",c:C.green},
    {l:"Follow-ups",v:pending,icon:"⏰",c:pending>3?C.red:C.amber},
  ];
  const stageD=STAGES.slice(0,-1).map(s=>({name:s,count:filtered.filter(c=>c.stage===s).length,value:filtered.filter(c=>c.stage===s).reduce((a,c)=>a+c.value,0)}));
  const sdrPerf=sdrs.map(s=>({name:s.name.split(" ")[0],ganhos:contacts.filter(c=>c.stage==="Ganho"&&c.assignedTo===s.id).length,pipeline:contacts.filter(c=>!["Ganho","Perdido"].includes(c.stage)&&c.assignedTo===s.id).length,color:s.color}));
  const TTIP={contentStyle:{background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12}};
  return(
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h2 style={{color:C.text,fontSize:20,fontWeight:700,margin:0}}>Dashboard</h2>
        <div style={{display:"flex",gap:4,background:C.s1,border:`1px solid ${C.border}`,borderRadius:8,padding:3}}>
          {[["true","Toda Equipe"],["false","Meus Leads"]].map(([v,l])=>(
            <button key={v} onClick={()=>setShowAll(v==="true")} style={{padding:"5px 12px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:showAll===(v==="true")?C.accent:C.s1,color:showAll===(v==="true")?C.bg:C.muted,transition:"all .15s"}}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:13,marginBottom:18}}>
        {kpis.map(k=>(
          <Card key={k.l} st={{padding:15}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div><div style={{color:C.muted,fontSize:11,marginBottom:5,textTransform:"uppercase",letterSpacing:".04em"}}>{k.l}</div><div style={{color:C.text,fontSize:21,fontWeight:800}}>{k.v}</div></div>
              <span style={{fontSize:22}}>{k.icon}</span>
            </div>
          </Card>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
        <Card>
          <h4 style={{color:C.text,margin:"0 0 12px",fontSize:13,fontWeight:600}}>Pipeline por Estágio</h4>
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={stageD}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="name" stroke={C.muted} fontSize={10} tick={{angle:-20,textAnchor:"end"}} height={40}/>
              <YAxis stroke={C.muted} fontSize={10} tickFormatter={v=>v?Math.round(v/1000)+"k":""}/>
              <Tooltip formatter={v=>fmtBRL(v)} {...TTIP}/>
              <Bar dataKey="value" name="Valor" radius={[4,4,0,0]}>{stageD.map((s,i)=><Cell key={i} fill={SC[s.name]||C.accent}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h4 style={{color:C.text,margin:"0 0 12px",fontSize:13,fontWeight:600}}>Equipe</h4>
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={sdrPerf}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="name" stroke={C.muted} fontSize={11}/>
              <YAxis stroke={C.muted} fontSize={10}/>
              <Tooltip {...TTIP}/>
              <Bar dataKey="pipeline" name="Em aberto" radius={[4,4,0,0]}>{sdrPerf.map((s,i)=><Cell key={i} fill={s.color}/>)}</Bar>
              <Bar dataKey="ganhos" name="Ganhos" fill={C.green} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card>
          <h4 style={{color:C.text,margin:"0 0 12px",fontSize:13,fontWeight:600}}>SDRs — Pipeline</h4>
          {sdrs.map(s=>{
            const pl=contacts.filter(c=>!["Ganho","Perdido"].includes(c.stage)&&c.assignedTo===s.id);
            const maxV=Math.max(...sdrs.map(x=>contacts.filter(c=>!["Ganho","Perdido"].includes(c.stage)&&c.assignedTo===x.id).length),1);
            return(
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <SdrAvatar sdr={s} size={30}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:C.text,fontSize:12,fontWeight:500}}>{s.name.split(" ")[0]}</span><span style={{color:C.muted,fontSize:11}}>{pl.length} leads • {fmtBRL(pl.reduce((a,c)=>a+c.value,0))}</span></div>
                  <div style={{background:C.s3,borderRadius:4,height:5}}><div style={{background:s.color,width:`${Math.max((pl.length/maxV)*100,4)}%`,height:5,borderRadius:4,transition:"width .5s"}}/></div>
                </div>
              </div>
            );
          })}
        </Card>
        <Card>
          <h4 style={{color:C.text,margin:"0 0 12px",fontSize:13,fontWeight:600}}>Atividades Recentes</h4>
          {activities.slice(0,6).map(a=>{
            const icons={deal:"🤝",call:"📞",email:"📧",whatsapp:"💬",note:"📝",won:"🏆"};
            const sdrA=sdrs.find(s=>s.id===a.sdrId);
            return(
              <div key={a.id} style={{display:"flex",gap:8,marginBottom:9}}>
                <span style={{fontSize:14,flexShrink:0}}>{icons[a.type]||"•"}</span>
                <div style={{flex:1}}>
                  <div style={{color:C.text,fontSize:12}}>{a.desc}</div>
                  <div style={{display:"flex",gap:6,alignItems:"center",marginTop:1}}>
                    {sdrA&&<div style={{display:"flex",alignItems:"center",gap:3}}><SdrAvatar sdr={sdrA} size={13}/><span style={{color:C.dim,fontSize:10}}>{sdrA.name.split(" ")[0]}</span></div>}
                    <span style={{color:C.dim,fontSize:10}}>{fmtDT(a.ts)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

// ===== CONTACTS =====
function ContactsView({contacts,setContacts,setActivities,sdrs,currentSdr,setSelContact}){
  const [search,setSearch]=useState("");
  const [fStage,setFStage]=useState("");
  const [fSdr,setFSdr]=useState("");
  const [fTag,setFTag]=useState("");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const [sortK,setSortK]=useState("name");
  const [sortD,setSortD]=useState("asc");
  const filtered=useMemo(()=>contacts.filter(c=>{
    if(search&&!`${c.name} ${c.email} ${c.company}`.toLowerCase().includes(search.toLowerCase()))return false;
    if(fStage&&c.stage!==fStage)return false;
    if(fSdr&&c.assignedTo!==fSdr)return false;
    if(fTag&&!(c.tags||[]).includes(fTag))return false;
    return true;
  }).sort((a,b)=>{
    const va=sortK==="value"?a.value:(a[sortK]||"").toString().toLowerCase();
    const vb=sortK==="value"?b.value:(b[sortK]||"").toString().toLowerCase();
    return sortD==="asc"?(va>vb?1:-1):(va<vb?1:-1);
  }),[contacts,search,fStage,fSdr,fTag,sortK,sortD]);
  const allTags=[...new Set(contacts.flatMap(c=>c.tags||[]))];
  const openAdd=()=>{setForm({name:"",email:"",phone:"",company:"",stage:"Lead",tags:"",value:"",source:"Site",notes:"",score:50,assignedTo:currentSdr?.id||sdrs[0]?.id||""});setModal("add");};
  const openEdit=c=>{setForm({...c,tags:(c.tags||[]).join(", "),value:c.value?.toString()});setModal(c);};
  const del=id=>{if(window.confirm("Remover contato?"))setContacts(p=>p.filter(c=>c.id!==id));};
  const save=()=>{
    const contact={...form,value:parseFloat(form.value)||0,score:parseInt(form.score)||50,tags:typeof form.tags==="string"?form.tags.split(",").map(t=>t.trim()).filter(Boolean):form.tags||[]};
    if(modal==="add"){const nc={...contact,id:g(),createdAt:tod(),lastContact:tod()};setContacts(p=>[nc,...p]);setActivities(p=>[{id:g(),type:"deal",desc:`Lead criado: ${contact.name}`,cId:nc.id,ts:new Date().toISOString(),sdrId:form.assignedTo},...p]);}
    else setContacts(p=>p.map(c=>c.id===form.id?{...c,...contact}:c));
    setModal(null);
  };
  const exportCSV=()=>{
    const hdr=["Nome","Email","Telefone","Empresa","Estágio","Valor","Score","SDR","Tags","Notas"];
    const rows=filtered.map(c=>[c.name,c.email,c.phone,c.company,c.stage,c.value,c.score,sdrs.find(s=>s.id===c.assignedTo)?.name||"",(c.tags||[]).join(";"),c.notes]);
    const csv=[hdr,...rows].map(r=>r.map(v=>`"${v||""}"`).join(",")).join("\n");
    const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,\uFEFF"+encodeURIComponent(csv);a.download="contatos.csv";a.click();
  };
  const th={padding:"9px 12px",color:C.muted,fontSize:11,fontWeight:600,textAlign:"left",textTransform:"uppercase",letterSpacing:".05em",cursor:"pointer",userSelect:"none",whiteSpace:"nowrap"};
  const sH=k=>()=>{if(sortK===k)setSortD(d=>d==="asc"?"desc":"asc");else{setSortK(k);setSortD("asc");}};
  const ar=k=>sortK===k?(sortD==="asc"?"↑":"↓"):"";
  return(
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{color:C.text,fontSize:20,fontWeight:700,margin:0}}>Contatos <span style={{color:C.muted,fontWeight:400,fontSize:14}}>({filtered.length}/{contacts.length})</span></h2>
        <div style={{display:"flex",gap:8}}><Btn v="g" sz="s" onClick={exportCSV}>⬇ CSV</Btn><Btn sz="s" onClick={openAdd}>+ Novo</Btn></div>
      </div>
      <Card st={{marginBottom:13,padding:11}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8}}>
          <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar nome, email, empresa..."/>
          <Sel value={fStage} onChange={e=>setFStage(e.target.value)}><option value="">Todos estágios</option>{STAGES.map(s=><option key={s}>{s}</option>)}</Sel>
          <Sel value={fSdr} onChange={e=>setFSdr(e.target.value)}><option value="">Todos SDRs</option>{sdrs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Sel>
          <Sel value={fTag} onChange={e=>setFTag(e.target.value)}><option value="">Todas tags</option>{allTags.map(t=><option key={t}>{t}</option>)}</Sel>
        </div>
      </Card>
      <Card st={{padding:0,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:C.s2}}>
            <th style={th} onClick={sH("name")}>Nome {ar("name")}</th>
            <th style={th} onClick={sH("company")}>Empresa {ar("company")}</th>
            <th style={th} onClick={sH("stage")}>Estágio {ar("stage")}</th>
            <th style={th} onClick={sH("value")}>Valor {ar("value")}</th>
            <th style={th}>Score</th>
            <th style={th}>SDR</th>
            <th style={th}>Ações</th>
          </tr></thead>
          <tbody>
            {filtered.map((c,i)=>{
              const sdr=sdrs.find(s=>s.id===c.assignedTo);
              return(
                <tr key={c.id} style={{borderTop:`1px solid ${C.border}`,background:i%2?C.s1:C.bg,transition:"background .1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.s2} onMouseLeave={e=>e.currentTarget.style.background=i%2?C.s1:C.bg}>
                  <td style={{padding:"9px 12px"}}>
                    <div style={{color:C.accent,fontWeight:600,fontSize:13,cursor:"pointer"}} onClick={()=>setSelContact&&setSelContact(c)}>{c.name}</div>
                    <div style={{color:C.muted,fontSize:11}}>{c.email}</div>
                  </td>
                  <td style={{padding:"9px 12px",color:C.muted,fontSize:12}}>{c.company}</td>
                  <td style={{padding:"9px 12px"}}><StageBadge stage={c.stage}/></td>
                  <td style={{padding:"9px 12px",color:C.text,fontWeight:600,fontSize:13}}>{fmtBRL(c.value)}</td>
                  <td style={{padding:"9px 12px"}}><ScorePill score={c.score||0}/></td>
                  <td style={{padding:"9px 12px"}}>{sdr&&<div style={{display:"flex",alignItems:"center",gap:5}}><SdrAvatar sdr={sdr} size={20}/><span style={{color:C.muted,fontSize:11}}>{sdr.name.split(" ")[0]}</span></div>}</td>
                  <td style={{padding:"9px 12px"}}>
                    <div style={{display:"flex",gap:5}}>
                      <a href={`https://wa.me/55${(c.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{background:"#25D36620",color:"#25D366",borderRadius:6,padding:"3px 7px",fontSize:11,fontWeight:700,textDecoration:"none"}}>WA</a>
                      <Btn v="g" sz="s" onClick={()=>openEdit(c)}>✏</Btn>
                      <Btn v="g" sz="s" st={{color:C.red}} onClick={()=>del(c.id)}>✕</Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length===0&&<div style={{padding:40,textAlign:"center",color:C.muted}}>Nenhum contato encontrado</div>}
      </Card>
      {modal&&(
        <Modal title={modal==="add"?"Novo Contato":"Editar Contato"} onClose={()=>setModal(null)} w={600}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Field label="Nome *"><Inp value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></Field>
            <Field label="Empresa"><Inp value={form.company} onChange={e=>setForm(p=>({...p,company:e.target.value}))}/></Field>
            <Field label="E-mail"><Inp type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></Field>
            <Field label="Telefone"><Inp value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></Field>
            <Field label="Estágio"><Sel value={form.stage} onChange={e=>setForm(p=>({...p,stage:e.target.value}))}>{STAGES.map(s=><option key={s}>{s}</option>)}</Sel></Field>
            <Field label="Valor (R$)"><Inp type="number" value={form.value} onChange={e=>setForm(p=>({...p,value:e.target.value}))}/></Field>
            <Field label="Origem"><Sel value={form.source} onChange={e=>setForm(p=>({...p,source:e.target.value}))}>{["Site","LinkedIn","Indicação","WhatsApp","E-mail","Evento","Outro"].map(s=><option key={s}>{s}</option>)}</Sel></Field>
            <Field label="Responsável SDR"><Sel value={form.assignedTo} onChange={e=>setForm(p=>({...p,assignedTo:e.target.value}))}>{sdrs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Sel></Field>
            <Field label="Score (0-100)"><Inp type="number" value={form.score} onChange={e=>setForm(p=>({...p,score:e.target.value}))}/></Field>
            <Field label="Tags (vírgula)"><Inp value={form.tags} onChange={e=>setForm(p=>({...p,tags:e.target.value}))} placeholder="hot, vip..."/></Field>
          </div>
          <Field label="Notas"><textarea value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{width:"100%",background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",minHeight:65,resize:"vertical",fontFamily:"inherit"}}/></Field>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn v="g" onClick={()=>setModal(null)}>Cancelar</Btn><Btn dis={!form.name} onClick={save}>Salvar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

// ===== PIPELINE =====
function PipelineView({contacts,setContacts,setActivities,sdrs,currentSdr}){
  const [dragging,setDragging]=useState(null);
  const [over,setOver]=useState(null);
  const [detail,setDetail]=useState(null);
  const [fSdr,setFSdr]=useState("");
  const show=fSdr?contacts.filter(c=>c.assignedTo===fSdr):contacts;
  const drop=toStage=>{
    if(!dragging)return;
    const c=contacts.find(x=>x.id===dragging);
    setContacts(p=>p.map(x=>x.id===dragging?{...x,stage:toStage,lastContact:tod()}:x));
    setActivities(p=>[{id:g(),type:"deal",desc:`${c?.name} → ${toStage}`,cId:dragging,ts:new Date().toISOString(),sdrId:c?.assignedTo},...p]);
    setDragging(null);setOver(null);
  };
  return(
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{color:C.text,fontSize:20,fontWeight:700,margin:0}}>Pipeline Kanban</h2>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <Sel value={fSdr} onChange={e=>setFSdr(e.target.value)} st={{width:"auto",padding:"6px 11px",fontSize:12}}><option value="">Toda a equipe</option>{sdrs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Sel>
          <span style={{color:C.muted,fontSize:13}}>Pipeline: <span style={{color:C.accent,fontWeight:700}}>{fmtBRL(show.filter(c=>!["Ganho","Perdido"].includes(c.stage)).reduce((s,c)=>s+c.value,0))}</span></span>
        </div>
      </div>
      <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:8,minHeight:480}}>
        {PIPE_STAGES.map(stage=>{
          const stC=show.filter(c=>c.stage===stage);
          const isOver=over===stage;
          return(
            <div key={stage} style={{minWidth:205,flex:"0 0 205px"}} onDragOver={e=>{e.preventDefault();setOver(stage);}} onDragLeave={()=>setOver(null)} onDrop={()=>drop(stage)}>
              <div style={{background:C.s2,borderRadius:"9px 9px 0 0",padding:"9px 11px",border:`1px solid ${C.border}`,borderBottom:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}><div style={{width:7,height:7,borderRadius:"50%",background:SC[stage]}}/><span style={{color:C.text,fontSize:12.5,fontWeight:600}}>{stage}</span></div>
                <div style={{color:C.muted,fontSize:11}}>{stC.length} • {fmtBRL(stC.reduce((s,c)=>s+c.value,0))}</div>
              </div>
              <div style={{background:isOver?C.accent+"0a":C.s1,border:`1px solid ${isOver?C.accent:C.border}`,borderTop:"none",borderRadius:"0 0 9px 9px",minHeight:380,padding:7,transition:"all .15s"}}>
                {stC.map(c=>{
                  const sdr=sdrs.find(s=>s.id===c.assignedTo);
                  return(
                    <div key={c.id} draggable onDragStart={()=>setDragging(c.id)} onDragEnd={()=>{setDragging(null);setOver(null);}} onClick={()=>setDetail(c)}
                      style={{background:C.s2,border:`1px solid ${dragging===c.id?C.accent:C.border}`,borderRadius:8,padding:10,marginBottom:7,cursor:"grab",opacity:dragging===c.id?.5:1,transition:"border .15s"}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=dragging===c.id?C.accent:C.border}>
                      <div style={{color:C.text,fontSize:12.5,fontWeight:600,marginBottom:2}}>{c.name}</div>
                      <div style={{color:C.muted,fontSize:11,marginBottom:6}}>{c.company}</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{color:C.accent,fontSize:12,fontWeight:700}}>{fmtBRL(c.value)}</span><ScorePill score={c.score||0}/></div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
                        <div style={{display:"flex",gap:3}}>{(c.tags||[]).slice(0,2).map(t=><span key={t} style={{background:C.s3,color:C.muted,borderRadius:3,padding:"1px 5px",fontSize:9}}>{t}</span>)}</div>
                        {sdr&&<SdrAvatar sdr={sdr} size={18}/>}
                      </div>
                    </div>
                  );
                })}
                {stC.length===0&&<div style={{color:C.dim,fontSize:11,textAlign:"center",padding:"28px 0",borderRadius:7,border:`2px dashed ${isOver?C.accent:C.border}`,margin:4}}>Solte aqui</div>}
              </div>
            </div>
          );
        })}
      </div>
      {detail&&(
        <Modal title="Detalhes" onClose={()=>setDetail(null)}>
          <div style={{marginBottom:14}}><div style={{fontSize:17,fontWeight:700,color:C.text,marginBottom:3}}>{detail.name}</div><div style={{color:C.muted,fontSize:13}}>{detail.company} • {detail.email}</div></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
            {[["Valor",fmtBRL(detail.value),C.accent],["Score",detail.score||0,C.green],["Estágio",detail.stage,SC[detail.stage]]].map(([l,v,c])=>(
              <div key={l} style={{background:C.s2,borderRadius:8,padding:10}}><div style={{color:C.muted,fontSize:10,marginBottom:3,textTransform:"uppercase"}}>{l}</div><div style={{color:c,fontSize:14,fontWeight:700}}>{v}</div></div>
            ))}
          </div>
          {detail.notes&&<div style={{background:C.s2,borderRadius:8,padding:10,color:C.muted,fontSize:13,marginBottom:14}}>{detail.notes}</div>}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <a href={`https://wa.me/55${(detail.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{background:"#25D36620",color:"#25D366",borderRadius:8,padding:"7px 12px",fontSize:13,fontWeight:600,textDecoration:"none"}}>💬 WhatsApp</a>
            <a href={`mailto:${detail.email}`} style={{background:C.indigo+"20",color:C.indigo,borderRadius:8,padding:"7px 12px",fontSize:13,fontWeight:600,textDecoration:"none"}}>📧 E-mail</a>
            <div style={{flex:1}}/>
            <Btn sz="s" st={{background:C.green,color:"#fff",border:"none"}} onClick={()=>{setContacts(p=>p.map(c=>c.id===detail.id?{...c,stage:"Ganho",lastContact:tod()}:c));setActivities(p=>[{id:g(),type:"won",desc:`🎉 Ganho: ${detail.name}!`,cId:detail.id,ts:new Date().toISOString(),sdrId:detail.assignedTo},...p]);setDetail(null);}}>✅ Ganho</Btn>
            <Btn sz="s" st={{background:C.red,color:"#fff",border:"none"}} onClick={()=>{setContacts(p=>p.map(c=>c.id===detail.id?{...c,stage:"Perdido",lastContact:tod()}:c));setDetail(null);}}>✗ Perdido</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ===== FUNNEL =====
function FunnelView({contacts,sdrs}){
  const [fSdr,setFSdr]=useState("");
  const show=fSdr?contacts.filter(c=>c.assignedTo===fSdr):contacts;
  const data=["Lead","Qualificado","Proposta","Negociação","Ganho"].map(s=>({name:s,count:show.filter(c=>c.stage===s).length,value:show.filter(c=>c.stage===s).reduce((a,c)=>a+c.value,0)}));
  const total=data[0]?.count||1;
  const TTIP={contentStyle:{background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12}};
  return(
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{color:C.text,fontSize:20,fontWeight:700,margin:0}}>Funil de Vendas</h2>
        <Sel value={fSdr} onChange={e=>setFSdr(e.target.value)} st={{width:"auto",padding:"6px 11px",fontSize:12}}><option value="">Toda a equipe</option>{sdrs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Sel>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <Card>
          <h4 style={{color:C.text,margin:"0 0 16px",fontSize:13,fontWeight:600}}>Funil Visual</h4>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            {data.map((s,i)=>(
              <div key={s.name} style={{width:"100%",display:"flex",flexDirection:"column",alignItems:"center"}}>
                <div style={{width:`${96-(i*13)}%`,background:SC[s.name]||C.accent,borderRadius:8,padding:"11px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{color:"#fff",fontWeight:700,fontSize:13}}>{s.name}</span>
                  <div style={{textAlign:"right"}}><div style={{color:"#fff",fontWeight:800,fontSize:15}}>{s.count}</div><div style={{color:"rgba(255,255,255,.7)",fontSize:10}}>{fmtBRL(s.value)}</div></div>
                </div>
                {i<data.length-1&&<div style={{fontSize:11,margin:"3px 0",color:Math.round((data[i+1]?.count/(s.count||1))*100)>=50?C.green:C.amber,fontWeight:600}}>▼ {Math.round((data[i+1]?.count/(s.count||1))*100)}% conversão</div>}
              </div>
            ))}
          </div>
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card st={{padding:16}}><div style={{color:C.muted,fontSize:11,textTransform:"uppercase",marginBottom:6}}>Conversão Total</div><div style={{fontSize:36,fontWeight:800,color:C.accent}}>{Math.round((data[4]?.count/total)*100)}%</div><div style={{color:C.dim,fontSize:12}}>Lead → Fechamento</div></Card>
          <Card>
            <h4 style={{color:C.text,margin:"0 0 12px",fontSize:13,fontWeight:600}}>Taxa por Estágio</h4>
            {data.map((s,i)=>{
              if(!i)return null;
              const rate=Math.round((s.count/(data[i-1].count||1))*100);
              return(
                <div key={s.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                  <span style={{color:C.muted,fontSize:12}}>{data[i-1].name} → {s.name}</span>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{width:65,background:C.s3,borderRadius:4,height:5}}><div style={{background:rate>=50?C.green:rate>=30?C.amber:C.red,width:`${rate}%`,height:5,borderRadius:4}}/></div>
                    <span style={{color:rate>=50?C.green:rate>=30?C.amber:C.red,fontSize:12,fontWeight:700,width:32,textAlign:"right"}}>{rate}%</span>
                  </div>
                </div>
              );
            })}
          </Card>
          <Card>
            <h4 style={{color:C.text,margin:"0 0 12px",fontSize:13,fontWeight:600}}>Valor por Estágio</h4>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={data} layout="vertical">
                <XAxis type="number" stroke={C.muted} fontSize={10} tickFormatter={v=>v?Math.round(v/1000)+"k":""}/>
                <YAxis dataKey="name" type="category" stroke={C.muted} fontSize={10} width={72}/>
                <Tooltip formatter={v=>fmtBRL(v)} {...TTIP}/>
                <Bar dataKey="value" radius={[0,4,4,0]}>{data.map((d,i)=><Cell key={i} fill={SC[d.name]||C.accent}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ===== FOLLOW-UPS =====
function FollowUpsView({contacts,followUps,setFollowUps,setActivities,sdrs,currentSdr}){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({});
  const [filter,setFilter]=useState("pendentes");
  const [fSdr,setFSdr]=useState("");
  const todStr=tod();
  const filtered=followUps.filter(f=>{
    if(fSdr&&f.assignedTo!==fSdr)return false;
    if(filter==="pendentes")return!f.completed;
    if(filter==="hoje")return f.dueDate===todStr&&!f.completed;
    if(filter==="atrasados")return f.dueDate<todStr&&!f.completed;
    if(filter==="concluidos")return f.completed;
    return true;
  }).sort((a,b)=>a.dueDate>b.dueDate?1:-1);
  const gc=id=>contacts.find(c=>c.id===id);
  const toggle=id=>setFollowUps(p=>p.map(f=>f.id===id?{...f,completed:!f.completed}:f));
  const del=id=>setFollowUps(p=>p.filter(f=>f.id!==id));
  const save=()=>{
    const fu={...form,id:form.id||g(),completed:false};
    if(form.id)setFollowUps(p=>p.map(f=>f.id===fu.id?fu:f));
    else{setFollowUps(p=>[fu,...p]);setActivities(p=>[{id:g(),type:"note",desc:`Follow-up: ${fu.title}`,cId:fu.contactId,ts:new Date().toISOString(),sdrId:fu.assignedTo},...p]);}
    setModal(false);
  };
  const openNew=()=>{setForm({contactId:contacts[0]?.id||"",type:"ligação",title:"",dueDate:todStr,priority:"média",notes:"",assignedTo:currentSdr?.id||sdrs[0]?.id||""});setModal(true);};
  const typeI={ligação:"📞","e-mail":"📧",reunião:"🤝",whatsapp:"💬",tarefa:"✅"};
  const prioC={alta:C.red,média:C.amber,baixa:C.green};
  const tabs=[["pendentes","Pendentes"],["hoje","Hoje"],["atrasados","Atrasados"],["concluidos","Concluídos"],["todos","Todos"]];
  return(
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{color:C.text,fontSize:20,fontWeight:700,margin:0}}>Follow-ups</h2>
        <div style={{display:"flex",gap:8}}>
          <Sel value={fSdr} onChange={e=>setFSdr(e.target.value)} st={{width:"auto",padding:"6px 11px",fontSize:12}}><option value="">Toda a equipe</option>{sdrs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Sel>
          <Btn sz="s" onClick={openNew}>+ Novo</Btn>
        </div>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:14,background:C.s1,padding:4,borderRadius:10,border:`1px solid ${C.border}`,width:"fit-content"}}>
        {tabs.map(([v,l])=><button key={v} onClick={()=>setFilter(v)} style={{padding:"5px 12px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filter===v?C.accent:C.s1,color:filter===v?C.bg:C.muted,transition:"all .15s"}}>{l}</button>)}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {filtered.map(f=>{
          const contact=gc(f.contactId);
          const sdr=sdrs.find(s=>s.id===f.assignedTo);
          const late=f.dueDate<todStr&&!f.completed;
          return(
            <Card key={f.id} st={{padding:12,opacity:f.completed?.6:1}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <button onClick={()=>toggle(f.id)} style={{width:21,height:21,borderRadius:"50%",border:`2px solid ${f.completed?C.green:C.border}`,background:f.completed?C.green:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>{f.completed&&<span style={{color:"#fff",fontSize:11}}>✓</span>}</button>
                <span style={{fontSize:15}}>{typeI[f.type]||"📌"}</span>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}>
                    <span style={{color:f.completed?C.muted:C.text,fontSize:13,fontWeight:600,textDecoration:f.completed?"line-through":"none"}}>{f.title}</span>
                    <span style={{background:prioC[f.priority]+"22",color:prioC[f.priority],borderRadius:4,padding:"1px 5px",fontSize:10,fontWeight:700}}>{f.priority}</span>
                  </div>
                  <div style={{display:"flex",gap:9,alignItems:"center"}}>
                    {contact&&<span style={{color:C.muted,fontSize:11}}>👤 {contact.name} • {contact.company}</span>}
                    <span style={{color:late?C.red:f.dueDate===todStr?C.amber:C.dim,fontSize:11}}>{late?"⚠ ATRASADO: ":"📅 "}{fmtD(f.dueDate)}</span>
                    {sdr&&<div style={{display:"flex",alignItems:"center",gap:3}}><SdrAvatar sdr={sdr} size={15}/><span style={{color:C.dim,fontSize:10}}>{sdr.name.split(" ")[0]}</span></div>}
                  </div>
                </div>
                <div style={{display:"flex",gap:5}}>
                  {contact&&<a href={`https://wa.me/55${(contact.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{background:"#25D36618",color:"#25D366",borderRadius:6,padding:"3px 7px",fontSize:11,fontWeight:700,textDecoration:"none"}}>WA</a>}
                  <Btn v="g" sz="s" st={{color:C.red}} onClick={()=>del(f.id)}>✕</Btn>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length===0&&<div style={{textAlign:"center",color:C.muted,padding:50}}>Nenhum follow-up nesta categoria ✓</div>}
      </div>
      {modal&&(
        <Modal title="Novo Follow-up" onClose={()=>setModal(false)}>
          <Field label="Contato"><Sel value={form.contactId} onChange={e=>setForm(p=>({...p,contactId:e.target.value}))}>{contacts.map(c=><option key={c.id} value={c.id}>{c.name} – {c.company}</option>)}</Sel></Field>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Field label="Tipo"><Sel value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>{["ligação","e-mail","reunião","whatsapp","tarefa"].map(t=><option key={t}>{t}</option>)}</Sel></Field>
            <Field label="Prioridade"><Sel value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>{["alta","média","baixa"].map(x=><option key={x}>{x}</option>)}</Sel></Field>
            <Field label="Responsável"><Sel value={form.assignedTo} onChange={e=>setForm(p=>({...p,assignedTo:e.target.value}))}>{sdrs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Sel></Field>
            <Field label="Data"><Inp type="date" value={form.dueDate} onChange={e=>setForm(p=>({...p,dueDate:e.target.value}))}/></Field>
          </div>
          <Field label="Título"><Inp value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/></Field>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}><Btn v="g" onClick={()=>setModal(false)}>Cancelar</Btn><Btn dis={!form.title} onClick={save}>Salvar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

// ===== REPORTS =====
function ReportsView({contacts,sdrs,followUps}){
  const [fSdr,setFSdr]=useState("");
  const show=fSdr?contacts.filter(c=>c.assignedTo===fSdr):contacts;
  const won=show.filter(c=>c.stage==="Ganho");
  const lost=show.filter(c=>c.stage==="Perdido");
  const open=show.filter(c=>!["Ganho","Perdido"].includes(c.stage));
  const TTIP={contentStyle:{background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12}};
  const byStage=STAGES.map(s=>({name:s,count:show.filter(c=>c.stage===s).length,value:show.filter(c=>c.stage===s).reduce((a,c)=>a+c.value,0)}));
  const sdrStats=sdrs.map(s=>{
    const mine=contacts.filter(c=>c.assignedTo===s.id);
    const mWon=mine.filter(c=>c.stage==="Ganho");
    const mOpen=mine.filter(c=>!["Ganho","Perdido"].includes(c.stage));
    return{...s,total:mine.length,ganhos:mWon.length,wonVal:mWon.reduce((a,c)=>a+c.value,0),pipeVal:mOpen.reduce((a,c)=>a+c.value,0),pendFU:followUps.filter(f=>f.assignedTo===s.id&&!f.completed).length,convRate:mine.length?Math.round((mWon.length/mine.length)*100):0};
  });
  return(
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h2 style={{color:C.text,fontSize:20,fontWeight:700,margin:0}}>Relatórios</h2>
        <Sel value={fSdr} onChange={e=>setFSdr(e.target.value)} st={{width:"auto",padding:"6px 11px",fontSize:12}}><option value="">Toda a equipe</option>{sdrs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Sel>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[["Receita Fechada",fmtBRL(won.reduce((s,c)=>s+c.value,0)),"🏆",C.green],["Pipeline",fmtBRL(open.reduce((s,c)=>s+c.value,0)),"📈",C.indigo],["Receita Perdida",fmtBRL(lost.reduce((s,c)=>s+c.value,0)),"📉",C.red],["Taxa de Ganho",`${show.length?Math.round((won.length/show.length)*100):0}%`,"⚡",C.amber]].map(([l,v,i,c])=>(
          <Card key={l} st={{padding:14}}><div style={{color:C.muted,fontSize:11,marginBottom:4}}>{i} {l}</div><div style={{color:c,fontSize:20,fontWeight:800}}>{v}</div></Card>
        ))}
      </div>
      <Card st={{marginBottom:14,padding:0,overflow:"hidden"}}>
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}><h4 style={{color:C.text,fontSize:13,fontWeight:600,margin:0}}>Performance por SDR</h4></div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:C.s2}}>{["SDR","Leads","Pipeline","Rec. Fechada","Conversão","Pendentes","Meta"].map(h=><th key={h} style={{padding:"9px 14px",color:C.muted,fontSize:11,fontWeight:600,textAlign:"left",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
          <tbody>
            {sdrStats.map((s,i)=>(
              <tr key={s.id} style={{borderTop:`1px solid ${C.border}`,background:i%2?C.s1:C.bg}}>
                <td style={{padding:"11px 14px"}}><div style={{display:"flex",alignItems:"center",gap:9}}><SdrAvatar sdr={s} size={30}/><div><div style={{color:C.text,fontSize:13,fontWeight:600}}>{s.name}</div><div style={{color:C.muted,fontSize:11}}>{s.email}</div></div></div></td>
                <td style={{padding:"11px 14px",color:C.text,fontSize:13}}>{s.total}</td>
                <td style={{padding:"11px 14px",color:C.amber,fontWeight:600,fontSize:13}}>{fmtBRL(s.pipeVal)}</td>
                <td style={{padding:"11px 14px",color:C.green,fontWeight:700,fontSize:13}}>{fmtBRL(s.wonVal)}</td>
                <td style={{padding:"11px 14px"}}><div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:50,background:C.s3,borderRadius:4,height:6}}><div style={{background:s.convRate>=30?C.green:C.amber,width:`${s.convRate}%`,height:6,borderRadius:4}}/></div><span style={{color:s.convRate>=30?C.green:C.amber,fontWeight:700,fontSize:12}}>{s.convRate}%</span></div></td>
                <td style={{padding:"11px 14px"}}><span style={{background:s.pendFU>3?C.red+"22":C.amber+"22",color:s.pendFU>3?C.red:C.amber,borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:700}}>{s.pendFU}</span></td>
                <td style={{padding:"11px 14px"}}><div><div style={{background:C.s3,borderRadius:4,height:5}}><div style={{background:s.wonVal>=(s.meta||1)?C.green:C.accent,width:`${Math.min((s.wonVal/(s.meta||1))*100,100)}%`,height:5,borderRadius:4}}/></div><div style={{color:C.muted,fontSize:10,marginTop:2}}>{Math.round((s.wonVal/(s.meta||1))*100)}% de {fmtBRL(s.meta)}</div></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card>
          <h4 style={{color:C.text,margin:"0 0 14px",fontSize:13,fontWeight:600}}>Valor por Estágio</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byStage}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="name" stroke={C.muted} fontSize={10} tick={{angle:-20,textAnchor:"end"}} height={44}/>
              <YAxis stroke={C.muted} fontSize={10} tickFormatter={v=>v?Math.round(v/1000)+"k":""}/>
              <Tooltip formatter={v=>fmtBRL(v)} {...TTIP}/>
              <Bar dataKey="value" radius={[4,4,0,0]}>{byStage.map((s,i)=><Cell key={i} fill={SC[s.name]||C.accent}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h4 style={{color:C.text,margin:"0 0 12px",fontSize:13,fontWeight:600}}>Top Oportunidades</h4>
          {[...contacts].sort((a,b)=>b.value-a.value).slice(0,5).map(c=>{
            const sdr=sdrs.find(s=>s.id===c.assignedTo);
            return(
              <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                <div style={{flex:1}}><div style={{color:C.text,fontSize:13,fontWeight:500}}>{c.name}</div><div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}><span style={{color:C.muted,fontSize:11}}>{c.company}</span><StageBadge stage={c.stage}/>{sdr&&<SdrAvatar sdr={sdr} size={15}/>}</div></div>
                <span style={{color:C.accent,fontWeight:700,fontSize:13}}>{fmtBRL(c.value)}</span>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

// ===== TEAM =====
function TeamView({sdrs,setSdrs,contacts}){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({});
  const save=()=>{
    const sdr={...form,id:form.id||g(),initials:form.name.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase(),meta:parseInt(form.meta)||40000};
    if(form.id)setSdrs(p=>p.map(s=>s.id===sdr.id?sdr:s));else setSdrs(p=>[...p,sdr]);
    setModal(false);
  };
  const del=id=>{if(window.confirm("Remover SDR?"))setSdrs(p=>p.filter(s=>s.id!==id));};
  return(
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h2 style={{color:C.text,fontSize:20,fontWeight:700,margin:"0 0 3px"}}>Equipe de SDRs</h2><p style={{color:C.muted,fontSize:12,margin:0}}>Alterações sincronizadas em tempo real via Firebase</p></div>
        <Btn sz="s" onClick={()=>{setForm({name:"",email:"",meta:"40000",color:SDR_COLORS[sdrs.length%SDR_COLORS.length]});setModal(true);}}>+ Novo SDR</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
        {sdrs.map(s=>{
          const mine=contacts.filter(c=>c.assignedTo===s.id);
          const won=mine.filter(c=>c.stage==="Ganho");
          const wonVal=won.reduce((a,c)=>a+c.value,0);
          const pct=Math.min(Math.round((wonVal/(s.meta||1))*100),100);
          return(
            <Card key={s.id} st={{padding:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}><SdrAvatar sdr={s} size={44}/><div><div style={{color:C.text,fontSize:15,fontWeight:700}}>{s.name}</div><div style={{color:C.muted,fontSize:12}}>{s.email}</div></div></div>
                <div style={{display:"flex",gap:5}}>
                  <Btn v="g" sz="s" onClick={()=>{setForm({...s,meta:s.meta?.toString()});setModal(true);}}>✏</Btn>
                  <Btn v="g" sz="s" st={{color:C.red}} onClick={()=>del(s.id)}>✕</Btn>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                {[["Leads",mine.length,C.muted],["Abertos",mine.filter(c=>!["Ganho","Perdido"].includes(c.stage)).length,C.indigo],["Ganhos",won.length,C.green]].map(([l,v,c])=>(
                  <div key={l} style={{background:C.s2,borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{color:c,fontSize:18,fontWeight:800}}>{v}</div><div style={{color:C.dim,fontSize:10}}>{l}</div></div>
                ))}
              </div>
              <div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:11}}><span style={{color:C.muted}}>Meta mensal</span><span style={{color:pct>=100?C.green:C.text,fontWeight:600}}>{pct}%</span></div>
                <div style={{background:C.s3,borderRadius:6,height:8}}><div style={{background:pct>=100?C.green:s.color,width:`${pct}%`,height:8,borderRadius:6,transition:"width .5s"}}/></div>
                <div style={{color:C.dim,fontSize:10,marginTop:3}}>{fmtBRL(wonVal)} / {fmtBRL(s.meta)}</div>
              </div>
            </Card>
          );
        })}
      </div>
      {modal&&(
        <Modal title={form.id?"Editar SDR":"Novo SDR"} onClose={()=>setModal(false)}>
          <Field label="Nome Completo *"><Inp value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></Field>
          <Field label="E-mail"><Inp type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></Field>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Field label="Meta Mensal (R$)"><Inp type="number" value={form.meta} onChange={e=>setForm(p=>({...p,meta:e.target.value}))}/></Field>
            <Field label="Cor"><div style={{display:"flex",gap:7,flexWrap:"wrap",paddingTop:4}}>{SDR_COLORS.map(c=><button key={c} onClick={()=>setForm(p=>({...p,color:c}))} style={{width:26,height:26,borderRadius:"50%",background:c,border:form.color===c?"3px solid #fff":"2px solid transparent",cursor:"pointer"}}/>)}</div></Field>
          </div>
          {form.name&&<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><SdrAvatar sdr={{...form,initials:form.name.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase()}} size={38}/><span style={{color:C.muted,fontSize:13}}>Prévia</span></div>}
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn v="g" onClick={()=>setModal(false)}>Cancelar</Btn><Btn dis={!form.name} onClick={save}>Salvar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

// ===== WHATSAPP =====
function WhatsAppView({contacts,sdrs}){
  const [sel,setSel]=useState(null);
  const [tpl,setTpl]=useState("followup");
  const [custom,setCustom]=useState("");
  const [search,setSearch]=useState("");
  const templates={
    followup:c=>`Olá ${c.name}! 👋\n\nPassando para dar um follow-up sobre nossa conversa.\nTeve a oportunidade de analisar nossa proposta?\n\nFico à disposição! 😊`,
    proposal:c=>`Olá ${c.name}!\n\nConforme combinado, preparei uma proposta para a ${c.company}.\n\nPosso agendar 15min para apresentar? 🚀`,
    intro:c=>`Oi ${c.name}! 😊\n\nEntro em contato pois acredito que posso ajudar a ${c.company}.\n\nTeria 5 minutinhos para conversar?`,
    closing:c=>`Olá ${c.name}!\n\nTemos condição especial disponível até fim do mês. Posso explicar? ✨`,
  };
  const c=sel;
  const msg=c?(tpl==="custom"?custom:templates[tpl]?.(c)||""):"";
  const waLink=c?`https://wa.me/55${c.phone.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`:"#";
  const filtC=contacts.filter(x=>x.phone&&(!search||x.name.toLowerCase().includes(search.toLowerCase())));
  return(
    <div style={{padding:24}}>
      <h2 style={{color:C.text,fontSize:20,fontWeight:700,margin:"0 0 18px"}}>WhatsApp CRM</h2>
      <div style={{display:"grid",gridTemplateColumns:"255px 1fr",gap:16}}>
        <div>
          <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar..." st={{marginBottom:8}}/>
          <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",maxHeight:500,overflowY:"auto"}}>
            {filtC.map((x,i)=>{
              const sdr=sdrs.find(s=>s.id===x.assignedTo);
              return(
                <button key={x.id} onClick={()=>setSel(x)} style={{width:"100%",padding:"9px 11px",display:"flex",alignItems:"center",gap:8,background:sel?.id===x.id?C.accent+"18":i%2?C.s1:C.bg,border:"none",borderBottom:`1px solid ${C.border}`,cursor:"pointer",textAlign:"left"}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:C.s3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:sel?.id===x.id?C.accent:C.muted,border:`1px solid ${sel?.id===x.id?C.accent:C.border}`,flexShrink:0}}>{x.name[0].toUpperCase()}</div>
                  <div style={{flex:1,minWidth:0}}><div style={{color:sel?.id===x.id?C.accent:C.text,fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{x.name}</div><div style={{color:C.muted,fontSize:10}}>{x.phone}</div></div>
                  {sdr&&<SdrAvatar sdr={sdr} size={15}/>}
                </button>
              );
            })}
          </div>
        </div>
        {c?(
          <div>
            <Card st={{marginBottom:13,padding:12}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:38,height:38,borderRadius:"50%",background:C.s3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:C.accent,border:`2px solid ${C.accent}`}}>{c.name[0]}</div>
                <div style={{flex:1}}><div style={{color:C.text,fontWeight:600,fontSize:14}}>{c.name}</div><div style={{color:C.muted,fontSize:12}}>{c.company} • {c.phone}</div></div>
                <StageBadge stage={c.stage}/>
              </div>
            </Card>
            <div style={{display:"flex",gap:5,marginBottom:11,flexWrap:"wrap"}}>
              {[["followup","Follow-up"],["proposal","Proposta"],["intro","Introdução"],["closing","Fechamento"],["custom","Livre"]].map(([v,l])=>(
                <button key={v} onClick={()=>setTpl(v)} style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${tpl===v?C.accent:C.border}`,background:tpl===v?C.accent+"20":C.s2,color:tpl===v?C.accent:C.muted,cursor:"pointer",fontSize:11.5,fontWeight:600,transition:"all .15s"}}>{l}</button>
              ))}
            </div>
            {tpl==="custom"
              ?<textarea value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Mensagem personalizada..." style={{width:"100%",background:C.s2,border:`1px solid ${C.border}`,borderRadius:10,padding:12,color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",minHeight:120,resize:"vertical",fontFamily:"inherit"}}/>
              :<div style={{background:"#072c1c",border:"1px solid #25D36630",borderRadius:10,padding:13,whiteSpace:"pre-line",color:"#c8e6c9",fontSize:13,marginBottom:12,lineHeight:1.7,minHeight:100}}>{msg}</div>
            }
            <a href={waLink} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:7,background:"#25D366",color:"#fff",padding:"10px 18px",borderRadius:10,fontWeight:700,fontSize:14,textDecoration:"none",marginTop:10}}>💬 Abrir no WhatsApp</a>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:260,color:C.muted}}>
            <span style={{fontSize:40,marginBottom:8}}>💬</span>
            <div style={{fontSize:14,marginBottom:4}}>Selecione um contato</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== IMPORT =====
function ImportView({setContacts,setActivities,sdrs,currentSdr}){
  const [url,setUrl]=useState("");
  const [loading,setLoading]=useState(false);
  const [preview,setPreview]=useState(null);
  const [err,setErr]=useState("");
  const [mapping,setMapping]=useState({});
  const [done,setDone]=useState(0);
  const [defSdr,setDefSdr]=useState(currentSdr?.id||sdrs[0]?.id||"");
  const crmFields=["name","email","phone","company","stage","value","source","notes"];
  const fL={name:"Nome",email:"E-mail",phone:"Telefone",company:"Empresa",stage:"Estágio",value:"Valor",source:"Origem",notes:"Notas"};
  const parseCSV=text=>{
    const lines=text.trim().split("\n");
    const headers=lines[0].split(",").map(h=>h.trim().replace(/^"|"$/g,"").replace(/^\ufeff/,""));
    const rows=lines.slice(1).filter(l=>l.trim()).map(line=>headers.reduce((o,h,i)=>({...o,[h]:line.split(",")[i]?.trim().replace(/^"|"$/g,"")||""}),[  ]));
    return{headers,rows};
  };
  const fetch_=async()=>{
    if(!url.trim())return;
    setLoading(true);setErr("");setPreview(null);
    try{
      let csvUrl=url;
      const m=url.match(/\/spreadsheets\/d\/([^\/]+)/);
      if(m)csvUrl=`https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=0`;
      const res=await fetch(csvUrl);
      if(!res.ok)throw new Error("Não foi possível acessar. A planilha precisa ser pública.");
      const text=await res.text();
      const parsed=parseCSV(text);
      setPreview(parsed);
      const syns={name:["nome","name","contato","cliente"],email:["email","e-mail","mail"],phone:["telefone","phone","cel","celular","whatsapp"],company:["empresa","company"],value:["valor","value","preço"],source:["origem","source"],notes:["notas","notes","obs"]};
      const auto={};
      parsed.headers.forEach(h=>{const hl=h.toLowerCase();for(const[f,ss]of Object.entries(syns))if(ss.some(s=>hl.includes(s))){auto[h]=f;break;}});
      setMapping(auto);
    }catch(e){setErr(e.message);}
    setLoading(false);
  };
  const doImport=()=>{
    const nc=[];
    preview.rows.forEach(row=>{
      const nk=Object.keys(mapping).find(k=>mapping[k]==="name");
      if(!nk||!row[nk])return;
      const contact={id:g(),createdAt:tod(),lastContact:tod(),tags:[],stage:"Lead",score:50,assignedTo:defSdr};
      Object.entries(mapping).forEach(([col,field])=>{if(field&&row[col])contact[field]=row[col];});
      contact.value=parseFloat(contact.value)||0;
      nc.push(contact);
    });
    setContacts(p=>[...nc,...p]);
    setActivities(p=>[{id:g(),type:"deal",desc:`${nc.length} contatos importados e sincronizados`,cId:null,ts:new Date().toISOString(),sdrId:defSdr},...p]);
    setDone(nc.length);setPreview(null);setUrl("");
  };
  return(
    <div style={{padding:24}}>
      <h2 style={{color:C.text,fontSize:20,fontWeight:700,margin:"0 0 6px"}}>Importar Planilha</h2>
      <p style={{color:C.muted,fontSize:12,margin:"0 0 18px"}}>Importe do Google Sheets — dados salvos no Firebase e visíveis para toda a equipe</p>
      {done>0&&<div style={{background:C.green+"18",border:`1px solid ${C.green}44`,borderRadius:8,padding:12,marginBottom:14,color:C.green,fontSize:13,fontWeight:600}}>✅ {done} contatos importados e sincronizados!</div>}
      <Card st={{marginBottom:14}}>
        <h4 style={{color:C.text,margin:"0 0 9px",fontSize:13,fontWeight:600}}>📋 Como usar</h4>
        <ol style={{color:C.muted,fontSize:12,margin:0,padding:"0 0 0 16px",lineHeight:2}}>
          <li>No Google Sheets: <strong style={{color:C.text}}>Arquivo → Compartilhar → Publicar na web → CSV</strong></li>
          <li>Copie o link gerado e cole abaixo</li>
          <li>Mapeie as colunas, escolha o SDR responsável e importe</li>
        </ol>
      </Card>
      <Card st={{marginBottom:14}}>
        <Field label="URL do Google Sheets">
          <div style={{display:"flex",gap:8}}><Inp value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." st={{flex:1}}/><Btn dis={loading||!url} onClick={fetch_}>{loading?"Carregando...":"Carregar"}</Btn></div>
        </Field>
        <Field label="Atribuir leads ao SDR">
          <Sel value={defSdr} onChange={e=>setDefSdr(e.target.value)} st={{width:"auto"}}>{sdrs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Sel>
        </Field>
        {err&&<div style={{color:C.red,fontSize:12,marginTop:6}}>⚠ {err}</div>}
      </Card>
      {preview&&(
        <Card>
          <h4 style={{color:C.text,margin:"0 0 4px",fontSize:14,fontWeight:600}}>✅ {preview.rows.length} linhas encontradas</h4>
          <p style={{color:C.muted,fontSize:12,margin:"0 0 14px"}}>Mapeie as colunas da planilha para os campos do CRM:</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:13}}>
            {preview.headers.map(h=>(
              <div key={h} style={{display:"flex",alignItems:"center",gap:7}}>
                <span style={{color:C.muted,fontSize:12,width:105,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h}</span>
                <span style={{color:C.dim}}>→</span>
                <Sel value={mapping[h]||""} onChange={e=>setMapping(p=>({...p,[h]:e.target.value}))} st={{flex:1}}><option value="">Ignorar</option>{crmFields.map(f=><option key={f} value={f}>{fL[f]||f}</option>)}</Sel>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn v="g" onClick={()=>setPreview(null)}>Cancelar</Btn><Btn onClick={doImport}>⬆ Importar {preview.rows.length} Contatos</Btn></div>
        </Card>
      )}
    </div>
  );
}

// ===== AI ASSISTANT =====
function AIView({contacts,followUps,sdrs,currentSdr}){
  const [msgs,setMsgs]=useState([{role:"assistant",content:"Olá! Sou seu assistente de vendas com IA 🤖\n\nAnaliso seu pipeline e equipe em tempo real. Como posso ajudar?"}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const ctx=useMemo(()=>{
    const won=contacts.filter(c=>c.stage==="Ganho").length;
    const stgCounts=STAGES.map(s=>`${s}:${contacts.filter(c=>c.stage===s).length}`).join(", ");
    const sdrInfo=sdrs.map(s=>{const m=contacts.filter(c=>c.assignedTo===s.id);return`${s.name.split(" ")[0]}(leads:${m.length},ganhos:${m.filter(c=>c.stage==="Ganho").length})`;}).join("; ");
    return`CRM: ${contacts.length} contatos. Ganhos: ${won}. Estágios: ${stgCounts}. FU pendentes: ${followUps.filter(f=>!f.completed).length}. SDRs: ${sdrInfo}. Usuário: ${currentSdr?.name||"?"}`;
  },[contacts,followUps,sdrs,currentSdr]);
  const send=async()=>{
    if(!input.trim()||loading)return;
    const inp=input;
    setMsgs(p=>[...p,{role:"user",content:inp}]);
    setInput("");setLoading(true);
    try{
      const history=msgs.filter((_,i)=>i>0).map(m=>({role:m.role,content:m.content}));
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`Especialista em vendas B2B. Contexto: ${ctx}\n\nSeja direto e prático. Responda em português.`,messages:[...history,{role:"user",content:inp}]})});
      const data=await res.json();
      setMsgs(p=>[...p,{role:"assistant",content:data.content?.[0]?.text||"Erro ao processar."}]);
    }catch{setMsgs(p=>[...p,{role:"assistant",content:"Erro de conexão."}]);}
    setLoading(false);
  };
  const quick=["Quais leads priorizar hoje?","Compare performance dos SDRs","Crie script de follow-up","Como aumentar conversão?","Quem está perto da meta?"];
  return(
    <div style={{padding:24,height:"calc(100vh - 52px - 48px)",display:"flex",flexDirection:"column",boxSizing:"border-box"}}>
      <div style={{marginBottom:10}}><h2 style={{color:C.text,fontSize:20,fontWeight:700,margin:"0 0 3px"}}>✦ IA Assistente</h2><p style={{color:C.muted,fontSize:12,margin:0}}>Powered by Claude • Analisa dados em tempo real</p></div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
        {quick.map(p=><button key={p} onClick={()=>setInput(p)} style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 9px",color:C.muted,fontSize:11,cursor:"pointer"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>{p}</button>)}
      </div>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:9,marginBottom:10}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"78%",padding:"10px 14px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.role==="user"?C.accent:C.s2,color:m.role==="user"?C.bg:C.text,fontSize:13,lineHeight:1.65,border:m.role==="assistant"?`1px solid ${C.border}`:"none",whiteSpace:"pre-line"}}>{m.content}</div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:14,padding:"10px 14px",color:C.muted,fontSize:13}}>⟳ Analisando...</div></div>}
        <div ref={endRef}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Pergunte sobre leads, equipe, estratégias..." style={{flex:1,background:C.s2,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
        <Btn dis={loading||!input.trim()} onClick={send}>Enviar</Btn>
      </div>
    </div>
  );
}

// ===== SETTINGS =====
function SettingsView({contacts,followUps,activities,sdrs,setContacts,setFollowUps,setActivities,setSdrs}){
  const [importJSON,setImportJSON]=useState("");
  const [msg,setMsg]=useState("");
  const exportBackup=()=>{
    const data={contacts,followUps,activities,sdrs,exportedAt:new Date().toISOString()};
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download=`flowcrm-backup-${tod()}.json`;a.click();
  };
  const doImport=()=>{
    try{
      const data=JSON.parse(importJSON);
      if(data.contacts)setContacts(data.contacts);if(data.followUps)setFollowUps(data.followUps);
      if(data.activities)setActivities(data.activities);if(data.sdrs)setSdrs(data.sdrs);
      setMsg("✅ Dados restaurados!");setImportJSON("");
    }catch{setMsg("❌ JSON inválido.");}
  };
  return(
    <div style={{padding:24}}>
      <h2 style={{color:C.text,fontSize:20,fontWeight:700,margin:"0 0 20px"}}>Configurações</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card>
          <h4 style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 12px"}}>🔗 Firebase — Status</h4>
          <div style={{background:db?C.green+"18":C.red+"18",border:`1px solid ${db?C.green:C.red}44`,borderRadius:8,padding:12,color:db?C.green:C.red,fontSize:13,fontWeight:600,marginBottom:14}}>
            {db?"✅ Conectado — dados sincronizados em tempo real":"❌ Não configurado — verifique as variáveis de ambiente"}
          </div>
          <div style={{background:C.s2,borderRadius:8,padding:12}}>
            <div style={{color:C.muted,fontSize:12,marginBottom:8}}>Dados no banco</div>
            {[["Contatos",contacts.length,"👥"],["Follow-ups",followUps.length,"✅"],["Atividades",activities.length,"📋"],["SDRs",sdrs.length,"◑"]].map(([l,v,i])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.muted,fontSize:12}}>{i} {l}</span><span style={{color:C.text,fontSize:12,fontWeight:700}}>{v}</span></div>
            ))}
          </div>
        </Card>
        <Card>
          <h4 style={{color:C.text,fontSize:13,fontWeight:600,margin:"0 0 12px"}}>💾 Backup de Dados</h4>
          <p style={{color:C.muted,fontSize:12,margin:"0 0 12px",lineHeight:1.6}}>Exporte um backup completo em JSON e restaure quando precisar.</p>
          <Btn onClick={exportBackup} st={{width:"100%",marginBottom:14}}>⬇ Exportar Backup JSON</Btn>
          <Field label="Restaurar Backup (cole o JSON)">
            <textarea value={importJSON} onChange={e=>setImportJSON(e.target.value)} placeholder='{"contacts":[...],"followUps":[...],...}' style={{width:"100%",background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:12,outline:"none",boxSizing:"border-box",minHeight:70,resize:"vertical",fontFamily:"monospace"}}/>
          </Field>
          {msg&&<div style={{background:msg.startsWith("✅")?C.green+"18":C.red+"18",border:`1px solid ${msg.startsWith("✅")?C.green:C.red}44`,borderRadius:7,padding:"7px 12px",marginBottom:10,color:msg.startsWith("✅")?C.green:C.red,fontSize:12}}>{msg}</div>}
          <Btn v="s" sz="s" dis={!importJSON.trim()} onClick={doImport}>⬆ Restaurar</Btn>
        </Card>
        <Card>
          <h4 style={{color:C.red,fontSize:13,fontWeight:600,margin:"0 0 14px"}}>⚠ Zona de Risco</h4>
          <div style={{marginBottom:14}}>
            <div style={{color:C.text,fontSize:13,fontWeight:500,marginBottom:4}}>Restaurar dados de demonstração</div>
            <div style={{color:C.muted,fontSize:12,marginBottom:8}}>Substitui tudo pelos dados de exemplo.</div>
            <Btn v="s" sz="s" onClick={()=>{if(window.confirm("Restaurar demo?")){{setContacts(CONTACTS0);setFollowUps(FU0);setActivities(ACTS0);setSdrs(SDRS0);}}}}>🔄 Restaurar Demo</Btn>
          </div>
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12}}>
            <div style={{color:C.text,fontSize:13,fontWeight:500,marginBottom:4}}>Apagar todos os dados</div>
            <div style={{color:C.muted,fontSize:12,marginBottom:8}}>Remove permanentemente tudo do Firebase.</div>
            <Btn v="d" sz="s" onClick={()=>{if(window.confirm("Apagar TUDO permanentemente?")){{setContacts([]);setFollowUps([]);setActivities([]);}}}}>🗑 Apagar Tudo</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ===== APP ROOT =====
export default function App(){
  const [view,setView]=useState("dashboard");
  const [contacts,setContacts]=useState([]);
  const [followUps,setFollowUps]=useState([]);
  const [activities,setActivities]=useState([]);
  const [sdrs,setSdrs]=useState(SDRS0);
  const [currentSdr,setCurrentSdr]=useState(null);
  const [loaded,setLoaded]=useState(false);
  const [syncing,setSyncing]=useState(false);
  const [selContact,setSelContact]=useState(null);
  const saveTimer=useRef(null);

  useEffect(()=>{
    if(!db){
      setContacts(CONTACTS0);setFollowUps(FU0);setActivities(ACTS0);setSdrs(SDRS0);
      setCurrentSdr(SDRS0[0]);setLoaded(true);return;
    }
    let first=true;
    const unsubs=[
      fbListen("contacts",d=>{const a=toArr(d);if(a)setContacts(a);else if(first)setContacts(CONTACTS0);}),
      fbListen("followUps",d=>{const a=toArr(d);if(a)setFollowUps(a);else if(first)setFollowUps(FU0);}),
      fbListen("activities",d=>{const a=toArr(d);if(a)setActivities(a);else if(first)setActivities(ACTS0);}),
      fbListen("sdrs",d=>{
        const a=toArr(d);
        const list=a||SDRS0;
        if(a)setSdrs(a);else if(first)setSdrs(SDRS0);
        const saved=localStorage.getItem("crm_me");
        const me=saved?list.find(s=>s.id===saved):null;
        setCurrentSdr(me||list[0]);
      }),
    ];
    setTimeout(()=>{first=false;setLoaded(true);},1500);
    return()=>unsubs.forEach(u=>u());
  },[]);

  useEffect(()=>{
    if(!loaded||!db)return;
    clearTimeout(saveTimer.current);
    setSyncing(true);
    saveTimer.current=setTimeout(()=>{
      fbSet("contacts",contacts);fbSet("followUps",followUps);
      fbSet("activities",activities);fbSet("sdrs",sdrs);
      setTimeout(()=>setSyncing(false),1000);
    },1500);
    return()=>clearTimeout(saveTimer.current);
  },[contacts,followUps,activities,sdrs,loaded]);

  const handleSetSdr=useCallback(s=>{setCurrentSdr(s);localStorage.setItem("crm_me",s.id);},[]);
  const pendFU=followUps.filter(f=>!f.completed&&(!currentSdr||f.assignedTo===currentSdr?.id)).length;
  const selFresh=selContact?contacts.find(c=>c.id===selContact.id)||selContact:null;
  const props={contacts,followUps,setFollowUps,setContacts,setActivities,sdrs,setSdrs,currentSdr,setSelContact};

  if(!loaded){
    return(
      <div style={{height:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
        <div style={{fontSize:40}}>⚡</div>
        <div style={{color:C.accent,fontSize:18,fontWeight:700}}>FlowCRM</div>
        <div style={{color:C.muted,fontSize:13}}>{db?"Conectando ao Firebase...":"Carregando..."}</div>
      </div>
    );
  }

  return(
    <div style={{display:"flex",height:"100vh",background:C.bg,color:C.text,fontFamily:"system-ui,'Segoe UI',sans-serif",overflow:"hidden"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px;}select option{background:${C.s2};color:${C.text};}input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.6);}input::placeholder{color:${C.dim};}@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}`}</style>
      <Sidebar view={view} setView={setView} fu={pendFU} currentSdr={currentSdr} sdrs={sdrs} setCurrentSdr={handleSetSdr} syncing={syncing}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <Header contacts={contacts} followUps={followUps} setView={setView} setSelContact={setSelContact}/>
        <main style={{flex:1,overflowY:"auto"}}>
          {view==="dashboard"&&<Dashboard {...props}/>}
          {view==="contacts"&&<ContactsView {...props}/>}
          {view==="pipeline"&&<PipelineView {...props}/>}
          {view==="funnel"&&<FunnelView contacts={contacts} sdrs={sdrs}/>}
          {view==="followups"&&<FollowUpsView {...props}/>}
          {view==="reports"&&<ReportsView contacts={contacts} sdrs={sdrs} followUps={followUps}/>}
          {view==="team"&&<TeamView sdrs={sdrs} setSdrs={setSdrs} contacts={contacts}/>}
          {view==="whatsapp"&&<WhatsAppView contacts={contacts} sdrs={sdrs}/>}
          {view==="import"&&<ImportView setContacts={setContacts} setActivities={setActivities} sdrs={sdrs} currentSdr={currentSdr}/>}
          {view==="ai"&&<AIView {...props}/>}
          {view==="settings"&&<SettingsView contacts={contacts} followUps={followUps} activities={activities} sdrs={sdrs} setContacts={setContacts} setFollowUps={setFollowUps} setActivities={setActivities} setSdrs={setSdrs}/>}
        </main>
      </div>
      {selFresh&&<ContactDetail contact={selFresh} contacts={contacts} followUps={followUps} setFollowUps={setFollowUps} activities={activities} setActivities={setActivities} sdrs={sdrs} onClose={()=>setSelContact(null)} setContacts={setContacts} currentSdr={currentSdr}/>}
    </div>
  );
}
