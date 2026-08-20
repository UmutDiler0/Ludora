import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Divider, Label, Row, Text } from '@/components/ui';
import { palette, radius, spacing } from '@/theme/tokens';

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
  return (
    <View style={{ gap: spacing.lg }}>
      <Row gap={spacing.md}>
        <View style={{ flex: 1 }}>
          <Divider />
        </View>
        <Label>Or continue with</Label>
        <View style={{ flex: 1 }}>
          <Divider />
        </View>
      </Row>

      <Row gap={spacing.md}>
        <ProviderButton icon="logo-google" name="Google" />
        <ProviderButton icon="logo-apple" name="Apple" />
      </Row>

      <Text variant="caption" color={palette.outline} center>
        Social sign-in activates with the backend.
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
  return (
    <View
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      accessibilityLabel={`Continue with ${name} — not yet available`}
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
