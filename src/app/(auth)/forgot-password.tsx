import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, IconButton, Input, Row, Text } from '@/components/ui';
import { APP_NAME } from '@/constants/app';
import { useSession } from '@/stores/session';
import { palette, spacing } from '@/theme/tokens';

/**
 * Password reset (spec §6).
 *
 * The success state is deliberately identical whether or not an account
 * exists — confirming which emails are registered is an account-enumeration
 * leak, and the gateway is silent about it for the same reason.
 */
export default function ForgotPassword() {
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
            <IconButton name="chevron-back" onPress={() => router.back()} label="Go back" />
            <Text variant="heading" color={palette.primary}>
              {APP_NAME}
            </Text>
          </Row>

          <Animated.View entering={FadeInDown.duration(420)}>
            <Card style={{ gap: spacing.lg }}>
              {sent ? (
                <View style={{ gap: spacing.md }}>
                  <Text variant="heading">Check your inbox</Text>
                  <Text variant="body" color={palette.onSurfaceVariant}>
                    If an account exists for {email.trim()}, a reset link is on its way. The link
                    expires in one hour.
                  </Text>
                  <Button label="Back to sign in" onPress={() => router.replace('/(auth)/login')} />
                </View>
              ) : (
                <>
                  <View style={{ gap: spacing.sm }}>
                    <Text variant="heading">Reset password</Text>
                    <Text variant="caption" color={palette.onSurfaceVariant}>
                      Enter your email to receive a password reset link.
                    </Text>
                  </View>

                  <Input
                    label="Email address"
                    value={email}
                    onChangeText={(v) => {
                      clearError();
                      setEmail(v);
                    }}
                    placeholder="commander@ludora.games"
                    keyboardType="email-address"
                    autoComplete="email"
                    returnKeyType="go"
                    onSubmitEditing={submit}
                    error={error}
                    autoFocus
                  />

                  <Button
                    label="Send reset link"
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  content: { padding: spacing.xl, gap: spacing.xxl, flexGrow: 1, justifyContent: 'center' },
});
