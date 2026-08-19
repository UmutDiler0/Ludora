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

/**
 * Register (spec §6).
 *
 * Confirm-password is validated locally because it is a UI concern the gateway
 * never sees; everything else defers to the gateway so the rules live in one
 * place and cannot drift between client and server.
 */
export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mismatch, setMismatch] = useState<string | null>(null);

  const { register, busy, error, clearError } = useSession();
  const hydrateFrom = useProfile((s) => s.hydrateFrom);

  const canSubmit =
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    confirm.length > 0 &&
    !busy;

  const submit = async () => {
    if (!canSubmit) return;
    if (password !== confirm) {
      setMismatch('Passwords do not match.');
      return;
    }
    setMismatch(null);
    const ok = await register(email, password, username);
    if (!ok) return;
    hydrateFrom(username.trim());
    router.replace('/(tabs)');
  };

  const edit = (setter: (v: string) => void) => (v: string) => {
    clearError();
    setMismatch(null);
    setter(v);
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
            <Text variant="title" center color={palette.primary}>
              {APP_NAME}
            </Text>
            <Text variant="caption" color={palette.onSurfaceVariant} center>
              Join the ultimate high-energy social arena.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(420)}>
            <Card style={{ gap: spacing.xs }}>
              <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
                <Text variant="heading" center>
                  Create account
                </Text>
                <Text variant="caption" color={palette.onSurfaceVariant} center>
                  Enter your details to get started.
                </Text>
              </View>

              <Input
                label="Username"
                value={username}
                onChangeText={edit(setUsername)}
                placeholder="GameMaster99"
                autoComplete="username"
                returnKeyType="next"
              />
              <Input
                label="Email"
                value={email}
                onChangeText={edit(setEmail)}
                placeholder="player@example.com"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
              />
              <Input
                label="Password"
                value={password}
                onChangeText={edit(setPassword)}
                placeholder="Password"
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="next"
              />
              <Input
                label="Confirm password"
                value={confirm}
                onChangeText={edit(setConfirm)}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="go"
                onSubmitEditing={submit}
                error={mismatch ?? error}
              />

              <Button label="Create account" onPress={submit} disabled={!canSubmit} loading={busy} />

              <Row gap={spacing.xs} style={{ justifyContent: 'center', marginTop: spacing.md }}>
                <Text variant="caption" color={palette.onSurfaceVariant}>
                  Already have an account?
                </Text>
                <Link href="/(auth)/login" style={[type.caption, s.linkPrimary]}>
                  Login
                </Link>
              </Row>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(420)}>
            <SocialAuthRow />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  content: { padding: spacing.xl, gap: spacing.xl, flexGrow: 1 },
  brand: { gap: spacing.sm, paddingTop: spacing.xl },
  linkPrimary: { color: palette.primary },
});
