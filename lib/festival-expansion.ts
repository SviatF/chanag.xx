import {allFestivals,festivalBySlugYear,festivalsByYear,festivalsForYear,type Festival} from "./festivals";
import {todayInIndia} from "./dates";

export type FestivalDatasetIssue={
  code:"INVALID_DATE"|"YEAR_MISMATCH"|"DUPLICATE_SLUG"|"UNKNOWN_SLUG";
  year:number;
  slug:string;
  detail:string;
};

export type FestivalYearCoverage={
  year:number;
  expected:number;
  present:number;
  coveragePct:number;
  missing:string[];
  issues:FestivalDatasetIssue[];
  valid:boolean;
};

const catalogSource=(festivalsByYear[2026]??Object.values(festivalsByYear).flat()).slice();
export const festivalCatalog=[...new Map(catalogSource.map(item=>[item.slug,{slug:item.slug,name:item.name}])).values()]
  .sort((a,b)=>a.name.localeCompare(b.name));
export const festivalCatalogSlugs=festivalCatalog.map(item=>item.slug);
export const festivalDatasetYears=Object.keys(festivalsByYear).map(Number).sort((a,b)=>a-b);
const catalogSlugSet=new Set(festivalCatalogSlugs);

function validIsoDate(value:string,year:number){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(value+"T00:00:00Z");
  return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value&&date.getUTCFullYear()===year;
}

export function validateFestivalYear(year:number):FestivalYearCoverage{
  const rows=festivalsForYear(year);
  const issues:FestivalDatasetIssue[]=[];
  const seen=new Set<string>();
  for(const row of rows){
    if(seen.has(row.slug))issues.push({code:"DUPLICATE_SLUG",year,slug:row.slug,detail:`${row.slug} appears more than once in ${year}.`});
    seen.add(row.slug);
    if(!catalogSlugSet.has(row.slug))issues.push({code:"UNKNOWN_SLUG",year,slug:row.slug,detail:`${row.slug} is not present in the canonical festival catalog.`});
    if(!validIsoDate(row.date,year))issues.push({code:row.date.startsWith(String(year)+"-")?"INVALID_DATE":"YEAR_MISMATCH",year,slug:row.slug,detail:`${row.date} is not a valid ISO date inside ${year}.`});
  }
  const missing=festivalCatalogSlugs.filter(slug=>!seen.has(slug));
  const expected=festivalCatalogSlugs.length;
  const present=rows.length;
  return {year,expected,present,coveragePct:expected?Math.round((present/expected)*100):0,missing,issues,valid:present>0&&issues.length===0};
}

export function festivalCoverageSnapshot(){
  return festivalDatasetYears.map(validateFestivalYear);
}

export function festivalDateIsValidated(slug:string,year:number){
  const row=festivalBySlugYear(slug,year);
  return Boolean(row&&catalogSlugSet.has(slug)&&validIsoDate(row.date,year));
}

export function festivalIndexYears(){
  const current=todayInIndia().getUTCFullYear();
  return festivalDatasetYears.filter(year=>year>=current-1&&year<=current+2&&validateFestivalYear(year).valid);
}

export function festivalPageIsIndexable(slug:string,year:number){
  return festivalIndexYears().includes(year)&&festivalDateIsValidated(slug,year);
}

export function festivalYearSiblings(slug:string,year:number){
  const years=festivalDatasetYears.filter(candidate=>candidate!==year&&festivalPageIsIndexable(slug,candidate));
  return years.map(candidate=>festivalBySlugYear(slug,candidate)).filter((item):item is Festival=>Boolean(item));
}

export function nextValidatedFestival(date:Date):Festival|null{
  const iso=date.toISOString().slice(0,10);
  return allFestivals.find(item=>item.date>=iso&&festivalDateIsValidated(item.slug,item.year))??null;
}
