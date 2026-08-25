import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Dialog, DialogActions, Input, Label, ListRow, Screen, ScreenHeader, Select, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { useProfile } from '@/stores/profile';
import { useSession } from '@/stores/session';
import { useSettings } from '@/stores/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

/**
 * Settings (spec §34). Undesigned route, built from the primitive kit per
 * decision D20.
 *
 * Ludora ships one visual theme, not a Light/Dark choice, so there is no
 * Appearance section here — only Language, and Account grouped separately
 * from Support, since "manage my account" and "read about the app" are not
 * the same kind of settings row even though both ended up here first.
 */

export default function Settings() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t, locale } = useI18n();
  const localePref = useSettings((s) => s.localePref);
  const setLocalePref = useSettings((s) => s.setLocalePref);
  const isGuest = useSession((s) => s.isGuest);

  const localeLabel = locale === 'tr' ? t((s) => s.settings.languageTurkish) : t((s) => s.settings.languageEnglish);

  const chevron = <Ionicons name="chevron-forward" size={18} color={palette.onSurfaceVariant} />;

  return (
    <Screen>
      <ScreenHeader
        title={t((s) => s.settings.title)}
        subtitle={t((s) => s.settings.subtitle)}
        onBack={() => router.back()}
        backLabel={t((s) => s.common.back)}
      />

      <Label>{t((s) => s.settings.language)}</Label>
      <Text variant="caption" color={palette.onSurfaceVariant}>
        {t((s) => s.settings.languageDetail)}
      </Text>
      <Select
        label={t((s) => s.settings.language)}
        value={localePref}
        onChange={setLocalePref}
        options={[
          {
            value: 'system',
            label: t((s) => s.settings.languageSystem),
            detail: t((s) => s.settings.languageSystemDetail)(localeLabel),
          },
          { value: 'en', label: t((s) => s.settings.languageEnglish) },
          { value: 'tr', label: t((s) => s.settings.languageTurkish) },
        ]}
      />

      <Label>{t((s) => s.settings.account)}</Label>
      {isGuest ? (
        <Text variant="caption" color={palette.onSurfaceVariant}>
          {t((s) => s.settings.guestAccountNotice)}
        </Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <ListRow
            leading={<Ionicons name="key-outline" size={22} color={palette.primary} />}
            title={t((s) => s.settings.changePassword)}
            subtitle={t((s) => s.settings.changePasswordDetail)}
            trailing={chevron}
            onPress={() => router.push('/change-password')}
          />
          <DeleteAccountRow chevron={chevron} />
        </View>
      )}

      <Label>{t((s) => s.settings.support)}</Label>
      <View style={{ gap: spacing.sm }}>
        <ListRow
          leading={<Ionicons name="shield-checkmark-outline" size={22} color={palette.secondary} />}
          title={t((s) => s.settings.privacyPolicy)}
          subtitle={t((s) => s.settings.privacyPolicyDetail)}
          trailing={chevron}
          onPress={() => router.push('/privacy-policy')}
        />
        <ListRow
          leading={<Ionicons name="help-circle-outline" size={22} color={palette.tertiary} />}
          title={t((s) => s.settings.help)}
          subtitle={t((s) => s.settings.helpDetail)}
          trailing={chevron}
          onPress={() => router.push('/help')}
        />
      </View>
    </Screen>
  );
}

/**
 * Its own component only so the confirm dialog's password field resets
 * itself (a fresh `useState`) every time the dialog re-opens, instead of
 * carrying over whatever was typed and abandoned last time.
 */
function DeleteAccountRow({ chevron }: { chevron: ReactNode }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');

  const { deleteAccount, busy, error, clearError } = useSession();
  const resetProfile = useProfile((s) => s.reset);

  const close = () => {
    setOpen(false);
    setPassword('');
    clearError();
  };

  const confirm = async () => {
    if (!password || busy) return;
    const ok = await deleteAccount(password);
    if (!ok) return;
    resetProfile();
    close();
    router.replace('/(auth)/login');
  };

  return (
    <>
      <ListRow
        leading={<Ionicons name="trash-outline" size={22} color={palette.error} />}
        title={t((s) => s.settings.deleteAccount)}
        subtitle={t((s) => s.settings.deleteAccountDetail)}
        trailing={chevron}
        onPress={() => setOpen(true)}
      />
      <Dialog visible={open} onDismiss={close} label={t((s) => s.settings.deleteAccountDialog.title)}>
        <Text variant="heading">{t((s) => s.settings.deleteAccountDialog.title)}</Text>
        <Text variant="body" color={palette.onSurfaceVariant}>
          {t((s) => s.settings.deleteAccountDialog.body)}
        </Text>
        <Input
          label={t((s) => s.settings.deleteAccountDialog.passwordLabel)}
          value={password}
          onChangeText={(v) => {
            clearError();
            setPassword(v);
          }}
          secureTextEntry
          autoComplete="current-password"
          returnKeyType="go"
          onSubmitEditing={confirm}
          error={error}
        />
        <DialogActions
          cancelLabel={t((s) => s.settings.deleteAccountDialog.cancel)}
          confirmLabel={t((s) => s.settings.deleteAccountDialog.confirm)}
          tone="danger"
          onCancel={close}
          onConfirm={confirm}
          confirmDisabled={!password || busy}
        />
      </Dialog>
    </>
  );
}
