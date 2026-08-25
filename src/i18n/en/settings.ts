export const settings = {
  title: 'Settings',
  subtitle: 'Language and account',
  language: 'Language',
  languageDetail: 'Pick which language Ludora shows.',
  languageSystem: 'Use phone setting',
  languageSystemDetail: (resolved: string) => `Follows your device — currently ${resolved}`,
  languageEnglish: 'English',
  languageTurkish: 'Türkçe',

  account: 'Account',
  changePassword: 'Change password',
  changePasswordDetail: 'Update the password you sign in with.',
  deleteAccount: 'Delete account',
  deleteAccountDetail: 'Permanently remove this account and its data from this device.',
  guestAccountNotice: 'Sign in to a real account to manage password and account settings.',

  support: 'Support',
  privacyPolicy: 'Privacy policy',
  privacyPolicyDetail: 'How Ludora handles your data.',
  help: 'Help & support',
  helpDetail: 'Answers to common questions.',

  deleteAccountDialog: {
    title: 'Delete account?',
    body: 'This permanently deletes your account and everything tied to it on this device — gold, avatar items, achievements. This cannot be undone.',
    passwordLabel: 'Confirm your password',
    confirm: 'Delete my account',
    cancel: 'Cancel',
  },
};
