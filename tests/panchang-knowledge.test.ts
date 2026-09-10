import {describe,expect,it} from "vitest";
import {detectKnowledgeQuery,knowledgePagePath,knowledgeTopics,knowledgeTopicSlugs} from "../lib/panchang-knowledge";

describe("Panchang knowledge authority",()=>{
  it("exposes seven unique canonical evergreen topics",()=>{
    expect(knowledgeTopicSlugs).toHaveLength(7);
    expect(new Set(knowledgeTopicSlugs).size).toBe(knowledgeTopicSlugs.length);
    for(const slug of knowledgeTopicSlugs){
      const topic=knowledgeTopics[slug];
      expect(topic.slug).toBe(slug);
      expect(knowledgePagePath(slug)).toBe(`/knowledge/${slug}`);
      expect(topic.metaTitle.length).toBeGreaterThan(20);
      expect(topic.description.length).toBeGreaterThan(80);
      expect(topic.formula.length).toBeGreaterThan(20);
      expect(topic.engineNote.length).toBeGreaterThan(60);
      expect(topic.sections.length).toBeGreaterThanOrEqual(4);
      expect(topic.faq.length).toBeGreaterThanOrEqual(3);
    }
  });

  it.each([
    ["what is tithi","tithi"],
    ["nakshatra meaning","nakshatra"],
    ["what is paksha","paksha"],
    ["hindu month names","hindu-months"],
    ["what is panchang","panchang"],
    ["karana in panchang","karana"],
    ["nitya yoga","yoga"],
    ["पंचांग क्या है","panchang"],
  ])("maps informational query %s to %s",(query,slug)=>{
    expect(detectKnowledgeQuery(query)?.slug).toBe(slug);
  });

  it("does not steal live, date or yearly search intent",()=>{
    expect(detectKnowledgeQuery("tithi today in delhi")).toBeNull();
    expect(detectKnowledgeQuery("panchang today mumbai")).toBeNull();
    expect(detectKnowledgeQuery("panchang 2027")).toBeNull();
    expect(detectKnowledgeQuery("nakshatra tomorrow")).toBeNull();
  });

  it("does not map generic yoga intent to Panchang Yoga",()=>{
    expect(detectKnowledgeQuery("what is yoga")).toBeNull();
    expect(detectKnowledgeQuery("yoga classes near me")).toBeNull();
    expect(detectKnowledgeQuery("what is yoga in panchang")?.slug).toBe("yoga");
  });
});
