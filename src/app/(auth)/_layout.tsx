import { Stack } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';

/** Unauthenticated stack. The boot router in `index.tsx` decides who lands here. */
export default function AuthLayout() {
  const { palette } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
