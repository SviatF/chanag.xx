import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
describe("Wave 3R source-family corroboration cannot create a public Asta exclusion",()=>{
  it("never imports nonlocal fixed-angle sources into the ceremony runtime",()=>{
    for(const path of ["lib/muhurat.ts","lib/verified-muhurat-closures.ts",
      "lib/muhurat-verification-notice.ts","lib/asta-reference-audit.ts"]){
      const code=readFileSync(path,"utf8");
      expect(code).not.toContain("asta-global-angular-evidence");
      expect(code).not.toContain("asta-wave3r-angular-source-audit");
    }
  });
  it("keeps research-only output and warns against treating two publishers as independent code",()=>{
    const script=readFileSync("scripts/asta-wave3r-angular-source-audit.ts","utf8");
    expect(script).toContain("safeForCeremonyFiltering:false");
    expect(script).toContain("validatedLocalObserverAstaCount:0");
    expect(script).toContain("independentlyAuditedComputationCount:0");
    expect(script).toContain("independentPublisherDomainDoesNotProveIndependentEphemeris:true");
    expect(script).toContain("cross-method-time-gap-not-local-validation");
  });
  it("has a mandatory CI evidence step and report without production build imports",()=>{
    const ci=readFileSync(".github/workflows/quality.yml","utf8");
    expect(ci).toContain("npm run audit:asta-angular-sources");
    expect(ci).toContain("asta-wave3r-independent-sources");
    const pkg=JSON.parse(readFileSync("package.json","utf8"));
    expect(pkg.scripts["audit:asta-angular-sources"]).toContain("scripts/asta-wave3r-angular-source-audit.ts");
    expect(pkg.scripts.build).not.toContain("asta-wave3r");
    expect(pkg.scripts["deploy:vinext"]).toBe("vinext-cloudflare deploy");
  });
});
