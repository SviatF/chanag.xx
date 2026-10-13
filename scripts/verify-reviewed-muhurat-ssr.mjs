/**
 * Review gate for fixed, sourced ritual closure pages.
 * This uses actual SSR HTML; component-source string assertions alone are not
 * evidence that the deployed route renders the intended copy.
 */
const baseFlag=process.argv.find(arg=>arg.startsWith("--base-url="));
const base=(baseFlag?.slice("--base-url=".length)||"http://127.0.0.1:3000").replace(/\/$/,"");
const expected=[8,9,10];
const failures=[];
const results=[];
for(const month of expected){
  const slug=String(month).padStart(2,"0");
  const monthName=new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"UTC"})
    .format(new Date(Date.UTC(2026,month-1,1)));
  for(const path of [`/muhurat/wedding/2026/${slug}`,`/muhurat/wedding/2026/${slug}/mumbai`]){
    let response;
    try{response=await fetch(base+path,{headers:{"Accept":"text/html","Cache-Control":"no-cache"}});}
    catch(error){failures.push(`${path}: could not fetch ${String(error)}`);continue;}
    const html=await response.text();
    const asserts=[
      [response.status===200,`HTTP ${response.status} instead of 200`],
      [html.includes(`No traditional Marathi wedding Muhurat dates in Mumbai in ${monthName} 2026`),"missing month-specific reviewed headline"],
      [html.includes("Traditional Marathi marriage dates"),"missing reviewed status data card"],
      [/Traditional Marathi marriage dates<\/small><strong>0<\/strong>/.test(html),"zero actual traditional dates not rendered"],
      [html.includes("Chaturmas"),"no source-supported month-level observance explanation"],
      [html.includes("Marriage observances differ by community and tradition"),"missing tradition-difference disclosure"],
      [!html.includes("100/100 window-availability score"),"false score still rendered"],
      [!html.includes("dates survive the lunar screen"),"generic candidate ranking still rendered"],
      [!html.includes("Why 2026-10-12 gets"),"old candidate-ranking block still rendered"]
    ];
    for(const [passed,message] of asserts)if(!passed)failures.push(`${path}: ${message}`);
    results.push({path,status:response.status,month:monthName,failures:asserts.filter(x=>!x[0]).length});
  }
}
console.log("[muhurat-ceremony-truth] checked "+results.length+" SSR routes (3 months × Mumbai city and Mumbai baseline)");
for(const r of results)console.log("[muhurat-ceremony-truth] "+r.path+" HTTP "+r.status+" failures="+r.failures);
if(failures.length){
  for(const failure of failures)console.error("[muhurat-ceremony-truth] FAIL "+failure);
  process.exitCode=1;
}else console.log("[muhurat-ceremony-truth] PASS all 6 reviewed ceremony closure routes");
