import { useRouter } from 'expo-router';
import { useState } from 'react';

import { Button, Card, Input, Screen, ScreenHeader, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { useSession } from '@/stores/session';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

/** Reached from Settings' Account section — updates the mock account's stored password. */
export default function ChangePassword() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);

  const { changePassword, busy, error, clearError } = useSession();

  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit = current.length > 0 && next.length > 0 && next === confirm && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    const ok = await changePassword(current, next);
    if (ok) setDone(true);
  };

  return (
    <Screen>
      <ScreenHeader
        title={t((s) => s.changePassword.title)}
        subtitle={t((s) => s.changePassword.subtitle)}
        onBack={() => router.back()}
        backLabel={t((s) => s.common.back)}
      />

      <Card style={{ gap: spacing.md }}>
        {done ? (
          <>
            <Text variant="bodyStrong" color={palette.success}>
              {t((s) => s.changePassword.success)}
            </Text>
            <Button label={t((s) => s.changePassword.backToSettings)} onPress={() => router.back()} />
          </>
        ) : (
          <>
            <Input
              label={t((s) => s.changePassword.currentPassword)}
              value={current}
              onChangeText={(v) => {
                clearError();
                setCurrent(v);
              }}
              secureTextEntry
              autoComplete="current-password"
              returnKeyType="next"
            />
            <Input
              label={t((s) => s.changePassword.newPassword)}
              value={next}
              onChangeText={(v) => {
                clearError();
                setNext(v);
              }}
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="next"
            />
            <Input
              label={t((s) => s.changePassword.confirmNewPassword)}
              value={confirm}
              onChangeText={(v) => {
                clearError();
                setConfirm(v);
              }}
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="go"
              onSubmitEditing={submit}
              error={error ?? (mismatch ? t((s) => s.changePassword.passwordsDontMatch) : null)}
            />
            <Button
              label={t((s) => s.changePassword.save)}
              onPress={submit}
              disabled={!canSubmit}
              loading={busy}
            />
          </>
        )}
      </Card>
    </Screen>
  );
}
