import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Card, Label, Row, Screen, ScreenHeader, Select, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
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
 *
 * Language follows the same System / explicit-choice shape, but deliberately
 * not the same UI: a dropdown (`Select`), not a row of tappable cards like
 * Appearance's. Two states read naturally as "flip between them"; a language
 * picker reads as "open a list and choose one", especially once a third
 * language is added later — see `Select`'s own header for why.
 */

export default function Settings() {
  const router = useRouter();
  const { palette, scheme } = useTheme();
  const { t, locale } = useI18n();
  const themePref = useSettings((s) => s.themePref);
  const setThemePref = useSettings((s) => s.setThemePref);
  const localePref = useSettings((s) => s.localePref);
  const setLocalePref = useSettings((s) => s.setLocalePref);

  const themeOptions: { value: ThemePref; title: string; detail: string; icon: React.ComponentProps<typeof Ionicons>['name']; preview: 'light' | 'dark' | 'both' }[] = [
    { value: 'light', title: t((s) => s.settings.themeLight), detail: t((s) => s.settings.themeLightDetail), icon: 'sunny', preview: 'light' },
    { value: 'dark', title: t((s) => s.settings.themeDark), detail: t((s) => s.settings.themeDarkDetail), icon: 'moon', preview: 'dark' },
    {
      value: 'system',
      title: t((s) => s.settings.themeSystem),
      detail: t((s) => s.settings.themeSystemDetail),
      icon: 'phone-portrait',
      preview: 'both',
    },
  ];

  const schemeLabel = scheme === 'dark' ? t((s) => s.settings.themeDark) : t((s) => s.settings.themeLight);
  const localeLabel = locale === 'tr' ? t((s) => s.settings.languageTurkish) : t((s) => s.settings.languageEnglish);

  return (
    <Screen>
      <ScreenHeader
        title={t((s) => s.settings.title)}
        subtitle={t((s) => s.settings.subtitle)}
        onBack={() => router.back()}
        backLabel={t((s) => s.common.back)}
      />

      <Label>{t((s) => s.settings.appearance)}</Label>
      <View style={{ gap: spacing.sm }}>
        {themeOptions.map((option) => {
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
        <Label color={palette.secondary}>{t((s) => s.settings.currentlyShowing)}</Label>
        <Text variant="body" color={palette.onSurfaceVariant} style={{ marginTop: spacing.sm }}>
          {themePref === 'system'
            ? t((s) => s.settings.currentlyShowingSystem)(schemeLabel)
            : t((s) => s.settings.currentlyShowingFixed)(schemeLabel)}
        </Text>
      </Card>

      <Label>{t((s) => s.settings.language)}</Label>
      <Text variant="caption" color={palette.onSurfaceVariant}>
        {t((s) => s.settings.languageDetail)}
      </Text>
      <Select
        label={t((s) => s.settings.language)}
        value={localePref}
        onChange={setLocalePref}
        options={[
          {
            value: 'system',
            label: t((s) => s.settings.languageSystem),
            detail: t((s) => s.settings.languageSystemDetail)(localeLabel),
          },
          { value: 'en', label: t((s) => s.settings.languageEnglish) },
          { value: 'tr', label: t((s) => s.settings.languageTurkish) },
        ]}
      />
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
