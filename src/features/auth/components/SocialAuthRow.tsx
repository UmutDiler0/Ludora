import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Divider, Label, Row, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * The "OR CONTINUE WITH" strip from the Login and Register designs.
 *
 * Google Sign-In is a spec §6 requirement, but it needs a real identity
 * provider. Rather than fake a session behind a Google logo — which would put
 * an unearned identity into the app and teach the flow the wrong shape — the
 * buttons render in a visibly unavailable state until the auth gateway is
 * backed by Firebase. The layout is final; only the handler is missing.
 */
export function SocialAuthRow() {
  const { palette } = useTheme();
  const { t } = useI18n();

  return (
    <View style={{ gap: spacing.lg }}>
      <Row gap={spacing.md}>
        <View style={{ flex: 1 }}>
          <Divider />
        </View>
        <Label>{t((s) => s.auth.social.orContinueWith)}</Label>
        <View style={{ flex: 1 }}>
          <Divider />
        </View>
      </Row>

      <Row gap={spacing.md}>
        <ProviderButton icon="logo-google" name={t((s) => s.auth.social.google)} />
        <ProviderButton icon="logo-apple" name={t((s) => s.auth.social.apple)} />
      </Row>

      <Text variant="caption" color={palette.outline} center>
        {t((s) => s.auth.social.notAvailable)}
      </Text>
    </View>
  );
}

function ProviderButton({
  icon,
  name,
}: {
  icon: 'logo-google' | 'logo-apple';
  name: string;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();

  return (
    <View
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      accessibilityLabel={t((s) => s.auth.social.notAvailableLabel)(name)}
      style={{
        flex: 1,
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: palette.surfaceHigh,
        backgroundColor: palette.surfaceLow,
        opacity: 0.45,
      }}>
      <Ionicons name={icon} size={17} color={palette.onSurface} />
      <Text variant="bodyStrong">{name}</Text>
    </View>
  );
}
