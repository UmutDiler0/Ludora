import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, stroke } from '@/theme/tokens';

/**
 * The drawing surface — a plain white page, always, regardless of Light /
 * Dark: a sketch drawn against a themed background would make half the
 * palette (white, pale yellow) invisible depending on which mode the viewer
 * is in, and the whole point of the game is that every colour reads.
 *
 * Strokes are plotted as straight-line SVG paths rather than smoothed
 * Beziers — cheap to build point-by-point off raw touch events, and at
 * normal finger-drawing speed the segments are short enough that nobody
 * notices the difference. Points are clamped to the canvas's own measured
 * size (`onLayout`) so a stroke that runs off a fast swipe cannot draw
 * outside the page.
 */

export interface SketchPoint {
  x: number;
  y: number;
}

export interface SketchStroke {
  color: string;
  width: number;
  points: SketchPoint[];
}

const pathFor = (points: SketchPoint[]): string => {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const { x, y } = points[0];
    return `M${x} ${y} L${x} ${y}`;
  }
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
};

export function SketchCanvas({
  strokes,
  onAddStroke,
  editable,
  color,
  brushWidth,
}: {
  strokes: SketchStroke[];
  onAddStroke: (stroke: SketchStroke) => void;
  editable: boolean;
  color: string;
  brushWidth: number;
}) {
  const { palette } = useTheme();
  const size = useRef({ w: 0, h: 0 });
  const live = useRef<SketchPoint[]>([]);
  const [liveStroke, setLiveStroke] = useState<SketchPoint[] | null>(null);

  // The PanResponder below is built exactly once (`useRef(...).current`), so
  // its handlers close over whatever `color`/`brushWidth` were current on
  // that first render — a normal variable read inside them would never see a
  // later colour change. Mirroring the latest props into refs every render
  // keeps the responder stable across the gesture (never rebuilt mid-stroke)
  // while `onPanResponderRelease` still reads the colour actually selected
  // when the finger lifted, not the one from mount.
  const colorRef = useRef(color);
  colorRef.current = color;
  const brushWidthRef = useRef(brushWidth);
  brushWidthRef.current = brushWidth;

  const onLayout = (e: LayoutChangeEvent) => {
    size.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height };
  };

  const clampPoint = (x: number, y: number): SketchPoint => ({
    x: Math.max(0, Math.min(size.current.w, x)),
    y: Math.max(0, Math.min(size.current.h, y)),
  });

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => editable,
      onMoveShouldSetPanResponder: () => editable,
      onPanResponderGrant: (e) => {
        const p = clampPoint(e.nativeEvent.locationX, e.nativeEvent.locationY);
        live.current = [p];
        setLiveStroke(live.current);
      },
      onPanResponderMove: (e) => {
        const p = clampPoint(e.nativeEvent.locationX, e.nativeEvent.locationY);
        live.current = [...live.current, p];
        setLiveStroke(live.current);
      },
      onPanResponderRelease: () => {
        if (live.current.length > 0) {
          onAddStroke({ color: colorRef.current, width: brushWidthRef.current, points: live.current });
        }
        live.current = [];
        setLiveStroke(null);
      },
      onPanResponderTerminate: () => {
        live.current = [];
        setLiveStroke(null);
      },
    }),
  ).current;

  return (
    <View
      onLayout={onLayout}
      {...responder.panHandlers}
      style={{
        flex: 1,
        borderRadius: radius.lg,
        borderWidth: stroke.base,
        borderColor: palette.ink,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
      }}>
      <Svg style={StyleSheet.absoluteFill}>
        {strokes.map((s, i) => (
          <Path
            key={i}
            d={pathFor(s.points)}
            stroke={s.color}
            strokeWidth={s.width}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {liveStroke && (
          <Path
            d={pathFor(liveStroke)}
            stroke={color}
            strokeWidth={brushWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </Svg>
    </View>
  );
}
