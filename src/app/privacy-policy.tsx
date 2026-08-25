import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Card, Label, Screen, ScreenHeader, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

/**
 * A placeholder policy, honestly labelled as one — Ludora has no server yet
 * (see every local store's own file header), so there is nothing real to
 * disclose beyond what already lives in AsyncStorage on the reader's phone.
 */
export default function PrivacyPolicy() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();

  const sections: { heading: string; body: string }[] = [
    { heading: t((s) => s.privacyPolicy.deviceHeading), body: t((s) => s.privacyPolicy.deviceBody) },
    { heading: t((s) => s.privacyPolicy.accountsHeading), body: t((s) => s.privacyPolicy.accountsBody) },
    { heading: t((s) => s.privacyPolicy.futureHeading), body: t((s) => s.privacyPolicy.futureBody) },
    { heading: t((s) => s.privacyPolicy.contactHeading), body: t((s) => s.privacyPolicy.contactBody) },
  ];

  return (
    <Screen>
      <ScreenHeader
        title={t((s) => s.privacyPolicy.title)}
        subtitle={t((s) => s.privacyPolicy.updated)}
        onBack={() => router.back()}
        backLabel={t((s) => s.common.back)}
      />

      {sections.map((section) => (
        <Card key={section.heading} style={{ gap: spacing.xs }}>
          <Label color={palette.secondary}>{section.heading}</Label>
          <Text variant="body" color={palette.onSurfaceVariant}>
            {section.body}
          </Text>
        </Card>
      ))}

      <View style={{ height: spacing.lg }} />
    </Screen>
  );
}
