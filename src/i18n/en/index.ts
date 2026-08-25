import { achievements } from './achievements';
import { auth } from './auth';
import { avatar } from './avatar';
import { catalogue } from './catalogue';
import { common } from './common';
import { connection } from './connection';
import { detective } from './detective';
import { gameCore } from './gameCore';
import { home } from './home';
import { howToPlay } from './howToPlay';
import { imposter } from './imposter';
import { leaderboard } from './leaderboard';
import { onboarding } from './onboarding';
import { play } from './play';
import { profile } from './profile';
import { quests } from './quests';
import { settings } from './settings';
import { sketchIt } from './sketchIt';
import { story } from './story';
import { tabs } from './tabs';
import { taboo } from './taboo';
import { vampireVillage } from './vampireVillage';
import { zarta } from './zarta';

/**
 * The full English string tree — the shape every other locale (`tr/index.ts`)
 * must match exactly. `Strings` is derived from this object rather than
 * hand-written, so adding a key here is the only step required to make it
 * available to `t()`; TypeScript then requires every other locale to supply
 * it too.
 */
export const en = {
  achievements,
  auth,
  avatar,
  catalogue,
  common,
  connection,
  detective,
  gameCore,
  home,
  howToPlay,
  imposter,
  leaderboard,
  onboarding,
  play,
  profile,
  quests,
  settings,
  sketchIt,
  story,
  tabs,
  taboo,
  vampireVillage,
  zarta,
};

export type Strings = typeof en;
