"use client";

import {FormEvent,useState} from "react";

export default function GoldRateValidationForm(){
  const [date,setDate]=useState("");
  const [rate,setRate]=useState("");
  const [note,setNote]=useState("");
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState<string|null>(null);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(saving)return;
    const ibja999Per10g=Number(rate);
    if(!date||!Number.isFinite(ibja999Per10g)||ibja999Per10g<=0){setMessage("Enter a date and positive IBJA 999 per-10g benchmark.");return;}
    setSaving(true);setMessage(null);
    try{
      const response=await fetch("/api/admin/gold-rate/validation",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({date,ibja999Per10g,note})});
      const json=await response.json() as {error?:string};
      if(!response.ok)throw new Error(json.error??`Validation entry failed (${response.status})`);
      setMessage("Saved. Reloading validation log…");
      window.location.reload();
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to save validation entry.");setSaving(false);}
  }

  return <form onSubmit={submit} className="admin-panel" style={{display:"grid",gap:12}}>
    <div className="admin-panel-head"><div><small>MANUAL IBJA CHECK</small><h2>Add daily benchmark</h2><p>Enter the published IBJA 999 per-10g benchmark. Production does not scrape IBJA.</p></div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
      <label><small>Date (IST)</small><input type="date" value={date} onChange={event=>setDate(event.target.value)} required/></label>
      <label><small>IBJA 999 · ₹ per 10g</small><input type="number" min="1" step="0.01" value={rate} onChange={event=>setRate(event.target.value)} required/></label>
      <label><small>Note</small><input value={note} onChange={event=>setNote(event.target.value)} placeholder="Source check / publication time"/></label>
    </div>
    <div><button type="submit" disabled={saving}>{saving?"Saving…":"Save benchmark"}</button>{message?<span className="admin-muted" style={{marginLeft:12}}>{message}</span>:null}</div>
  </form>;
}
