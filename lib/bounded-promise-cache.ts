export type BoundedPromiseCache<K,V>={
  getOrCreate:(key:K,factory:()=>Promise<V>|V)=>Promise<V>;
  clear:()=>void;
  has:(key:K)=>boolean;
  size:()=>number;
};

export function createBoundedPromiseCache<K,V>(maxEntries:number):BoundedPromiseCache<K,V>{
  if(!Number.isInteger(maxEntries)||maxEntries<1)throw new Error("maxEntries must be a positive integer");
  const entries=new Map<K,Promise<V>>();

  function touch(key:K,promise:Promise<V>){
    entries.delete(key);
    entries.set(key,promise);
    while(entries.size>maxEntries){
      const oldest=entries.keys().next();
      if(oldest.done)break;
      entries.delete(oldest.value);
    }
  }

  return {
    getOrCreate(key,factory){
      const existing=entries.get(key);
      if(existing){
        touch(key,existing);
        return existing;
      }

      let promise:Promise<V>;
      try{
        promise=Promise.resolve(factory());
      }catch(error){
        return Promise.reject(error);
      }

      touch(key,promise);
      void promise.catch(()=>{
        if(entries.get(key)===promise)entries.delete(key);
      });
      return promise;
    },
    clear(){entries.clear();},
    has(key){return entries.has(key);},
    size(){return entries.size;},
  };
}
