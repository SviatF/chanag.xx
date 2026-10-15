import {describe,it,expect} from "vitest";
import {inspectCrossPageCalendar,reconcileRenderedCalendar} from "../scripts/crosspage-calendar-integrity.mjs";

const d=(date,tithi,nakshatra,paksha="Shukla",sunrise="06:20",end="07:30")=>
  `<main><div class="data-card"><small>Tithi</small><strong>${tithi}</strong><small>${paksha} Paksha · until ${end}</small></div><div class="data-card"><small>Nakshatra</small><strong>${nakshatra}</strong></div><div class="data-card"><small>Sunrise</small><strong>${sunrise}</strong></div></main>`;
const month=(city,date,tithi,nakshatra)=>
  `<main><div class="month-grid"><a href="/panchang/${city}/${date}"><strong>21</strong><small>${tithi}</small><small>${nakshatra}</small><small class="calendar-lunar-marker">${tithi}</small></a></div></main>`;
const vrat=(city,date,paksha)=>
  `<main><div class="city-directory"><a href="/panchang/${city}/${date}"><small>Saturday · ${paksha} Paksha</small><strong>${date}</strong><span>Sunrise 06:20 · Tithi until 07:30</span></a></div></main>`;
describe("Wave 3AK cross-page lunar source consistency",()=>{
  it("matches monthly Tithi and Nakshatra to real daily visible cards",()=>{
    const rows=[
      inspectCrossPageCalendar("/calendar/kanpur/2026/11",month("kanpur","2026-11-21","Dwadashi","Rohini")),
      inspectCrossPageCalendar("/panchang/kanpur/2026-11-21",d("2026-11-21","Dwadashi","Rohini"))
    ];
    const x=reconcileRenderedCalendar(rows);
    expect(x.monthRows).toBe(1);
    expect(x.matchedMonth).toBe(1);
    expect(x.contradictions).toEqual([]);
  });
  it("detects V5 month/Daily contradictions without pretending JPL is live",()=>{
    const rows=[
      inspectCrossPageCalendar("/calendar/kanpur/2026/11",month("kanpur","2026-11-21","Ekadashi","Rohini")),
      inspectCrossPageCalendar("/panchang/kanpur/2026-11-21",d("2026-11-21","Dwadashi","Rohini"))
    ];
    const x=reconcileRenderedCalendar(rows);
    expect(x.contradictions).toEqual([expect.objectContaining({field:"Tithi",expected:"Ekadashi",actual:"Dwadashi"})]);
  });
  it("checks Vrat sunrise reference labels only when Daily counterpart is present",()=>{
    const rows=[
      inspectCrossPageCalendar("/vrat/ekadashi/2026/kanpur",vrat("kanpur","2026-11-21","Shukla")),
      inspectCrossPageCalendar("/panchang/kanpur/2026-11-21",d("2026-11-21","Dwadashi","Rohini"))
    ];
    const x=reconcileRenderedCalendar(rows);
    expect(x.matchedVrat).toBe(1);
    expect(x.contradictions[0].field).toBe("Vrat sunrise Tithi");
    expect(x.contradictions[0].expected).toBe("Ekadashi");
  });
  it("rejects Vrat Paksha, sunrise or Tithi end mismatch even if Tithi label matches",()=>{
    const rows=[
      inspectCrossPageCalendar("/vrat/ekadashi/2026/kanpur",vrat("kanpur","2026-11-21","Shukla")),
      inspectCrossPageCalendar("/panchang/kanpur/2026-11-21",d("2026-11-21","Ekadashi","Rohini","Krishna","06:31","09:12"))
    ];
    const report=reconcileRenderedCalendar(rows);
    expect(report.contradictions.map(x=>x.field)).toEqual(expect.arrayContaining([
      "Vrat Paksha","Vrat sunrise clock","Vrat Tithi end clock"
    ]));
    expect(report.contradictions.map(x=>x.field)).not.toContain("Vrat sunrise Tithi");
  });
  it("does not invent a conflict if the counterpart is absent from the sitemap",()=>{
    const x=reconcileRenderedCalendar([
      inspectCrossPageCalendar("/vrat/purnima/2027/patna",vrat("patna","2027-01-31","Shukla"))
    ]);
    expect(x.contradictions).toHaveLength(0);
    expect(x.missingCounterparts).toHaveLength(1);
  });
  it("does not cross-contaminate two cities on the same date",()=>{
    const rows=[
      inspectCrossPageCalendar("/calendar/kanpur/2026/11",month("kanpur","2026-11-21","Dwadashi","Rohini")),
      inspectCrossPageCalendar("/panchang/lucknow/2026-11-21",d("2026-11-21","Dwadashi","Rohini"))
    ];
    const x=reconcileRenderedCalendar(rows);
    expect(x.matchedMonth).toBe(0);
    expect(x.missingCounterparts).toHaveLength(1);
  });
});
