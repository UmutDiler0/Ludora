/**
 * Detective case catalogue.
 *
 * Deliberately empty. Detective is not competitive like the other four games
 * here — there is no engine, no config, no round structure to build yet,
 * because there is nothing to run one *on*: a case is written content (a
 * premise, evidence, a solution), and none has been written. Building the
 * solving flow (an evidence viewer, an accusation screen) against zero real
 * cases would mean designing it twice once real content exists to test it
 * against, so it waits.
 *
 * What this file commits to now: a case is either free or paid, matching the
 * "some free, some paid" model discussed for the eventual catalogue (five
 * free, ten paid was the example, not a constant worth hard-coding against
 * an array that's still empty). The real source will eventually be
 * `game_content/detective/stories` (Firestore), mirroring how Taboo's,
 * Sketch It's and Zarta's content banks already stand in for their own
 * `game_content/{gameId}` collections — see docs/firebase.md §3.9.
 */

export interface DetectiveStory {
  id: string;
  title: string;
  /** One or two sentences — what pulls a player into the case, not the case itself. */
  teaser: string;
  isPremium: boolean;
}

export const DETECTIVE_STORIES: DetectiveStory[] = [];
