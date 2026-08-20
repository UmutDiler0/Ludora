import { Stack } from 'expo-router';

import { palette } from '@/theme/tokens';

/** Unauthenticated stack. The boot router in `index.tsx` decides who lands here. */
export default function AuthLayout() {
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
