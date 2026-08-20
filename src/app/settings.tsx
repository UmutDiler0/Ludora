import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Card, Label, Row, Screen, ScreenHeader, Text } from '@/components/ui';
import { useSettings, type ThemePref } from '@/stores/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { lightPalette, darkPalette, type Palette } from '@/theme/palettes';
import { radius, spacing, stroke } from '@/theme/tokens';

/**
 * Settings (spec §34). Undesigned route, built from the primitive kit per
 * decision D20.
 *
 * Appearance offers the three states the platform itself uses: an explicit
 * Light, an explicit Dark, and System, which follows the phone and keeps
 * following it if the phone changes while the app is open.
 */

interface ThemeOption {
  value: ThemePref;
  title: string;
  detail: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  /** Palette the swatch previews; System shows both halves. */
  preview: 'light' | 'dark' | 'both';
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', title: 'Light', detail: 'Always the bright paper theme', icon: 'sunny', preview: 'light' },
  { value: 'dark', title: 'Dark', detail: 'Always the night theme', icon: 'moon', preview: 'dark' },
  {
    value: 'system',
    title: 'Use phone setting',
    detail: 'Follows your device, switching automatically',
    icon: 'phone-portrait',
    preview: 'both',
  },
];

export default function Settings() {
  const router = useRouter();
  const { palette, scheme } = useTheme();
  const themePref = useSettings((s) => s.themePref);
  const setThemePref = useSettings((s) => s.setThemePref);

  return (
    <Screen>
      <ScreenHeader
        title="Settings"
        subtitle="Appearance and language"
        onBack={() => router.back()}
        backLabel="Go back"
      />

      <Label>Appearance</Label>
      <View style={{ gap: spacing.sm }}>
        {THEME_OPTIONS.map((option) => {
          const selected = themePref === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.title}
              onPress={() => setThemePref(option.value)}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.lg,
                  borderRadius: radius.lg,
                  borderWidth: stroke.base,
                  borderColor: palette.ink,
                  borderBottomWidth: selected ? stroke.depthPressed : stroke.depth,
                  borderBottomColor: selected ? palette.primary : palette.ink,
                  backgroundColor: selected ? palette.surfaceHigh : palette.surface,
                  transform: [{ translateY: selected ? stroke.depth - stroke.depthPressed : 0 }],
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              <Swatch preview={option.preview} />

              <View style={{ flex: 1, gap: 2 }}>
                <Row gap={spacing.sm}>
                  <Ionicons name={option.icon} size={16} color={palette.onSurface} />
                  <Text variant="bodyStrong">{option.title}</Text>
                </Row>
                <Text variant="caption" color={palette.onSurfaceVariant}>
                  {option.detail}
                </Text>
              </View>

              {selected && <Ionicons name="checkmark-circle" size={26} color={palette.primary} />}
            </Pressable>
          );
        })}
      </View>

      <Card accent={palette.secondary}>
        <Label color={palette.secondary}>Currently showing</Label>
        <Text variant="body" color={palette.onSurfaceVariant} style={{ marginTop: spacing.sm }}>
          {themePref === 'system'
            ? `System — your phone is set to ${scheme}, so Ludora is ${scheme}.`
            : `${scheme === 'dark' ? 'Dark' : 'Light'}, regardless of your phone setting.`}
        </Text>
      </Card>

      <Label>Language</Label>
      <Card>
        <Text variant="body" color={palette.onSurfaceVariant}>
          Türkçe desteği geliyor — Turkish support is being added next.
        </Text>
      </Card>
    </Screen>
  );
}

/** Two-tone chip previewing what a mode looks like without applying it. */
function Swatch({ preview }: { preview: 'light' | 'dark' | 'both' }) {
  const { palette } = useTheme();
  const half = (p: Palette, side: 'left' | 'right' | 'full') => (
    <View
      style={{
        flex: 1,
        backgroundColor: p.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopLeftRadius: side !== 'right' ? radius.sm : 0,
        borderBottomLeftRadius: side !== 'right' ? radius.sm : 0,
        borderTopRightRadius: side !== 'left' ? radius.sm : 0,
        borderBottomRightRadius: side !== 'left' ? radius.sm : 0,
      }}>
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: p.primary,
          borderWidth: 2,
          borderColor: p.ink,
        }}
      />
    </View>
  );

  return (
    <View
      style={{
        width: 52,
        height: 44,
        flexDirection: 'row',
        borderRadius: radius.sm,
        borderWidth: stroke.thin,
        borderColor: palette.ink,
        overflow: 'hidden',
      }}>
      {preview === 'light' && half(lightPalette as unknown as Palette, 'full')}
      {preview === 'dark' && half(darkPalette, 'full')}
      {preview === 'both' && (
        <>
          {half(lightPalette as unknown as Palette, 'left')}
          {half(darkPalette, 'right')}
        </>
      )}
    </View>
  );
}
