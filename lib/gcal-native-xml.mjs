/** Strict parser for original Windows GCal 11 calendar XML; research only. */
const months={Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12"};
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]));
function civil(s){
 const m=String(s).match(/^(\d{1,2}) ([A-Z][a-z]{2}) (20\d{2})$/);
 if(!m||!months[m[2]])throw Error("Invalid GCal day "+s);
 const value=m[3]+"-"+months[m[2]]+"-"+m[1].padStart(2,"0");
 if(new Date(value+"T00:00:00Z").toISOString().slice(0,10)!==value)throw Error("Invalid Gregorian day");
 return value;
}
function tag(s,name){
 const m=s.match(new RegExp("<"+name+"\\b([^>]*)>","i"));
 return m?attrs(m[1]):null;
}
function inside(s,parent,child){
 const m=s.match(new RegExp("<"+parent+"\\b[^>]*>([\\s\\S]*?)<\\/"+parent+">","i"));
 return m?tag(m[1],child):null;
}
export function isGcalEkadashiFast(tithi,festivals){
 return /(?:Ekadasi|Dvadasi) \(suitable for fasting\)/i.test(tithi)||
    festivals.some(name=>/^Fasting for .+Ekadasi/i.test(name));
}
export function parseGcalNativeXml(xml,{city,year,lat,lng}){
 if(!xml.includes('name="Calendar" version="GCal 11"'))throw Error("Not original GCal 11 XML");
 const raw=xml.match(/<request\b[^>]*>([\s\S]*?)<\/request>/);
 if(!raw)throw Error("Missing native request provenance");
 const args=Object.fromEntries([...raw[1].matchAll(/<arg\b([^>]*)\/>/g)].map(x=>{
  const v=attrs(x[1]);return [v.name,v.val];
 }));
 if(Math.abs(Number(args.latitude)-lat)>0.012||Math.abs(Number(args.longitude)-lng)>0.012)throw Error("GCal coordinate mismatch "+city);
 if(Number(args.timezone)!==5.5||args.dst!=="0")throw Error("Invalid local timezone or daylight saving");
 const days=[];
 for(const m of xml.matchAll(/<day\b([^>]*)>([\s\S]*?)<\/day>/g)){
  const date=civil(attrs(m[1]).date),s=m[2];
  if(!date.startsWith(year+"-"))throw Error("Wrong GCal civil year");
  const sunrise=tag(s,"sunrise"),tithi=inside(s,"sunrise","tithi"),arunodaya=inside(s,"arunodaya","tithi");
  if(!sunrise||!tithi||!arunodaya)throw Error("Missing sunrise/arunodaya "+date);
  const festivals=[...s.matchAll(/<festival\b([^>]*)\/>/g)].map(x=>attrs(x[1]).name);
  days.push({date,sunrise:sunrise.time,tithi:tithi.name,arunodaya:arunodaya.name,
   fast:isGcalEkadashiFast(tithi.name,festivals),
   nonEkadashiFast:/<fast\b/i.test(s)&&!isGcalEkadashiFast(tithi.name,festivals),
   excluded:/not suitable for fasting/i.test(tithi.name),
   mahadvadasi:festivals.filter(v=>/Mahadvadasi/i.test(v)),
   parana:tag(s,"parana")?{from:tag(s,"parana").from??null,to:tag(s,"parana").to??null}:null});
 }
 const expected=(Date.UTC(year+1,0,1)-Date.UTC(year,0,1))/86400000;
 if(Number(args.daycount)!==expected||days.length!==expected)throw Error("Incomplete native GCal year "+city+"/"+year+": "+days.length);
 if(days[0].date!==year+"-01-01"||days.at(-1).date!==year+"-12-31"||new Set(days.map(d=>d.date)).size!==expected)throw Error("Missing or duplicate native days");
 return {source:{city,year,lat:Number(args.latitude),lng:Number(args.longitude),timezone:5.5,engine:"Original GCal 11 Windows executable"},
 summary:{days:days.length,fasts:days.filter(d=>d.fast).length,paranas:days.filter(d=>d.parana).length,
 excluded:days.filter(d=>d.excluded).length,mahadvadasi:days.reduce((n,d)=>n+d.mahadvadasi.length,0),
 paranaWithNoDwadashiSunrise:days.filter(d=>d.parana&&!/^Dvadasi/i.test(d.tithi)).length},
 days};
}
