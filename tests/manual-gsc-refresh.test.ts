import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("manual GSC refresh",()=>{
  it("keeps the refresh protected and explicit",()=>{
    const route=readFileSync("app/api/admin/gsc-refresh/route.ts","utf8");
    expect(route).toContain("isAdminAuthenticated");
    expect(route).toContain("refreshGscDailySnapshot");
    expect(route).toContain("RECENT_REFRESH_MS=2*60*1000");
    expect(route).toContain("manualRefreshInflight");
  });

  it("exposes a manual button without changing the daily schedule",()=>{
    const client=readFileSync("components/SeoCommandCenterClient.tsx","utf8");
    const worker=readFileSync("worker/index.ts","utf8");
    const kyivCron=readFileSync("lib/kyiv-midnight-cron.ts","utf8");
    expect(client).toContain("/api/admin/gsc-refresh");
    expect(client).toContain("Оновити GSC зараз");
    expect(client).toContain("00:00 Europe/Kyiv");
    expect(worker).toContain("shouldRunGscDailyAtKyivMidnight");
    expect(kyivCron).toContain('GSC_DAILY_CRONS=["0 21 * * *","0 22 * * *"]');
  });
});
