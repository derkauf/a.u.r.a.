/**
 * Phase 3: AprilTag detector for camera frames (tag36h11).
 *
 * Uses js-aruco2 (MIT) for the square detection and bit reading, with a
 * dictionary of ONLY the 12 tags we printed, in printed order, so the
 * detected id is the number printed under the tag (36h11:001 → 1 …
 * 36h11:00c → 12).
 *
 * Why a custom dictionary: js-aruco2's own APRILTAG_36h11 list is numbered
 * differently from the generator we used (RealityScan); the codes match
 * bit for bit, only the numbering differs (printed 001 is index 476 there).
 * The codes below were read from docs/apriltag/markers_Apriltag36h11_12counts_2pp.pdf
 * by the detector itself on 17/11/2026 (all 12 at Hamming distance 0).
 * tests/unit.test.ts runs the same check against a synthetic image.
 */
import aruco from 'js-aruco2';

/** tag36h11 codes of the printed tags 1..12 (index 0 = printed 001). */
export const PRINTED_TAG_CODES: readonly number[] = [
  0x110bba61, 0x111dd66e, 0x14d2df6a, 0x196b856c, 0x3b4712d5, 0x4b029eec,
  0x4d25374b, 0x56a5d085, 0x5df03f91, 0x67299b45, 0x6e5aaa6b, 0x6f8a5d94,
];

const DICTIONARY = 'AURA_PRINTED_36h11';
/** Accept up to 2 wrong bits (the family's minimum distance is 11). */
const MAX_BIT_ERRORS = 2;

export interface DetectedTag {
  /** Printed number (1..12). */
  id: number;
  /** Corners in image pixels, clockwise from the tag's top-left. */
  corners: ReadonlyArray<{ x: number; y: number }>;
  /** Center in image pixels. */
  center: { x: number; y: number };
  /** Wrong bits corrected (0 = exact). */
  bitErrors: number;
}

interface ArucoMarker {
  id: number;
  corners: Array<{ x: number; y: number }>;
  hammingDistance: number;
}
interface ArucoDetector {
  candidates: unknown[];
  detectImage(width: number, height: number, data: Uint8ClampedArray): ArucoMarker[];
}
interface ArucoModule {
  AR: {
    DICTIONARIES: Record<string, { nBits: number; tau: number; codeList: readonly number[] }>;
    Detector: new (config: { dictionaryName: string; maxHammingDistance?: number }) => ArucoDetector;
  };
}

const { AR } = aruco as unknown as ArucoModule;
AR.DICTIONARIES[DICTIONARY] = { nBits: 36, tau: MAX_BIT_ERRORS + 1, codeList: PRINTED_TAG_CODES };

export class AprilTagDetector {
  private readonly detector = new AR.Detector({
    dictionaryName: DICTIONARY,
    maxHammingDistance: MAX_BIT_ERRORS + 1,
  });

  /** Square candidates found in the last image (diagnostic: squares seen but not decoded). */
  get lastCandidates(): number {
    return this.detector.candidates.length;
  }

  /** Detects the printed tags in an RGBA image. */
  detect(width: number, height: number, rgba: Uint8ClampedArray): DetectedTag[] {
    return this.detector.detectImage(width, height, rgba).map((m) => {
      let x = 0;
      let y = 0;
      for (const c of m.corners) {
        x += c.x / 4;
        y += c.y / 4;
      }
      return { id: m.id + 1, corners: m.corners, center: { x, y }, bitErrors: m.hammingDistance };
    });
  }
}
