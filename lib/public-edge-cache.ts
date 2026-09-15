type ExecutionContextLike={waitUntil(promise:Promise<unknown>):void};
type EdgeCache={match(request:Request):Promise<Response|undefined>;put(request:Request,response:Response):Promise<void>};

type CacheStorageWithDefault={default?:EdgeCache};

const TRACKING_PARAMS=new Set(["gclid","fbclid","msclkid","dclid","gbraid","wbraid"]);
const inflight=new Map<string,Promise<Response>>();

export type PublicEdgeCacheDecision={eligible:boolean;reason:string;cacheUrl:string|null};

function defaultEdgeCache(){
  return (globalThis as typeof globalThis&{caches?:CacheStorageWithDefault}).caches?.default??null;
}

function isTrackingParam(name:string){return name.toLowerCase().startsWith("utm_")||TRACKING_PARAMS.has(name.toLowerCase());}

export function publicEdgeCacheDecision(request:Request,versionId="dev"):PublicEdgeCacheDecision{
  if(request.method!=="GET")return {eligible:false,reason:"method",cacheUrl:null};
  const url=new URL(request.url);
  if(url.pathname==="/admin"||url.pathname.startsWith("/admin/")||url.pathname==="/api"||url.pathname.startsWith("/api/"))return {eligible:false,reason:"private-route",cacheUrl:null};
  if(request.headers.get("authorization"))return {eligible:false,reason:"authorization",cacheUrl:null};
  if(request.headers.get("rsc")==="1"||request.headers.has("next-router-state-tree")||request.headers.has("next-router-prefetch"))return {eligible:false,reason:"next-rsc",cacheUrl:null};
  const accept=request.headers.get("accept")??"";
  if(!accept.toLowerCase().includes("text/html"))return {eligible:false,reason:"not-html-navigation",cacheUrl:null};

  for(const key of [...url.searchParams.keys()]){
    if(isTrackingParam(key))url.searchParams.delete(key);
  }
  if(url.searchParams.size>0)return {eligible:false,reason:"functional-query",cacheUrl:null};

  url.searchParams.set("__pv_edge_v",versionId||"dev");
  return {eligible:true,reason:"public-html",cacheUrl:url.toString()};
}

function hasExplicitDate(pathname:string){return /(?:^|\/)\d{4}-\d{2}-\d{2}(?:\/|$)/.test(pathname);}

export function publicEdgeCacheTtlSeconds(pathname:string,status=200){
  if(status===404)return 10*60;
  if(status>=300&&status<400)return 60*60;
  if(pathname.startsWith("/gold-rate")||pathname==="/tools/gold-value-calculator"||pathname==="/tools/gold-value-calculator/")return 10*60;
  if(pathname.startsWith("/panchang/")&&hasExplicitDate(pathname))return 24*60*60;
  if(pathname.startsWith("/panchang/"))return 30*60;
  if(hasExplicitDate(pathname))return 12*60*60;
  return 6*60*60;
}

export function isPublicResponseCacheable(response:Response){
  if(!([200,301,302,307,308,404] as number[]).includes(response.status))return false;
  if(response.headers.has("set-cookie"))return false;
  if(response.status>=300&&response.status<400)return true;
  const contentType=(response.headers.get("content-type")??"").toLowerCase();
  return contentType.includes("text/html");
}

function withTelemetry(response:Response,cacheStatus:"HIT"|"MISS"|"COALESCED"|"BYPASS",handlerMs?:number){
  const headers=new Headers(response.headers);
  headers.set("x-panchvani-edge-cache",cacheStatus);
  if(handlerMs!==undefined)headers.set("x-panchvani-handler-ms",String(Math.max(0,Math.round(handlerMs))));
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

function cacheableCopy(response:Response,ttl:number){
  const headers=new Headers(response.headers);
  // Browser stays revalidation-first while Cloudflare Cache API retains the object at the edge.
  headers.set("cache-control",`public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=60`);
  headers.set("x-panchvani-edge-cache","STORED");
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

async function coalescedRender(key:string,render:()=>Promise<Response>){
  const existing=inflight.get(key);
  if(existing)return {response:(await existing).clone(),coalesced:true};
  const promise=render();
  inflight.set(key,promise);
  try{return {response:await promise,coalesced:false};}
  finally{if(inflight.get(key)===promise)inflight.delete(key);}
}

export async function servePublicWithEdgeCache(
  request:Request,
  versionId:string|undefined,
  ctx:ExecutionContextLike,
  render:()=>Promise<Response>,
){
  const decision=publicEdgeCacheDecision(request,versionId??"dev");
  if(!decision.eligible||!decision.cacheUrl)return withTelemetry(await render(),"BYPASS");

  const edgeCache=defaultEdgeCache();
  if(!edgeCache)return withTelemetry(await render(),"BYPASS");
  const cacheKey=new Request(decision.cacheUrl,{method:"GET",headers:{accept:"text/html"}});

  try{
    const cached=await edgeCache.match(cacheKey);
    if(cached)return withTelemetry(cached,"HIT",0);
  }catch{
    // Cache failure must never make a public page unavailable.
  }

  const started=Date.now();
  const rendered=await coalescedRender(decision.cacheUrl,render);
  const handlerMs=Date.now()-started;
  const response=rendered.response;
  if(!rendered.coalesced&&isPublicResponseCacheable(response)){
    const ttl=publicEdgeCacheTtlSeconds(new URL(request.url).pathname,response.status);
    const copy=cacheableCopy(response.clone(),ttl);
    ctx.waitUntil(edgeCache.put(cacheKey,copy).catch(()=>undefined));
  }
  return withTelemetry(response,rendered.coalesced?"COALESCED":"MISS",handlerMs);
}
