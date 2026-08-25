import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, IconButton, Input, Row, Text } from '@/components/ui';
import { APP_NAME } from '@/constants/app';
import { useI18n } from '@/i18n/I18nProvider';
import { useSession } from '@/stores/session';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';

/**
 * Password reset (spec §6).
 *
 * The success state is deliberately identical whether or not an account
 * exists — confirming which emails are registered is an account-enumeration
 * leak, and the gateway is silent about it for the same reason.
 */
export default function ForgotPassword() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const s = useMemo(() => makeStyles(palette), [palette]);

  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const { sendPasswordReset, busy, error, clearError } = useSession();

  const submit = async () => {
    if (!email.trim() || busy) return;
    const ok = await sendPasswordReset(email);
    if (ok) setSent(true);
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Row gap={spacing.md}>
            <IconButton name="chevron-back" onPress={() => router.back()} label={t((s) => s.auth.forgotPassword.back)} />
            <Text variant="heading" color={palette.primary}>
              {APP_NAME}
            </Text>
          </Row>

          <Animated.View entering={FadeInDown.duration(420)}>
            <Card style={{ gap: spacing.lg }}>
              {sent ? (
                <View style={{ gap: spacing.md }}>
                  <Text variant="heading">{t((s) => s.auth.forgotPassword.checkInbox)}</Text>
                  <Text variant="body" color={palette.onSurfaceVariant}>
                    {t((s) => s.auth.forgotPassword.checkInboxBody)(email.trim())}
                  </Text>
                  <Button label={t((s) => s.auth.forgotPassword.backToSignIn)} onPress={() => router.replace('/(auth)/login')} />
                </View>
              ) : (
                <>
                  <View style={{ gap: spacing.sm }}>
                    <Text variant="heading">{t((s) => s.auth.forgotPassword.resetPassword)}</Text>
                    <Text variant="caption" color={palette.onSurfaceVariant}>
                      {t((s) => s.auth.forgotPassword.subtitle)}
                    </Text>
                  </View>

                  <Input
                    label={t((s) => s.auth.forgotPassword.emailAddress)}
                    value={email}
                    onChangeText={(v) => {
                      clearError();
                      setEmail(v);
                    }}
                    placeholder={t((s) => s.auth.forgotPassword.emailPlaceholder)}
                    keyboardType="email-address"
                    autoComplete="email"
                    returnKeyType="go"
                    onSubmitEditing={submit}
                    error={error}
                    autoFocus
                  />

                  <Button
                    label={t((s) => s.auth.forgotPassword.sendResetLink)}
                    onPress={submit}
                    disabled={!email.trim() || busy}
                    loading={busy}
                  />
                </>
              )}
            </Card>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background },
  content: { padding: spacing.xl, gap: spacing.xxl, flexGrow: 1, justifyContent: 'center' },
});;
