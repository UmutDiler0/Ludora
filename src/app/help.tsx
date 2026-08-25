import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Card, Label, Screen, ScreenHeader, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

/** A short, honest FAQ — no support inbox exists yet to route a "Contact us" row to. */
export default function Help() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();

  const faq: { q: string; a: string }[] = [
    { q: t((s) => s.help.q1), a: t((s) => s.help.a1) },
    { q: t((s) => s.help.q2), a: t((s) => s.help.a2) },
    { q: t((s) => s.help.q3), a: t((s) => s.help.a3) },
    { q: t((s) => s.help.q4), a: t((s) => s.help.a4) },
  ];

  return (
    <Screen>
      <ScreenHeader
        title={t((s) => s.help.title)}
        subtitle={t((s) => s.help.subtitle)}
        onBack={() => router.back()}
        backLabel={t((s) => s.common.back)}
      />

      {faq.map((item) => (
        <Card key={item.q} style={{ gap: spacing.xs }}>
          <Label color={palette.secondary}>{item.q}</Label>
          <Text variant="body" color={palette.onSurfaceVariant}>
            {item.a}
          </Text>
        </Card>
      ))}

      <View style={{ height: spacing.lg }} />
    </Screen>
  );
}
