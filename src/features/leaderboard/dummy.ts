import { avatarFromSeed } from '@/features/avatar/seeded';
import { normalizeAvatar, type AvatarConfig } from '@/features/avatar/types';

/**
 * Placeholder data for the Leaderboard screen (Mücadele — spec §8).
 *
 * ⚠️ Fake, quarantined here same as `features/home/dummy.ts`. Real source is
 * `leaderboards/{period}` (Firestore, scheduled aggregation job) — the screen
 * only imports `leaderboard(period)`, so swapping in the real query is a
 * one-line change.
 */

export type LeaderboardPeriod = 'weekly' | 'monthly';

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  displayName: string;
  score: number;
  /**
   * How this player looks. Real entries will carry the config denormalised onto
   * the leaderboard document — a board of 50 rows must not fan out into 50
   * profile reads. The fake ones are dealt from their uid; see `avatarFromSeed`.
   */
  avatar: AvatarConfig;
  isYou?: boolean;
}

/** A pool row before it has a rank or a face. */
type PoolRow = Pick<LeaderboardEntry, 'uid' | 'displayName' | 'score'>;

/** Dealt once at module load, so a rival never changes clothes between renders. */
const dress = (rows: PoolRow[]): Omit<LeaderboardEntry, 'rank'>[] =>
  rows.map((row) => ({ ...row, avatar: avatarFromSeed(row.uid) }));

const WEEKLY_POOL = dress([
  { uid: 'u_blazequeen', displayName: 'BlazeQueen', score: 9240 },
  { uid: 'u_shadowninja', displayName: 'ShadowNinja', score: 8760 },
  { uid: 'u_trashpanda', displayName: 'TrashPanda', score: 8330 },
  { uid: 'u_pixelwolf', displayName: 'PixelWolf', score: 7510 },
  { uid: 'u_nightowlxo', displayName: 'NightOwlXO', score: 6980 },
  { uid: 'u_cosmicjelly', displayName: 'CosmicJelly', score: 6420 },
  { uid: 'u_ironclover', displayName: 'IronClover', score: 5890 },
  { uid: 'u_velvetfox', displayName: 'VelvetFox', score: 5210 },
  { uid: 'u_luckyraven', displayName: 'LuckyRaven', score: 4680 },
  { uid: 'u_mintgoblin', displayName: 'MintGoblin', score: 3990 },
  { uid: 'u_rustyhawk', displayName: 'RustyHawk', score: 3340 },
  { uid: 'u_quietstorm', displayName: 'QuietStorm', score: 2710 },
  { uid: 'u_papertiger', displayName: 'PaperTiger', score: 2085 },
  { uid: 'u_glowmoth', displayName: 'GlowMoth', score: 1420 },
]);

const MONTHLY_POOL = dress([
  { uid: 'u_shadowninja', displayName: 'ShadowNinja', score: 28_140 },
  { uid: 'u_blazequeen', displayName: 'BlazeQueen', score: 26_980 },
  { uid: 'u_ironclover', displayName: 'IronClover', score: 24_310 },
  { uid: 'u_trashpanda', displayName: 'TrashPanda', score: 21_760 },
  { uid: 'u_velvetfox', displayName: 'VelvetFox', score: 19_050 },
  { uid: 'u_pixelwolf', displayName: 'PixelWolf', score: 17_280 },
  { uid: 'u_rustyhawk', displayName: 'RustyHawk', score: 15_120 },
  { uid: 'u_nightowlxo', displayName: 'NightOwlXO', score: 13_400 },
  { uid: 'u_luckyraven', displayName: 'LuckyRaven', score: 11_760 },
  { uid: 'u_cosmicjelly', displayName: 'CosmicJelly', score: 9_980 },
  { uid: 'u_quietstorm', displayName: 'QuietStorm', score: 8_240 },
  { uid: 'u_mintgoblin', displayName: 'MintGoblin', score: 6_710 },
  { uid: 'u_papertiger', displayName: 'PaperTiger', score: 5_180 },
  { uid: 'u_glowmoth', displayName: 'GlowMoth', score: 3_960 },
]);

/**
 * Merges the viewer's own score into the fake pool and re-ranks, so "you"
 * genuinely sit wherever your score lands rather than being pinned to a fake
 * slot. Ties fall behind the fake entry (`isYou` never wins a tie), so the
 * board reads as stable rather than jittery from run to run.
 */
export function leaderboard(
  period: LeaderboardPeriod,
  you: PoolRow & { avatar: Partial<AvatarConfig> },
): LeaderboardEntry[] {
  const pool = period === 'weekly' ? WEEKLY_POOL : MONTHLY_POOL;
  // Normalised here rather than trusted: a profile saved before a slot existed
  // would otherwise put a barefoot figure on the podium.
  return [...pool, { ...you, avatar: normalizeAvatar(you.avatar), isYou: true }]
    .sort((a, b) => b.score - a.score)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}
