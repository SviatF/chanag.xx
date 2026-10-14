/**
 * Two public retrieval surfaces resolved the same Drik URL into DIFFERENT
 * observer localities. Rechecked 2026-10-13.
 *
 * - Indexed result: Mumbai, India, 2027 Guru Asta.
 * - Fresh page fetch of SAME URL: Washington, D.C., United States, 2027.
 *
 * These are historic source snapshots, not guaranteed replayable APIs or
 * a source for public event eligibility. In particular, a "year=3206" URL
 * is not sufficient as a permalink that pins calendar year + observer city.
 */
import type {AstaSourceCapture} from "../../lib/asta-city-source-reproducibility";
export const unstableAstaCitySourceCaptures:readonly AstaSourceCapture[]=[
  {
    planet:"Jupiter",renderedYear:2027,
    url:"https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?year=3206",
    publisher:"Drik Panchang",renderedLocality:"Mumbai, Maharashtra",
    renderedTimeZone:"Asia/Kolkata",startLocal:"2027-08-19T19:34",
    endLocal:"2027-09-13T05:46",captureContext:"indexed-result",
    capturedOn:"2026-10-13"
  },
  {
    planet:"Jupiter",renderedYear:2027,
    url:"https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?year=3206",
    publisher:"Drik Panchang",
    renderedLocality:"Washington, D.C., Washington, D.C., United States",
    renderedTimeZone:"America/New_York",
    startLocal:"2027-08-12T20:46",endLocal:"2027-09-13T05:58",
    captureContext:"page-fetch",
    capturedOn:"2026-10-13"
  },
  {
    planet:"Venus",renderedYear:2027,
    url:"https://www.drikpanchang.com/planet/asta/shukra-asta-date-time.html?year=5786",
    publisher:"Drik Panchang",renderedLocality:"Latur, Maharashtra",
    renderedTimeZone:"Asia/Kolkata",
    startLocal:"2027-07-22T05:33",endLocal:"2027-09-04T18:59",
    captureContext:"indexed-result",capturedOn:"2026-10-13"
  },
  {
    planet:"Venus",renderedYear:2027,
    url:"https://www.drikpanchang.com/planet/asta/shukra-asta-date-time.html?lang=en&year=4898",
    publisher:"Drik Panchang",renderedLocality:"Wardha, Maharashtra",
    renderedTimeZone:"Asia/Kolkata",
    startLocal:"2027-07-22T05:20",endLocal:"2027-09-05T18:52",
    captureContext:"indexed-result",capturedOn:"2026-10-13"
  }
] as const;
