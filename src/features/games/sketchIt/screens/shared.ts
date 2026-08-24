/**
 * Fixed hex colours rather than palette tokens (contrast with Taboo's
 * `teamAccent`, which does use them): the drawing tool's colours are pigments
 * on a white page, the same in Light or Dark mode, not a UI accent that
 * should follow the viewer's theme.
 */
export const BRUSH_COLORS = [
  '#1B1B1F', // ink
  '#E63946', // red
  '#F4A300', // orange
  '#FFD23F', // yellow
  '#2A9D8F', // teal
  '#3A86FF', // blue
  '#8338EC', // purple
  '#FF6FB0', // pink
  '#6B4226', // brown
  '#FFFFFF', // white — doubles as the eraser against the canvas's own page colour
];

export const BRUSH_SIZES = [
  { label: 'S', width: 4 },
  { label: 'M', width: 8 },
  { label: 'L', width: 14 },
  { label: 'XL', width: 22 },
] as const;
