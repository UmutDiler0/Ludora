import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Input, Row, Text } from '@/components/ui';
import { APP_NAME } from '@/constants/app';
import { SocialAuthRow } from '@/features/auth/components/SocialAuthRow';
import { useI18n } from '@/i18n/I18nProvider';
import { useProfile } from '@/stores/profile';
import { useSession } from '@/stores/session';
import { spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';

/**
 * Register (spec §6).
 *
 * Confirm-password is validated locally because it is a UI concern the gateway
 * never sees; everything else defers to the gateway so the rules live in one
 * place and cannot drift between client and server.
 */
export default function Register() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const s = useMemo(() => makeStyles(palette), [palette]);

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
      setMismatch(t((s) => s.auth.register.passwordsDontMatch));
      return;
    }
    setMismatch(null);
    const ok = await register(email, password, username);
    if (!ok) return;
    hydrateFrom(username.trim());
    // New accounts build an avatar before landing on the dashboard. `replace`
    // rather than `push`: the account already exists by this point, so backing
    // into the registration form would only offer to create it twice.
    router.replace('/avatar-create');
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
              {t((s) => s.auth.register.tagline)}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(420)}>
            <Card style={{ gap: spacing.xs }}>
              <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
                <Text variant="heading" center>
                  {t((s) => s.auth.register.createAccount)}
                </Text>
                <Text variant="caption" color={palette.onSurfaceVariant} center>
                  {t((s) => s.auth.register.subtitle)}
                </Text>
              </View>

              <Input
                label={t((s) => s.auth.register.username)}
                value={username}
                onChangeText={edit(setUsername)}
                placeholder={t((s) => s.auth.register.usernamePlaceholder)}
                autoComplete="username"
                returnKeyType="next"
              />
              <Input
                label={t((s) => s.auth.register.email)}
                value={email}
                onChangeText={edit(setEmail)}
                placeholder={t((s) => s.auth.register.emailPlaceholder)}
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
              />
              <Input
                label={t((s) => s.auth.register.password)}
                value={password}
                onChangeText={edit(setPassword)}
                placeholder={t((s) => s.auth.register.password)}
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="next"
              />
              <Input
                label={t((s) => s.auth.register.confirmPassword)}
                value={confirm}
                onChangeText={edit(setConfirm)}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="go"
                onSubmitEditing={submit}
                error={mismatch ?? error}
              />

              <Button label={t((s) => s.auth.register.createAccount)} onPress={submit} disabled={!canSubmit} loading={busy} />

              <Row gap={spacing.xs} style={{ justifyContent: 'center', marginTop: spacing.md }}>
                <Text variant="caption" color={palette.onSurfaceVariant}>
                  {t((s) => s.auth.register.haveAccount)}
                </Text>
                <Link href="/(auth)/login" style={[type.caption, s.linkPrimary]}>
                  {t((s) => s.auth.register.login)}
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

const makeStyles = (p: Palette) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background },
  content: { padding: spacing.xl, gap: spacing.xl, flexGrow: 1 },
  brand: { gap: spacing.sm, paddingTop: spacing.xl },
  linkPrimary: { color: p.primary },
});;
