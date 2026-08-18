import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState, type ComponentProps } from 'react';
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
import { useSession } from '@/stores/session';
import { palette, radius, spacing } from '@/theme/tokens';

/**
 * Onboarding (spec §5) — shown once per install, gated by the persisted
 * `hasOnboarded` flag in the session store.
 *
 * The design ships three slides where spec §5 lists five talking points; the
 * three absorb four of them (games, avatar, XP/Gold, leaderboards). Room
 * creation is the one point with no slide — noted rather than invented, so the
 * design and the build stay comparable.
 *
 * Illustrations are placeholders per decision D19: the designed art is
 * unusable as an asset, so each slide renders a framed icon panel keyed to its
 * theme until real art lands.
 */

interface SlideSpec {
  key: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  accent: string;
  title: string;
  body: string;
  /** Extra proof-of-value strip beneath the art, per slide. */
  garnish?: 'xp' | 'podium' | 'live';
}

const SLIDES: SlideSpec[] = [
  {
    key: 'discover',
    icon: 'sparkles',
    accent: palette.secondaryContainer,
    title: 'Discover & Play',
    body: 'Join thousands of players in unique party games like Vampire Village and Taboo.',
    garnish: 'live',
  },
  {
    key: 'customize',
    icon: 'shirt',
    accent: palette.primaryContainer,
    title: 'Customize & Earn',
    body: 'Build your unique identity and earn XP and Gold with every match.',
    garnish: 'xp',
  },
  {
    key: 'compete',
    icon: 'trophy',
    accent: palette.tertiaryContainer,
    title: 'Compete & Win',
    body: 'Climb the daily and weekly leaderboards to earn exclusive rewards.',
    garnish: 'podium',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const completeOnboarding = useSession((s) => s.completeOnboarding);
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
  return (
    <View style={[s.slide, { width }]}>
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[s.art, { borderColor: slide.accent }]}>
        <Ionicons name={slide.icon} size={72} color={slide.accent} />
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
            { place: '2', height: 44, color: palette.outline },
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  topBar: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  slide: { paddingHorizontal: spacing.xl, gap: spacing.xl },
  art: {
    height: 260,
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: palette.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveTag: { position: 'absolute', top: spacing.md, right: spacing.md },
  copy: { gap: spacing.md },
  garnish: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: palette.surfaceContainer,
    borderWidth: 1,
    borderColor: palette.surfaceHigh,
  },
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  podiumStep: {
    width: '100%',
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: palette.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { padding: spacing.xl, gap: spacing.xl, marginTop: 'auto' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.surfaceHighest,
  },
  dotActive: { width: 24, backgroundColor: palette.primaryContainer },
});
