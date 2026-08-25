import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { radius, stroke } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Per-item thumbnail for a content catalogue — Detective's cases and
 * Complete the Story's fragments. Same visual language `Avatar` already uses
 * for a placeholder identity (a coloured tile, not a photo — decision D19
 * has no image-generation tool available in this environment), applied here
 * to a piece of written content instead of a person: a deterministic colour
 * from `id` plus a hand-picked Ionicon naming what the entry is actually
 * about, so every case and every fragment reads as its own thing in the list
 * rather than a repeated placeholder square.
 */
export function ContentTile({
  id,
  icon,
  size = 44,
}: {
  id: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  size?: number;
}) {
  const { palette, avatarHues } = useTheme();
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const bg = avatarHues[hash % avatarHues.length];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: stroke.base,
        borderColor: palette.ink,
      }}>
      <Ionicons name={icon} size={size * 0.5} color={palette.onPrimary} />
    </View>
  );
}
