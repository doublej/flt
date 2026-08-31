/** The hero's grade, tuned against the photograph itself, at full size, on the
 *  page — every number here is also a control in the `?tune` pane.
 *
 *  Key order is load-bearing. `tuning.ts` fingerprints the defaults with
 *  `JSON.stringify`, so reordering these lines discards every tuning saved
 *  against them. Add at the end; do not sort.
 *
 *  The `labs/` pages declare their own look literals on purpose. Unifying them
 *  with this one moves their fingerprint and throws away their saved tunings to
 *  make two throwaway rigs agree with each other. */
export const HERO_LOOK = {
  renderer: 'canvas',
  exposure: 0.78,
  contrast: 1.25,
  warmth: -0.15,
  angle: 179,
  multiply: '#00000000',
  screen: '#ffc90019',
  grain: 0.56,
  aberration: 0.75,
  vignette: 0,
  blur: 0.85,
  supersample: 1,
  glass: false,
  bg: '#2d2d2dff',
  pad: 0.42,
  face: '#1d1d1d',
  ink: '#dfd6c4',
  aspect: 0.495,
  glyph: 1.07,
  squeeze: 0.66,
  baseline: 0.014,
  rowgap: 0.125,
  grit: 0.3,
  pins: false,
  /* the lit header. Its tones are the photograph's own, so it stays amber even
     though the flaps beside it were graded cool. */
  signFace: '#fedf8e',
  signLip: '#ffc34e',
  signFrame: '#974716',
  signInk: '#cc6707',
  signGlow: '#ff5a0f',
  signGlyph: 0.52,
  signLetter: 0,
  signBloom: 0,
  signUp: 0,
  signDown: 0,
  signIcon: false,
  signX: 0,
  signY: -0.0002,
  signW: 1.014,
  signH: 0.1656,
  signPad: 0.55,
  signTextY: 0.42,
  signSqueeze: 1,
}
