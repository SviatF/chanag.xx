/**
 * Wave 3AG: checked-in, deterministic and PRECISE JPL DE440s 6° data.
 * This entrypoint is research-only. Production Panchang, Vrat and Muhurat
 * do not import it, and must NOT silently switch lunar models.
 *
 * CI regenerates the full data from the pinned JPL kernel every run and
 * byte-for-byte compares against the checked-in generated module. This
 * function does not download or fabricate future phase timestamps.
 */
import source from "../generated/jpl-v6-half-tithi-2025-2030";
import {validateJplHalfTithiTable,type JplHalfTithiTable} from "./jpl-v6-tithi-karana-canary";

let cached:JplHalfTithiTable|null=null;
export const JPL_V6_ROOTS_ASSET_SHA256=
  "0cab0c6accaf2e2125fe417bf4a4f14a22453a4013a1609dce6dce84ec44142e" as const;

export function getPinnedV6HalfTithiTable():JplHalfTithiTable{
  if(!cached){
    const table=validateJplHalfTithiTable(source as unknown);
    if(table.halfTithiBoundaryCount!==4512)
      throw Error("JPL 6-degree root asset unexpectedly incomplete");
    cached=table;
  }
  return cached;
}
