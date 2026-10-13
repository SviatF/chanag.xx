import {describe,expect,it} from "vitest";
import {
  ASTA_ATMOSPHERE_SCENARIOS,angularAzimuthGapDegrees,
  geometryOnlyCandidate,groupGeometrySamples,twilightBand,validateAtmosphere,
  type AstaSkySample
} from "../lib/asta-heliacal-visibility";

const sky:AstaSkySample={
  julianUt:2462000.5,
  sunTrueAltitudeDegrees:-10.2,sunApparentAltitudeDegrees:-10,
  planetTrueAltitudeDegrees:5.5,planetApparentAltitudeDegrees:5.6,
  sunAzimuthDegrees:290,planetAzimuthDegrees:310
};
describe("Wave 3P: physically explicit but non-certified twilight screening",()=>{
  it("classifies all twilight transitions without confusing a sunset with darkness",()=>{
    expect(twilightBand(12)).toBe("daylight");
    expect(twilightBand(0)).toBe("daylight");
    expect(twilightBand(-0.01)).toBe("civil");
    expect(twilightBand(-6)).toBe("civil");
    expect(twilightBand(-6.1)).toBe("nautical");
    expect(twilightBand(-12)).toBe("nautical");
    expect(twilightBand(-12.1)).toBe("astronomical");
    expect(twilightBand(-18)).toBe("astronomical");
    expect(twilightBand(-18.1)).toBe("night");
  });
  it("does not imply naked-eye visibility even for a clear-sky twilight geometry window",()=>{
    const clear=geometryOnlyCandidate(sky,ASTA_ATMOSPHERE_SCENARIOS[0]);
    expect(clear.geometryWindowOnly).toBe(true);
    expect(clear.nakedEyeVisible).toBeNull();
    expect(clear.safeForCeremonyFiltering).toBe(false);
    expect(clear.relativeAzimuthDegrees).toBe(20);
  });
  it("accounts for terrain horizon and daylight distinctly",()=>{
    const hazy=ASTA_ATMOSPHERE_SCENARIOS[1];
    expect(geometryOnlyCandidate({...sky,planetApparentAltitudeDegrees:1.9},hazy).geometryWindowOnly).toBe(false);
    expect(geometryOnlyCandidate({...sky,sunApparentAltitudeDegrees:4},hazy).geometryWindowOnly).toBe(false);
    expect(geometryOnlyCandidate({...sky,sunApparentAltitudeDegrees:-19},hazy).geometryWindowOnly).toBe(false);
    expect(geometryOnlyCandidate({...sky,sunApparentAltitudeDegrees:-15,planetApparentAltitudeDegrees:3},hazy).geometryWindowOnly).toBe(true);
  });
  it("groups only adjacent sample-grid points, not interpolated exact heliacal transitions",()=>{
    const step=10/1440;
    const windows=groupGeometrySamples([
      {julianUt:100,geometryWindowOnly:false},
      {julianUt:100+step,geometryWindowOnly:true},
      {julianUt:100+2*step,geometryWindowOnly:true},
      {julianUt:100+3*step,geometryWindowOnly:false},
      {julianUt:100+6*step,geometryWindowOnly:true},
    ],10);
    expect(windows).toHaveLength(2);
    expect(windows[0].sampleCount).toBe(2);
    expect(windows[1].sampleCount).toBe(1);
  });
  it("wraps azimuths and validates atmospheric scenario bounds",()=>{
    expect(angularAzimuthGapDegrees(359,1)).toBe(2);
    expect(angularAzimuthGapDegrees(1,359)).toBe(2);
    expect(ASTA_ATMOSPHERE_SCENARIOS.every(validateAtmosphere)).toBe(true);
    expect(validateAtmosphere({...ASTA_ATMOSPHERE_SCENARIOS[0],humidityPct:101})).toBe(false);
    expect(()=>geometryOnlyCandidate({...sky,planetTrueAltitudeDegrees:NaN},ASTA_ATMOSPHERE_SCENARIOS[0])).toThrow();
    expect(()=>groupGeometrySamples([],0)).toThrow();
  });
});
