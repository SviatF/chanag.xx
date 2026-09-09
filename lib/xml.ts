export const xml=(body:string)=>new Response(body,{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, max-age=3600, s-maxage=3600"}});
export const urlset=(urls:string[])=>`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${u}</loc></url>`).join("")}</urlset>`;
