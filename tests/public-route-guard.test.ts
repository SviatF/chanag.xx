import {describe,expect,it} from "vitest";
import {publicRouteGuard} from "../lib/public-route-guard";

describe("public pre-Vinext route guard",()=>{
  it("blocks common scanner paths without entering Next",()=>{
    for(const path of ["/wp-admin","/wp-login.php","/.env","/.git/config","/phpmyadmin/index.php","/xmlrpc.php"]){
      expect(publicRouteGuard(path).blocked,path).toBe(true);
    }
  });

  it("blocks malformed deterministic route dates and impossible years",()=>{
    expect(publicRouteGuard("/panchang/mumbai/2026-99-99").blocked).toBe(true);
    expect(publicRouteGuard("/panchang/mumbai/9999-01-01").blocked).toBe(true);
    expect(publicRouteGuard("/calendar/mumbai/9999/01").blocked).toBe(true);
    expect(publicRouteGuard("/calendar/mumbai/2026/13").blocked).toBe(true);
    expect(publicRouteGuard("/muhurat/wedding/2026/99/delhi").blocked).toBe(true);
  });

  it("allows valid public shapes and leaves city existence to the app router",()=>{
    expect(publicRouteGuard("/panchang/mumbai/2026-09-15").blocked).toBe(false);
    expect(publicRouteGuard("/panchang/not-a-real-city/2026-09-15").blocked).toBe(false);
    expect(publicRouteGuard("/calendar/mumbai/2026/09").blocked).toBe(false);
    expect(publicRouteGuard("/festivals/diwali/2026/delhi").blocked).toBe(false);
    expect(publicRouteGuard("/muhurat/wedding/2026/09/delhi").blocked).toBe(false);
    expect(publicRouteGuard("/api/admin/seo-data").blocked).toBe(false);
  });
});
