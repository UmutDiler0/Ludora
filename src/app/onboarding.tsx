import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState, type ComponentType } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, Label, ProgressBar, Row, Text } from '@/components/ui';
import { CompeteArt, CustomizeArt, DiscoverArt } from '@/features/onboarding/illustrations';
import { useSession } from '@/stores/session';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { radius, spacing } from '@/theme/tokens';

/**
 * Onboarding (spec §5) — shown once per install, gated by the persisted
 * `hasOnboarded` flag in the session store.
 *
 * The design ships three slides where spec §5 lists five talking points; the
 * three absorb four of them (games, avatar, XP/Gold, leaderboards). Room
 * creation is the one point with no slide — noted rather than invented, so the
 * design and the build stay comparable.
 *
 * Illustrations are hand-drawn SVG (features/onboarding/illustrations.tsx),
 * not photographic art — there is no image generation tool available, so
 * these stand in for the Stitch designs using the same ink-outline cartoon
 * language as the rest of the UI kit.
 */

interface SlideSpec {
  key: string;
  art: ComponentType;
  /** Palette token rather than a literal, so slides follow Light / Dark. */
  accent: keyof Palette;
  title: string;
  body: string;
  /** Extra proof-of-value strip beneath the art, per slide. */
  garnish?: 'xp' | 'podium' | 'live';
}

const SLIDES: SlideSpec[] = [
  {
    key: 'discover',
    art: DiscoverArt,
    accent: 'secondaryContainer',
    title: 'Discover & Play',
    body: 'Join thousands of players in unique party games like Vampire Village and Taboo.',
    garnish: 'live',
  },
  {
    key: 'customize',
    art: CustomizeArt,
    accent: 'primaryContainer',
    title: 'Customize & Earn',
    body: 'Build your unique identity and earn XP and Gold with every match.',
    garnish: 'xp',
  },
  {
    key: 'compete',
    art: CompeteArt,
    accent: 'tertiaryContainer',
    title: 'Compete & Win',
    body: 'Climb the daily and weekly leaderboards to earn exclusive rewards.',
    garnish: 'podium',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const { palette } = useTheme();
  const s = useMemo(() => makeStyles(palette), [palette]);
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const completeOnboarding = useSession((state) => state.completeOnboarding);
  const isLast = index === SLIDES.length - 1;

  const finish = () => {
    completeOnboarding();
    router.replace('/(auth)/login');
  };

  const next = () => {
    if (isLast) return finish();
    scroller.current?.scrollTo({ x: (index + 1) * width, animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    if (page !== index) setIndex(page);
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <Row style={s.topBar}>
        <View style={{ flex: 1 }} />
        <Pressable accessibilityRole="button" onPress={finish} hitSlop={12}>
          <Label>Skip</Label>
        </Pressable>
      </Row>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ flexGrow: 0 }}>
        {SLIDES.map((slide) => (
          <Slide key={slide.key} slide={slide} width={width} />
        ))}
      </ScrollView>

      <View style={s.footer}>
        <Row gap={spacing.sm} style={{ justifyContent: 'center' }}>
          {SLIDES.map((slide, i) => (
            <View key={slide.key} style={[s.dot, i === index && s.dotActive]} />
          ))}
        </Row>
        <Button label={isLast ? 'Get started' : 'Next'} onPress={next} />
      </View>
    </SafeAreaView>
  );
}

function Slide({ slide, width }: { slide: SlideSpec; width: number }) {
  const { palette } = useTheme();
  const s = useMemo(() => makeStyles(palette), [palette]);
  const accent = palette[slide.accent];
  const Art = slide.art;

  return (
    <View style={[s.slide, { width }]}>
      <Animated.View entering={FadeIn.duration(400)} style={[s.art, { borderColor: accent }]}>
        <Art />
        {slide.garnish === 'live' && (
          <View style={s.liveTag}>
            <Chip color={palette.secondary} filled>
              Live
            </Chip>
          </View>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(420)} style={s.copy}>
        <Text variant="title" center>
          {slide.title}
        </Text>
        <Text variant="body" color={palette.onSurfaceVariant} center>
          {slide.body}
        </Text>
      </Animated.View>

      {slide.garnish === 'xp' && (
        <Animated.View entering={FadeInDown.delay(220).duration(420)} style={s.garnish}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Label color={palette.secondary}>Player XP</Label>
            <Text variant="bodyStrong">Lvl 1</Text>
          </Row>
          <ProgressBar value={0.35} color={palette.secondary} />
          <Row gap={spacing.sm}>
            <Chip color={palette.tertiary}>Daily rewards</Chip>
            <Chip color={palette.tertiary}>+50 gold</Chip>
          </Row>
        </Animated.View>
      )}

      {slide.garnish === 'podium' && (
        <Animated.View entering={FadeInDown.delay(220).duration(420)} style={s.podium}>
          {[
            { place: '2', height: 44, color: palette.onSurfaceVariant },
            { place: '1', height: 68, color: palette.tertiary },
            { place: '3', height: 32, color: palette.tertiaryContainer },
          ].map((step) => (
            <View key={step.place} style={{ flex: 1, alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="medal" size={22} color={step.color} />
              <View style={[s.podiumStep, { height: step.height, borderColor: step.color }]}>
                <Text variant="label" color={step.color}>
                  {step.place}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: p.background },
    topBar: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
    slide: { paddingHorizontal: spacing.xl, gap: spacing.xl },
    art: {
      height: 260,
      borderRadius: radius.xl,
      borderWidth: 3,
      backgroundColor: p.surface,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    liveTag: { position: 'absolute', top: spacing.md, right: spacing.md },
    copy: { gap: spacing.md },
    garnish: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: p.surface,
      borderWidth: 3,
      borderColor: p.ink,
      borderBottomWidth: 6,
    },
    podium: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
    podiumStep: {
      width: '100%',
      borderRadius: radius.sm,
      borderWidth: 3,
      backgroundColor: p.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footer: { padding: spacing.xl, gap: spacing.xl, marginTop: 'auto' },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: p.ink,
      backgroundColor: p.surface,
    },
    dotActive: { width: 26, backgroundColor: p.primary },
  });
