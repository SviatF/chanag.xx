/**
 * Wave 3AI — compare real, rendered, indexable page identities.
 *
 * This does NOT prove editorial uniqueness, source correctness or Google
 * indexation. It rejects metadata aliases that the full-page Jaccard test
 * cannot detect, and a dated Panchang page describing a future day as "today".
 * No false city/date variations or keyword shuffling are generated here.
 */
const SUPPORT_FAMILIES=new Set(["navigation","authority-singleton","tool-singleton","other-content"]);

export function normalizedSeoValue(value){
  return String(value??"")
    .replace(/&nbsp;|&#160;/gi," ")
    .replace(/&amp;/gi,"&")
    .replace(/&lt;/gi,"<")
    .replace(/&gt;/gi,">")
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
    .replace(/<[^>]*>/g," ")
    .normalize("NFKC")
    .replace(/\s+/g," ")
    .trim()
    .toLocaleLowerCase("en");
}
function attrs(tag){
  const output={};
  for(const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))
    output[match[1].toLowerCase()]=match[2]??match[3]??"";
  return output;
}
export function extractSeoIdentity(html){
  const titles=[...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)]
    .map(x=>normalizedSeoValue(x[1]));
  const descriptions=[...html.matchAll(/<meta\b[^>]*>/gi)]
    .map(x=>attrs(x[0]))
    .filter(x=>x.name?.toLowerCase()==="description")
    .map(x=>normalizedSeoValue(x.content));
  return {
    title:titles[0]??"",
    description:descriptions[0]??"",
    titleCount:titles.length,
    descriptionCount:descriptions.length
  };
}
export function auditSeoIdentity(pages){
  const indexable=pages.filter(page=>
    !SUPPORT_FAMILIES.has(page.family)&&
    !page.family.endsWith("singleton")&&
    !String(page.robots??"").includes("noindex")
  );
  const issues=[],collisions={title:[],description:[]};
  const owners={title:new Map(),description:new Map()};
  for(const page of indexable){
    const title=page.seo?.title??"";
    const description=page.seo?.description??"";
    if(!title||page.seo?.titleCount!==1)
      issues.push({pathname:page.pathname,issue:"missing or multiple HTML titles"});
    if(!description||page.seo?.descriptionCount!==1)
      issues.push({pathname:page.pathname,issue:"missing or multiple meta descriptions"});
    const dated=page.pathname.match(/^\/panchang\/([^/]+)\/(\d{4}-\d{2}-\d{2})$/);
    if(dated){
      // A dated canonical must identify THAT date; "Today Panchang" on all
      // archived/future pages is factually wrong and collapses search intent.
      if(!title.includes(dated[2]))
        issues.push({pathname:page.pathname,issue:"dated Panchang title omits requested civil date"});
      if(!description.includes(dated[2]))
        issues.push({pathname:page.pathname,issue:"dated Panchang description omits requested civil date"});
      if(!normalizedSeoValue(page.h1).includes(dated[2]))
        issues.push({pathname:page.pathname,issue:"dated Panchang H1 omits requested civil date"});
      if(/^today panchang\b/.test(title))
        issues.push({pathname:page.pathname,issue:"dated Panchang title incorrectly claims today"});
    }
    for(const [kind,value] of [["title",title],["description",description]]){
      if(!value)continue;
      const list=owners[kind].get(value)??[];
      list.push({pathname:page.pathname,family:page.family});
      owners[kind].set(value,list);
    }
  }
  for(const kind of ["title","description"]){
    for(const [value,group] of owners[kind]){
      if(group.length>1)collisions[kind].push({value,owners:group});
    }
  }
  return {
    programmaticPages:indexable.length,
    issues,
    duplicateTitles:collisions.title,
    duplicateDescriptions:collisions.description
  };
}
