import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {festivalBySlugYear} from "../lib/festivals";
import {isMuhuratIndexable,isPriorityCity} from "../lib/seo-policy";
import {
  buildDailyTopicalGraph,
  buildMuhuratTopicalGraph,
  indexedPeerCities,
  regionalLinksForCity
} from "../lib/topical-links";

describe("Panchvani topical internal link graph",()=>{
  it("uses only active indexed cities for peer links",()=>{
    const city=findCityBySlug("mumbai")!;
    const peers=indexedPeerCities(city,8);
    expect(peers.length).toBeGreaterThan(0);
    expect(peers.every(peer=>isPriorityCity(peer.slug))).toBe(true);
    expect(peers.some(peer=>peer.state===city.state)).toBe(true);
  });

  it("uses the festival's real year instead of a hardcoded year",()=>{
    const city=findCityBySlug("delhi")!;
    const festival=festivalBySlugYear("diwali",2027)!;
    const groups=buildDailyTopicalGraph(city,new Date("2027-10-20T06:00:00Z"),festival);
    const links=groups.flatMap(group=>group.links);
    expect(links.some(link=>link.href===`/festivals/diwali/2027/delhi`)).toBe(true);
    expect(links.some(link=>link.href===`/festivals/diwali/2026/delhi`)).toBe(false);
  });

  it("only emits relevant indexable regional variants",()=>{
    const kolkata=findCityBySlug("kolkata")!;
    const chennai=findCityBySlug("chennai")!;
    const delhi=findCityBySlug("delhi")!;

    expect(regionalLinksForCity(kolkata).map(link=>link.href)).toEqual(["/regional/bengali/kolkata"]);
    expect(regionalLinksForCity(chennai).map(link=>link.href)).toEqual(["/regional/tamil/chennai"]);
    expect(regionalLinksForCity(delhi)).toEqual([]);
  });

  it("does not create peer-city meshes for noindex secondary Muhurat events",()=>{
    const city=findCityBySlug("mumbai")!;
    expect(isMuhuratIndexable("gold-purchase",city.slug)).toBe(false);
    const groups=buildMuhuratTopicalGraph(city,"gold-purchase",2026,11);
    const compare=groups.find(group=>group.title==="Compare other cities")!;
    expect(compare.links).toEqual([]);
  });

  it("keeps peer-city meshes for indexable primary Muhurat events",()=>{
    const city=findCityBySlug("mumbai")!;
    const groups=buildMuhuratTopicalGraph(city,"wedding",2026,11);
    const compare=groups.find(group=>group.title==="Compare other cities")!;
    expect(compare.links.length).toBeGreaterThan(0);
    expect(compare.links.every(link=>link.href.includes("/muhurat/wedding/2026/11/"))).toBe(true);
  });
});
