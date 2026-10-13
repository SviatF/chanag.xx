/**
 * SSR factual safety gate (local production build, not externally certified).
 * Dates are only described as excluded under the named Marathi convention.
 */
const baseFlag=process.argv.find(arg=>arg.startsWith("--base-url="));
const base=(baseFlag?.slice("--base-url=".length)||"http://127.0.0.1:3000").replace(/\/$/,"");
const YEARS=[2025,2026,2027], MONTHS=[8,9,10];
const pilotCities={
  mumbai:"Mumbai",pune:"Pune",nagpur:"Nagpur",thane:"Thane",
  "pimpri-chinchwad":"Pimpri-Chinchwad",nashik:"Nashik",
};
const extraMaharashtraCities={
  "kalyan-dombivli":"Kalyan-Dombivli","vasai-virar":"Vasai-Virar",
  aurangabad:"Aurangabad","navi-mumbai":"Navi Mumbai",solapur:"Solapur",
};
const paths=[];
for(const year of YEARS)for(const month of MONTHS){
  const slug=String(month).padStart(2,"0");
  paths.push({path:`/muhurat/wedding/${year}/${slug}`,year,month,city:"Mumbai",baseline:true});
  for(const [city,cityName] of Object.entries(pilotCities))
    paths.push({path:`/muhurat/wedding/${year}/${slug}/${city}`,year,month,city:cityName,baseline:false});
  if(year===2026&&month===10)
    for(const [city,cityName] of Object.entries(extraMaharashtraCities))
      paths.push({path:`/muhurat/wedding/${year}/${slug}/${city}`,year,month,city:cityName,baseline:false});
}
// Same source-reviewed month-level closure applies to customary Marathi
// Griha Pravesh ONLY in 2026 (not 2025/2027).
for(const month of MONTHS){
  const mm=String(month).padStart(2,"0");
  paths.push({path:`/muhurat/griha-pravesh/2026/${mm}`,year:2026,month,city:"Mumbai",baseline:true});
  for(const [slug,name] of Object.entries(pilotCities))
    paths.push({path:`/muhurat/griha-pravesh/2026/${mm}/${slug}`,year:2026,month,city:name,baseline:false});
}
const failures=[];
let passes=0;
for(const item of paths){
  const monthName=new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"UTC"}).format(new Date(Date.UTC(item.year,item.month-1,1)));
  let response;
  try{response=await fetch(base+item.path,{headers:{"Accept":"text/html","Cache-Control":"no-cache"},signal:AbortSignal.timeout(25000)});}
  catch(error){failures.push(item.path+": fetch failed "+String(error));continue;}
  const html=await response.text();
  // React SSR emits comment separators between dynamic text nodes; normalize only those.
  const readableHtml=html.replace(/<!--\s*-->/g,"");
  const isGriha=item.path.includes("/griha-pravesh/");
  const expectedTitle=isGriha
    ?`No customary Marathi Griha Pravesh Muhurat dates in ${item.city} in ${monthName} ${item.year}`
    :`No traditional Marathi wedding Muhurat dates in ${item.city} in ${monthName} ${item.year}`;
  const expectedDateLabel=isGriha?"Traditional Marathi house-entry dates":"Traditional Marathi marriage dates";
  const required=[
    [response.status===200,"HTTP "+response.status],
    [html.includes(expectedTitle),"incorrect city/year/event zero-date headline"],
    [html.includes(expectedDateLabel),"missing event-specific customary-calendar data card"],
    [html.includes(`<small>${expectedDateLabel}</small><strong>0</strong>`),"nonzero or missing event-specific zero count"],
    [isGriha?(html.includes("restricted lunar months")&&html.includes("planetary Asta")):html.includes("Chaturmas"),"missing accurate event-specific restriction reasoning"],
    [html.includes("not a blanket prohibition"),"missing community/tradition caveat"],
    [!html.includes("Why 2026-10-12 gets")&&!html.includes("dates survive the lunar screen"),"old unqualified ranking"],
    [!html.includes("100/100 window-availability score"),"fictitious certainty remains"],
  ];
  if(item.year!==2026)required.push([html.includes("Exact Chaturmas boundary instants are not independently established"),"invented Chaturmas boundaries or missing uncertainty"]);
  if(item.city!=="Mumbai"){
    const slug=item.path.split("/").at(-1);
    const actualHref=`/panchang/${slug}/${item.year}-${String(item.month).padStart(2,"0")}-12`;
    required.push([html.includes(`href="${actualHref}"`)&&readableHtml.includes(`${item.city} Panchang for 12 ${monthName} ${item.year}`),"missing correctly localized Panchang href/text"]);
  }
  const errors=required.filter(x=>!x[0]).map(x=>x[1]);
  if(errors.length)failures.push(item.path+": "+errors.join("; "));
  else passes++;
}
console.log("[marathi-ritual-ssr] "+passes+"/"+paths.length+" paths passed: Vivah 2025–27 and Griha 2026; source-reviewed month-level Maharashtra routes");
if(failures.length){for(const failure of failures.slice(0,35))console.error("[marathi-ritual-ssr] FAIL "+failure);process.exitCode=1;}
