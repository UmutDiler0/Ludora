/**
 * Complete the Story catalogue.
 *
 * Deliberately empty, same restraint as `features/games/detective/stories.ts`
 * and for the same reason: this is written content, not a rule an engine can
 * run, and none has been written yet.
 *
 * The mechanic this shape commits to: a player gets `opening` — one or two
 * sentences, nothing more — and has to work out the whole story from that
 * fragment. That's a genuinely different premise from what this game used to
 * be (the round-robin "everyone adds one sentence" party game the old
 * tagline described); the catalogue and tagline were updated to match this
 * redefinition when this file was added. Free/paid follows the same
 * per-story model Detective uses (five free, ten paid was the example, not a
 * constant worth hard-coding against an empty array). The real source will
 * eventually be `game_content/story/fragments` (Firestore), mirroring the
 * other three games' content banks — see docs/firebase.md §3.9.
 */

export interface CompleteStoryEntry {
  id: string;
  title: string;
  /** The one or two sentences a player actually gets to start from. */
  opening: string;
  isPremium: boolean;
}

export const COMPLETE_STORY_ENTRIES: CompleteStoryEntry[] = [];
