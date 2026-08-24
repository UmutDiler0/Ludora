import type { Palette } from '@/theme/palettes';
import type { TabooTeamId } from '../state';

/**
 * Presentation only — team *names* ("Red"/"Blue") come from the engine
 * (`state.teams[id].name`) so the UI never invents its own labelling. Which
 * palette colour stands for which team is a screen concern the engine has no
 * reason to know, so it lives here instead.
 */
export const teamAccent = (palette: Palette, id: TabooTeamId): string =>
  id === 'A' ? palette.error : palette.secondary;
