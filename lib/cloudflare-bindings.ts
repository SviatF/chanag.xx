import {setGscDailyKvBinding,type GscDailyKvBinding} from "./gsc-daily-store";

/**
 * Vinext route handlers should access Worker bindings from cloudflare:workers.
 * The module specifier is constructed at runtime so the separate reference
 * Next.js build and Vitest can still load this file outside workerd.
 */
export async function bindGscStoreFromCloudflareEnv(){
  try{
    const specifier="cloudflare:"+"workers";
    const runtime=await import(/* @vite-ignore */ specifier) as {env?:Record<string,unknown>};
    const cfEnv=runtime.env??{};
    const binding=(cfEnv.GSC_SNAPSHOT_KV??cfEnv.GOLD_RATE_KV) as GscDailyKvBinding|undefined;
    if(binding)setGscDailyKvBinding(binding);
    return Boolean(binding);
  }catch{
    return false;
  }
}
