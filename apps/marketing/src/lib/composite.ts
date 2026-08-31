/** The hero's grade, read out of the loose `look` object.
 *
 *  `look` is `Record<string, string | number | boolean>` because that is what a
 *  Tweakpane binding hands back and what `loadTuning` parses out of
 *  localStorage: no key is guaranteed to be there, and none is guaranteed to
 *  have the type the pane declared for it. A save written against an older set
 *  of defaults, a hand-edited URL, a renamed control — all of them arrive here
 *  as the wrong type or as `undefined`, and every one of them has to fall back
 *  rather than paint `NaN` into a canvas.
 *
 *  That is the whole reason this file exists apart from the component: it is
 *  the part with branching, and it can be tested without mounting a stage. */

export type Look = Record<string, string | number | boolean>

export function readNumber(look: Look, key: string, fallback: number): number {
  return typeof look[key] === 'number' ? look[key] : fallback
}

export function readText(look: Look, key: string, fallback: string): string {
  return typeof look[key] === 'string' ? look[key] : fallback
}

/** The board restyles itself from CSS, but the canvas painter and the width
 *  budget have to be told a variable moved. */
export function buildSkinKey(look: Look): string {
  return [
    readText(look, 'face', ''),
    readText(look, 'ink', ''),
    readText(look, 'bg', ''),
    readNumber(look, 'aspect', 0),
    readNumber(look, 'glyph', 0),
    readNumber(look, 'squeeze', 0),
    readNumber(look, 'baseline', 0),
    readNumber(look, 'rowgap', 0),
    readNumber(look, 'grit', 0),
    readNumber(look, 'pad', 0),
    look.renderer,
  ].join('|')
}

/** The sign is lit, so it takes none of the board's palette — its own tones came
 *  off the photograph and the two are only related by sitting on one wall. */
export function buildSignSkin(look: Look) {
  return {
    face: readText(look, 'signFace', '#fedf8e'),
    lip: readText(look, 'signLip', '#ffc34e'),
    frame: readText(look, 'signFrame', '#974716'),
    ink: readText(look, 'signInk', '#cc6707'),
    glow: readText(look, 'signGlow', '#ff5a0f'),
    up: readNumber(look, 'signUp', 1.2),
    down: readNumber(look, 'signDown', 0.45),
    glyph: readNumber(look, 'signGlyph', 0.5),
    letter: readNumber(look, 'signLetter', 0.16),
    bloom: readNumber(look, 'signBloom', 0.55),
    pad: readNumber(look, 'signPad', 0.55),
    textY: readNumber(look, 'signTextY', 0.42),
    icon: look.signIcon !== false,
  }
}

/** Corners come in already projected, because working out where the board's
 *  pins land needs the container's measured size and this file has none. */
export function buildComposite<C>(look: Look, corners: C) {
  // Aberration and blur are in source pixels, so both scale with the render
  // budget — supersample twice as wide and an unscaled blur reads half as soft.
  const supersample = readNumber(look, 'supersample', 2)
  return {
    corners,
    grade: {
      exposure: readNumber(look, 'exposure', 1),
      contrast: readNumber(look, 'contrast', 1),
      warmth: readNumber(look, 'warmth', 0),
      angle: readNumber(look, 'angle', 190),
      multiply: readText(look, 'multiply', '#00000000'),
      screen: readText(look, 'screen', '#00000000'),
    },
    lens: {
      grain: readNumber(look, 'grain', 0),
      aberration: readNumber(look, 'aberration', 0) * supersample,
      vignette: readNumber(look, 'vignette', 0),
      blur: readNumber(look, 'blur', 0) * supersample,
    },
    glass: look.glass !== false,
  }
}
