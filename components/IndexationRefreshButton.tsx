"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";

export default function IndexationRefreshButton({disabled=false}:{disabled?:boolean}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  async function run(){
    if(disabled||busy)return;
    setBusy(true);setError(null);
    try{
      const response=await fetch("/api/admin/indexation",{method:"POST"});
      const json=await response.json() as {error?:string};
      if(!response.ok)throw new Error(json.error??`Indexation refresh failed (${response.status})`);
      router.refresh();
    }catch(err){setError(err instanceof Error?err.message:"Indexation refresh failed.");}
    finally{setBusy(false);}
  }
  return <span><button type="button" className="admin-badge activate" disabled={disabled||busy} onClick={run}>{busy?"Inspecting…":"Run priority inspection"}</button>{error?<small>{error}</small>:null}</span>;
}
