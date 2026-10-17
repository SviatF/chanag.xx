import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {getPanchang} from "../lib/panchang";
import {lunarIlluminatedFraction,lunarIlluminationPercent} from "../lib/lunar-illumination";

/**
 * External oracle: native pyswisseph 2.10.03 (Swiss Ephemeris C),
 * swe.pheno_ut(julday(year,month,day, 01:00 UT), SE_MOON, SEFLG_MOSEPH)[1].
 *
 * Planetary vectors from native swe.calc_ut at the SAME JD, tropical
 * geocentric, MOSEPH; longitude and latitude degrees and distance AU.
 * These are independent of @typescriptify/sweph's TypeScript port.
 * Store fixed source observations; do not rebase the expected values to
 * accommodate implementation output.
 */
const references=[
  {
    date:"2027-01-15",
    sun:[294.633751482,0.000198322,0.983620939],
    moon:[14.766796002,4.250570425,0.002584654],
    nativePercent:41.58312,
    oldRoundedPercent:41,newRoundedPercent:42
  },
  {
    date:"2027-10-29",
    sun:[215.378789201,-0.000130214,0.993542944],
    moon:[208.619337179,-4.948050186,0.002507418],
    nativePercent:0.53528,
    oldRoundedPercent:0,newRoundedPercent:1
  },
  {
    date:"2026-10-13",
    sun:[199.717136865,-0.000127659,0.997927055],
    moon:[227.677164319,-5.007059222,0.002651558],
    nativePercent:6.03480,
    oldRoundedPercent:6,newRoundedPercent:6
  },
  {
    date:"2026-09-09",
    sun:[166.388429634,0.000065321,1.007369834],
    moon:[139.084430308,0.982981014,0.002475622],
    nativePercent:5.60332,
    oldRoundedPercent:6,newRoundedPercent:6
  },
  {
    date:"2026-11-08",
    sun:[225.632915469,-0.000102724,0.990949319],
    moon:[211.22873038,-4.527116954,0.002632968],
    nativePercent:1.73191,
    oldRoundedPercent:2,newRoundedPercent:2
  }
] as const;

describe("physical lunar illuminated disc data",()=>{
  it("matches native Swiss Ephemeris C phase oracle on independent timestamps",()=>{
    for(const sample of references){
      const percent=100*lunarIlluminatedFraction(sample.sun,sample.moon);
      expect(Math.abs(percent-sample.nativePercent),sample.date).toBeLessThan(0.025);
      expect(lunarIlluminationPercent(sample.sun,sample.moon)).toBe(sample.newRoundedPercent);
      const old=(1-Math.cos((sample.moon[0]-sample.sun[0])*Math.PI/180))/2;
      expect(Math.round(100*old)).toBe(sample.oldRoundedPercent);
    }
  });
  it("is bounded and rejects corrupted ephemeris distances",()=>{
    expect(lunarIlluminatedFraction([0,0,1],[0,0,0.00257])).toBeGreaterThanOrEqual(0);
    expect(lunarIlluminatedFraction([0,0,1],[180,0,0.00257])).toBeCloseTo(1,10);
    expect(()=>lunarIlluminationPercent([0,0,1],[45,0,NaN])).toThrow("Invalid geocentric");
    expect(()=>lunarIlluminationPercent([0,0,1],[45,0,2])).toThrow("Invalid geocentric");
  });
  it("changes real city-day Panchang output, not merely page copy",async()=>{
    const mumbai=cityBySlug("mumbai");
    const observations=[
      {date:"2027-01-15",expected:42},
      {date:"2027-10-29",expected:1}
    ];
    for(const {date,expected} of observations){
      const result=await getPanchang(new Date(date+"T12:00:00Z"),mumbai);
      expect(result.moonIllumination, date).toBe(expected);
      expect(result.engine).toBe("Swiss Ephemeris · Moshier");
    }
  });
});
