"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, LocateFixed, MapPin, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { City } from "@/lib/cities";

function distanceKm(aLat:number,aLng:number,bLat:number,bLng:number){
  const r=6371;
  const dLat=(bLat-aLat)*Math.PI/180;
  const dLng=(bLng-aLng)*Math.PI/180;
  const s=Math.sin(dLat/2)**2+Math.cos(aLat*Math.PI/180)*Math.cos(bLat*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2*r*Math.asin(Math.sqrt(s));
}

export default function CityCommand({city,cities}:{city:City;cities:City[]}){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState("");
  const [locating,setLocating]=useState(false);
  const router=useRouter();
  const pathname=usePathname();

  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase();
    if(!q)return cities.slice(0,12);
    return cities.filter(c=>(c.name+" "+c.state).toLowerCase().includes(q)).slice(0,20);
  },[query,cities]);

  function go(next:City){
    document.cookie=`panchang_city=${next.slug}; path=/; max-age=31536000; samesite=lax`;
    const parts=pathname.split("/").filter(Boolean);

    if(pathname==="/") router.push("/?city="+next.slug);
    else if(parts[0]==="panchang"){
      parts[1]=next.slug;
      router.push("/"+parts.join("/"));
    }
    else if(parts[0]==="calendar"){
      parts[1]=next.slug;
      router.push("/"+parts.join("/"));
    }
    else if(parts[0]==="regional"&&parts.length>=2){
      parts[2]=next.slug;
      router.push("/"+parts.join("/"));
    }
    else if(parts[0]==="muhurat"&&parts.length>=4){
      if(parts.length>=5)parts[4]=next.slug;
      else parts.push(next.slug);
      router.push("/"+parts.join("/"));
    }
    else if(parts[0]==="festivals"&&parts.length>=3){
      if(parts.length>=4)parts[3]=next.slug;
      else parts.push(next.slug);
      router.push("/"+parts.join("/"));
    }
    else if(parts[0]==="tools"&&parts[1]==="choghadiya"){
      parts[2]=next.slug;
      router.push("/"+parts.join("/"));
    }
    else router.push("/panchang/"+next.slug);

    setOpen(false);
    setQuery("");
  }

  function useLocation(){
    if(!navigator.geolocation)return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos=>{
        const {latitude,longitude}=pos.coords;
        const nearest=[...cities].sort((a,b)=>distanceKm(latitude,longitude,a.lat,a.lng)-distanceKm(latitude,longitude,b.lat,b.lng))[0];
        setLocating(false);
        if(nearest)go(nearest);
      },
      ()=>setLocating(false),
      {enableHighAccuracy:false,timeout:8000,maximumAge:600000}
    );
  }

  return <>
    <button className="location-pill location-button" onClick={()=>setOpen(true)} type="button" aria-label={`Choose city. Current city: ${city.name}, ${city.state}`}>
      <MapPin className="location-pin" size={14} aria-hidden="true"/>
      <span className="location-label">
        <span className="location-city">{city.name}</span>
        <span className="location-state"> · {city.state}</span>
      </span>
      <ChevronDown className="location-select-chevron" size={13} aria-hidden="true"/>
    </button>
    {open?<div className="city-overlay" role="dialog" aria-modal="true">
      <button className="city-backdrop" aria-label="Close city selector" onClick={()=>setOpen(false)}/>
      <section className="city-command">
        <div className="city-command-head">
          <div><small>YOUR LOCATION</small><h2>Choose your city</h2></div>
          <button onClick={()=>setOpen(false)} aria-label="Close"><X size={18}/></button>
        </div>
        <div className="city-search"><Search size={17}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Mumbai, Pune, Delhi…"/></div>
        <button className="detect-city" onClick={useLocation} disabled={locating}>
          <LocateFixed size={17}/><span>{locating?"Finding nearest supported city…":"Use my current location"}</span>
        </button>
        <div className="city-results">
          {filtered.map(item=><button key={item.slug} onClick={()=>go(item)} className={item.slug===city.slug?"selected":""}>
            <span><strong>{item.name}</strong><small>{item.state}</small></span>
            {item.slug===city.slug?<Check size={16}/>:null}
          </button>)}
        </div>
        <p className="city-note">Panchang timings change with local sunrise and sunset, so the selected city matters.</p>
      </section>
    </div>:null}
  </>;
}
