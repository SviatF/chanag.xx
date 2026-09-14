import {setGscDailyKvBinding,type GscDailyKvBinding} from "./gsc-daily-store";

/**
 * Vinext/Cloudflare route handlers can access Worker bindings through the
 * native cloudflare:workers module. Keep the import lazy so the reference
 * Next.js build and Vitest can still load this module outside workerd.
 */
export async function bindGscStoreFromCloudflareEnv(){
  try{
    const specifier="cloudflare:"+"workers";
    const runtime=await import(/* @vite-ignore */ specifier) as {env?:Record<string,unknown>};
    const env=runtime.env??{};
    const binding=(env.GSC_SNAPSHOT_KV??env.GOLD_RATE_KV) as GscDailyKvBinding|undefined;
    if(binding)setGscDailyKvBinding(binding);
    return Boolean(binding);
  }catch{
    return false;
  }
}
