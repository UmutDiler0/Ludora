import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Input, Row, Text } from '@/components/ui';
import { APP_NAME } from '@/constants/app';
import { SocialAuthRow } from '@/features/auth/components/SocialAuthRow';
import { useProfile } from '@/stores/profile';
import { useSession } from '@/stores/session';
import { palette, spacing, type } from '@/theme/tokens';

/** Login (spec §6). Email/password against the auth gateway. */
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { signIn, busy, error, clearError } = useSession();
  const setDisplayName = useProfile((s) => s.setDisplayName);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    const ok = await signIn(email, password);
    if (!ok) return;
    const user = useSession.getState().user;
    if (user) setDisplayName(user.displayName);
    router.replace('/(tabs)');
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
          <Animated.View entering={FadeInDown.duration(420)} style={s.brand}>
            <Text variant="hero" center color={palette.primary}>
              {APP_NAME}
            </Text>
            <Text variant="body" color={palette.onSurfaceVariant} center>
              Enter the arena. Connect with friends.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(420)}>
            <Card style={{ gap: spacing.sm }}>
              <Input
                label="Email"
                value={email}
                onChangeText={(v) => {
                  clearError();
                  setEmail(v);
                }}
                placeholder="player@ludora.games"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
              />

              <Input
                label="Password"
                value={password}
                onChangeText={(v) => {
                  clearError();
                  setPassword(v);
                }}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="current-password"
                returnKeyType="go"
                onSubmitEditing={submit}
                error={error}
              />

              <Row style={{ justifyContent: 'flex-end', marginTop: -spacing.sm }}>
                <Link href="/(auth)/forgot-password" style={[type.caption, s.link]}>
                  Forgot password?
                </Link>
              </Row>

              <Button
                label="Sign in"
                onPress={submit}
                disabled={!canSubmit}
                loading={busy}
                style={{ marginTop: spacing.md }}
              />
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).duration(420)}>
            <SocialAuthRow />
          </Animated.View>

          <View style={{ marginTop: 'auto', paddingTop: spacing.xl }}>
            <Row gap={spacing.xs} style={{ justifyContent: 'center' }}>
              <Text variant="caption" color={palette.onSurfaceVariant}>
                Don&apos;t have an account?
              </Text>
              <Link href="/(auth)/register" style={[type.caption, s.linkPrimary]}>
                Sign up
              </Link>
            </Row>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  content: { padding: spacing.xl, gap: spacing.xl, flexGrow: 1 },
  brand: { gap: spacing.sm, paddingTop: spacing.xxxl, paddingBottom: spacing.md },
  link: { color: palette.secondary },
  linkPrimary: { color: palette.primary },
});
