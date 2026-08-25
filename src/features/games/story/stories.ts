import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

/**
 * Complete the Story catalogue.
 *
 * Real content — the same status `words.ts`/`prompts.ts`/`questions.ts` have
 * for Taboo, Sketch It and Zarta: a starter set, not placeholder text,
 * standing in for the eventual `game_content/story/fragments` (Firestore)
 * source. Five free, ten paid, matching the ratio discussed for the
 * catalogue when this feature was first scoped.
 *
 * The mechanic this shape commits to: a player gets `opening` — one or two
 * sentences, nothing more — and has to work out the whole story from that
 * fragment. That's a genuinely different premise from what this game used to
 * be (the round-robin "everyone adds one sentence" party game the old
 * tagline described); the catalogue and tagline were updated to match this
 * redefinition when this file was first added. Still no "find the whole
 * story" screen behind any of these — that's a separate build this file
 * deliberately doesn't get ahead of. What exists here is the browsable
 * catalogue: enough for `/complete-the-story` to be a real screen instead of
 * an empty state.
 *
 * `icon` is each fragment's cover art — see `ContentTile`. Hand-picked per
 * entry rather than derived from the id, so it actually names something from
 * the fragment rather than being a random decoration.
 */

export interface CompleteStoryEntry {
  id: string;
  title: string;
  /** The one or two sentences a player actually gets to start from. */
  opening: string;
  isPremium: boolean;
  icon: ComponentProps<typeof Ionicons>['name'];
}

export const COMPLETE_STORY_ENTRIES: CompleteStoryEntry[] = [
  // free
  {
    id: 's01',
    title: 'The Last Light',
    opening: 'She left the porch light on for eleven years after he stopped coming home.',
    isPremium: false,
    icon: 'bulb-outline',
  },
  {
    id: 's02',
    title: 'Paper Boats',
    opening: 'Every summer the boy folded one more boat than the year before, and never once explained why.',
    isPremium: false,
    icon: 'boat-outline',
  },
  {
    id: 's03',
    title: 'The Uninvited Guest',
    opening: 'Nobody remembers inviting him, and yet there he is in every photo from that night.',
    isPremium: false,
    icon: 'person-add-outline',
  },
  {
    id: 's04',
    title: 'Borrowed Time',
    opening: "The hallway clock had been stopped at 3:14 for as long as anyone could remember — until this morning.",
    isPremium: false,
    icon: 'time-outline',
  },
  {
    id: 's05',
    title: 'The Empty Chair',
    opening: "They set a place for her at every dinner, though she'd been gone for three years.",
    isPremium: false,
    icon: 'person-remove-outline',
  },

  // premium
  {
    id: 's06',
    title: 'The Last Postcard',
    opening: 'It arrived a week after the funeral, postmarked from a town that no longer exists.',
    isPremium: true,
    icon: 'mail-open-outline',
  },
  {
    id: 's07',
    title: 'Nine Doors',
    opening: 'The house had eight doors when they bought it. There have always been nine since.',
    isPremium: true,
    icon: 'grid-outline',
  },
  {
    id: 's08',
    title: "The Understudy's Diary",
    opening: 'She found the diary in the dressing room, three entries ahead of the day she read it.',
    isPremium: true,
    icon: 'book-outline',
  },
  {
    id: 's09',
    title: 'The Cartwright Debt',
    opening: "Nobody in town would say what the family owed — only that it was finally being collected.",
    isPremium: true,
    icon: 'cash-outline',
  },
  {
    id: 's10',
    title: 'Salt and Silence',
    opening: 'The fishermen stopped going out past the old buoy the year the singing started.',
    isPremium: true,
    icon: 'water-outline',
  },
  {
    id: 's11',
    title: 'The Understory',
    opening: 'The forest grew back overnight, exactly where the house used to stand.',
    isPremium: true,
    icon: 'leaf-outline',
  },
  {
    id: 's12',
    title: 'Second Names',
    opening: 'Everyone in the village had two names — one for the day, and one nobody said out loud.',
    isPremium: true,
    icon: 'person-outline',
  },
  {
    id: 's13',
    title: 'The Weight of It',
    opening: 'The letter was one page, but it took both of them to carry it to the fire.',
    isPremium: true,
    icon: 'flame-outline',
  },
  {
    id: 's14',
    title: 'What the Tide Returned',
    opening: 'The ring came back on the same beach, thirty years and one storm later.',
    isPremium: true,
    icon: 'diamond-outline',
  },
  {
    id: 's15',
    title: 'The Quiet Roommate',
    opening: 'Three people lived in that apartment. The lease only ever had two names on it.',
    isPremium: true,
    icon: 'home-outline',
  },
];
