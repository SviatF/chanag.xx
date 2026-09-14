import {describe,expect,it} from "vitest";
import type {GscRow,GscSummary} from "../lib/gsc";
import type {GscSeoOsDataset} from "../lib/gsc-seo-os";
import {buildPageOpportunities,buildQueryIntelligence} from "../lib/seo-operating-system";

const zeroSummary:GscSummary={clicks:0,impressions:0,ctr:0,position:0};

function row(keys:string[],impressions:number,position:number,clicks=0):GscRow{
  return {keys,impressions,clicks,ctr:impressions?clicks/impressions:0,position};
}

function makeDataset(input:{
  q28:GscRow[];
  qp28:GscRow[];
  q7?:GscRow[];
  qp7?:GscRow[];
  prev7?:GscRow[];
  prevQp7?:GscRow[];
}):GscSeoOsDataset{
  return {
    siteUrl:"sc-domain:panchvani.com",
    generatedAt:"2026-09-15T00:00:00.000Z",
    current7d:{startDate:"2026-09-08",endDate:"2026-09-14",summary:zeroSummary,queries:input.q7??[],queryPages:input.qp7??[]},
    previous7d:{startDate:"2026-09-01",endDate:"2026-09-07",summary:zeroSummary,queries:input.prev7??[],queryPages:input.prevQp7??[]},
    current28d:{startDate:"2026-08-18",endDate:"2026-09-14",summary:zeroSummary,queries:input.q28,queryPages:input.qp28,pages:[],countries:[],daily:[]},
    previous28d:{startDate:"2026-07-21",endDate:"2026-08-17",summary:zeroSummary},
  };
}

describe("SEO operating system cannibalization evidence",()=>{
  it("does not treat the Panchvani navigational query as cannibalization",()=>{
    const dataset=makeDataset({
      q28:[row(["panchvani"],29,6)],
      qp28:[
        row(["panchvani","https://panchvani.com/about"],14,6.9),
        row(["panchvani","https://panchvani.com/regional"],7,4.6),
        row(["panchvani","https://panchvani.com/"],3,3),
        row(["panchvani","https://panchvani.com/knowledge/panchang"],3,8),
        row(["panchvani","https://panchvani.com/tools"],2,4),
      ],
      q7:[row(["panchvani"],20,5)],
      qp7:[row(["panchvani","https://panchvani.com/about"],10,6),row(["panchvani","https://panchvani.com/regional"],5,4)],
      prev7:[row(["panchvani"],5,7)],
      prevQp7:[row(["panchvani","https://panchvani.com/about"],3,7),row(["panchvani","https://panchvani.com/regional"],2,6)],
    });

    const query=buildQueryIntelligence(dataset,{})[0];
    expect(query?.query).toBe("panchvani");
    expect(query?.cannibalizationRisk).toBe("NONE");
    expect(query?.statuses).not.toContain("CANNIBALIZATION");
    expect(query?.statuses).not.toContain("QUICK_WIN");
    expect(query?.statuses).not.toContain("GROWING");
  });

  it("keeps brand-only pages out of the active optimization queue",()=>{
    const dataset=makeDataset({
      q28:[row(["panchvani"],21,5)],
      qp28:[
        row(["panchvani","https://panchvani.com/about"],14,6.9),
        row(["panchvani","https://panchvani.com/regional"],7,4.6),
      ],
    });

    const pages=buildPageOpportunities(dataset,{});
    const about=pages.find(page=>page.url==="https://panchvani.com/about");
    const regional=pages.find(page=>page.url==="https://panchvani.com/regional");

    for(const page of [about,regional]){
      expect(page).toBeDefined();
      expect(page?.action).toBe("WAIT");
      expect(page?.cannibalizationRisk).toBe("NONE");
      expect(page?.impressions).toBe(0);
      expect(page?.topQuery).toBe("—");
      expect(page?.internalLinkCandidates).toEqual([]);
    }
  });

  it("flags genuine non-brand intent splitting only when evidence is strong",()=>{
    const query="wedding muhurat delhi";
    const primary="https://panchvani.com/muhurat/wedding/2026/09/delhi";
    const competitor="https://panchvani.com/muhurat/wedding/2026/delhi";
    const stray="https://panchvani.com/about";
    const dataset=makeDataset({
      q28:[row([query],40,8)],
      qp28:[row([query,primary],22,7),row([query,competitor],17,9),row([query,stray],1,16)],
      q7:[row([query],18,8)],
      qp7:[row([query,primary],10,7),row([query,competitor],8,9)],
      prev7:[row([query],16,9)],
      prevQp7:[row([query,primary],9,8),row([query,competitor],7,10)],
    });

    const intel=buildQueryIntelligence(dataset,{})[0];
    expect(intel?.cannibalizationRisk).toBe("HIGH");
    expect(intel?.statuses).toContain("CANNIBALIZATION");

    const pages=buildPageOpportunities(dataset,{});
    expect(pages.find(page=>page.url===primary)?.cannibalizationRisk).toBe("HIGH");
    expect(pages.find(page=>page.url===primary)?.action).toBe("FIX");
    expect(pages.find(page=>page.url===competitor)?.cannibalizationRisk).toBe("HIGH");
    expect(pages.find(page=>page.url===competitor)?.action).toBe("FIX");
    expect(pages.find(page=>page.url===stray)?.cannibalizationRisk).toBe("NONE");
    expect(pages.find(page=>page.url===stray)?.action).toBe("WAIT");
  });

  it("does not escalate tiny split samples into cannibalization",()=>{
    const query="hindu calendar guide";
    const dataset=makeDataset({
      q28:[row([query],7,11)],
      qp28:[
        row([query,"https://panchvani.com/hindu-calendar/2026"],4,10),
        row([query,"https://panchvani.com/knowledge/hindu-months"],3,12),
      ],
    });

    const intel=buildQueryIntelligence(dataset,{})[0];
    expect(intel?.cannibalizationRisk).toBe("NONE");
    expect(intel?.statuses).not.toContain("CANNIBALIZATION");
  });

  it("never falls back to unrelated global internal-link candidates",()=>{
    const dataset=makeDataset({
      q28:[row(["about panchvani methodology"],8,15),row(["ganesh chaturthi date"],30,8)],
      qp28:[
        row(["about panchvani methodology","https://panchvani.com/about"],8,15),
        row(["ganesh chaturthi date","https://panchvani.com/festivals/ganesh-chaturthi/2026/ahmedabad"],30,8),
      ],
    });

    const about=buildPageOpportunities(dataset,{}).find(page=>page.url==="https://panchvani.com/about");
    expect(about?.internalLinkCandidates).toEqual([]);
    expect(about?.concreteAction).not.toContain("ganesh-chaturthi");
  });
});
