/**
 * Detective case catalogue.
 *
 * Real content — the same status `words.ts`/`prompts.ts`/`questions.ts` have
 * for Taboo, Sketch It and Zarta: a starter set, not placeholder text,
 * standing in for the eventual `game_content/detective/stories` (Firestore)
 * source. Five free, ten paid, matching the ratio discussed for the
 * catalogue when this feature was first scoped.
 *
 * Still no engine, no evidence, no solution behind any of these — that's a
 * separate build (an evidence viewer, an accusation screen) this file
 * deliberately doesn't get ahead of. What exists here is the browsable
 * catalogue: enough for `/detective-stories` to be a real screen instead of
 * an empty state.
 */

export interface DetectiveStory {
  id: string;
  title: string;
  /** One or two sentences — what pulls a player into the case, not the case itself. */
  teaser: string;
  isPremium: boolean;
}

export const DETECTIVE_STORIES: DetectiveStory[] = [
  // free
  {
    id: 'd01',
    title: 'The Locked Study',
    teaser: 'A wealthy collector is found dead in a room locked from the inside. No weapon, no forced entry, no explanation.',
    isPremium: false,
  },
  {
    id: 'd02',
    title: 'The Vanishing Bride',
    teaser: 'She walked down the aisle and never reached the altar. The chapel doors were watched the entire time.',
    isPremium: false,
  },
  {
    id: 'd03',
    title: 'The Midnight Train',
    teaser: 'A passenger boards at the last stop before the city. By morning, their seat is empty and their ticket is gone.',
    isPremium: false,
  },
  {
    id: 'd04',
    title: 'Letters from No One',
    teaser: "Someone has left notes on her doorstep for a month. She's never met them — and they know things she's never told anyone.",
    isPremium: false,
  },
  {
    id: 'd05',
    title: 'The Understudy',
    teaser: 'On opening night, the lead actress collapses on stage. The understudy insists she saw it coming.',
    isPremium: false,
  },

  // premium
  {
    id: 'd06',
    title: 'The Gallery Heist',
    teaser: 'A priceless painting disappears from a room full of witnesses — none of whom saw a thing.',
    isPremium: true,
  },
  {
    id: 'd07',
    title: 'Ashes at the Lighthouse',
    teaser: "The keeper is gone, the light is out, and the logbook's last entry makes no sense at all.",
    isPremium: true,
  },
  {
    id: 'd08',
    title: 'The Second Twin',
    teaser: 'A man claims his identical twin died years ago. Someone at the reunion says otherwise.',
    isPremium: true,
  },
  {
    id: 'd09',
    title: 'The Poisoned Toast',
    teaser: 'A wedding toast, a champagne glass, and a groom who never made it to the honeymoon.',
    isPremium: true,
  },
  {
    id: 'd10',
    title: 'Room 12B',
    teaser: 'Every guest who stays in that hotel room checks out early. Nobody will say why.',
    isPremium: true,
  },
  {
    id: 'd11',
    title: "The Cartographer's Error",
    teaser: 'A map leads exactly where it shouldn\'t. Someone drew it that way on purpose.',
    isPremium: true,
  },
  {
    id: 'd12',
    title: 'The Silent Partner',
    teaser: 'A business is thriving. Its second owner has never been seen, and the paperwork doesn\'t add up.',
    isPremium: true,
  },
  {
    id: 'd13',
    title: 'Six Signatures',
    teaser: 'A will is contested by six people who each swear they watched it signed — on six different days.',
    isPremium: true,
  },
  {
    id: 'd14',
    title: 'The Understaffed Manor',
    teaser: 'Every servant in the house quit the same week. The family stayed. Nobody will explain why.',
    isPremium: true,
  },
  {
    id: 'd15',
    title: 'What the Orchard Keeps',
    teaser: 'Something is buried under the oldest tree on the property — and the deed says it was never planted there.',
    isPremium: true,
  },
];
