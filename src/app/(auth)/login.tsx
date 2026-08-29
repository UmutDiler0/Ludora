import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Input, Row, Text } from '@/components/ui';
import { APP_NAME } from '@/constants/app';
import { useI18n } from '@/i18n/I18nProvider';
import { useProfile } from '@/stores/profile';
import { useSession } from '@/stores/session';
import { spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';

/** Login (spec §6). Email/password against the auth gateway. */
export default function Login() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const s = useMemo(() => makeStyles(palette), [palette]);

  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { signIn, playAsGuest, busy, error, clearError } = useSession();
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

  const continueAsGuest = async () => {
    const ok = await playAsGuest();
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
        <View style={s.content}>
          <Animated.View entering={FadeInDown.duration(420)} style={s.brand}>
            <Text variant="hero" center color={palette.primary}>
              {APP_NAME}
            </Text>
            <Text variant="body" color={palette.onSurfaceVariant} center>
              {t((s) => s.auth.login.tagline)}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(420)}>
            <Card style={{ gap: spacing.sm }}>
              <Input
                label={t((s) => s.auth.login.email)}
                value={email}
                onChangeText={(v) => {
                  clearError();
                  setEmail(v);
                }}
                placeholder={t((s) => s.auth.login.emailPlaceholder)}
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
              />

              <Input
                label={t((s) => s.auth.login.password)}
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
                  {t((s) => s.auth.login.forgotPassword)}
                </Link>
              </Row>

              <Button
                label={t((s) => s.auth.login.signIn)}
                onPress={submit}
                disabled={!canSubmit}
                loading={busy}
                style={{ marginTop: spacing.md }}
              />
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).duration(420)}>
            <Button
              label={t((s) => s.auth.login.playAsGuest)}
              tone="ghost"
              icon="person-outline"
              onPress={continueAsGuest}
              disabled={busy}
              loading={busy}
            />
          </Animated.View>

          <View style={{ marginTop: spacing.lg }}>
            <Row gap={spacing.xs} style={{ justifyContent: 'center' }}>
              <Text variant="caption" color={palette.onSurfaceVariant}>
                {t((s) => s.auth.login.noAccount)}
              </Text>
              <Link href="/(auth)/register" style={[type.caption, s.linkPrimary]}>
                {t((s) => s.auth.login.signUp)}
              </Link>
            </Row>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: p.background },
  content: { padding: spacing.xl, gap: spacing.md, flex: 1 },
  brand: { gap: spacing.sm, paddingTop: spacing.lg, paddingBottom: spacing.xs },
  link: { color: p.secondary },
  linkPrimary: { color: p.primary },
});;
