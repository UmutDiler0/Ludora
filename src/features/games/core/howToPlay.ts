import type { GameId } from './types';

/**
 * "How to Play" copy for every catalogued game, keyed by `GameId` so adding
 * a game and forgetting this is a type error, not a silent gap. Content
 * only — `HowToPlayDialog` owns the rendering.
 *
 * A stub game (Agent) gets an honest "not designed yet" entry rather than
 * invented rules — same restraint this codebase already applies to content
 * before a feature is actually built (Detective's and Complete the Story's
 * catalogues sat empty for exactly this reason before real content landed).
 */

export interface HowToPlayEntry {
  title: string;
  steps: string[];
}

export const HOW_TO_PLAY: Record<GameId, HowToPlayEntry> = {
  vampireVillage: {
    title: 'Vampire Village',
    steps: [
      'Everyone gets a secret role — most are Villagers, a few are Vampires, plus a Seer and a Bodyguard if enabled.',
      'At night, the Vampires silently choose a victim, the Seer learns one player\'s true side, and the Bodyguard protects someone.',
      'By day, everyone discusses who they suspect, then votes to exile one player.',
      'Villagers win if every Vampire is exiled; Vampires win the moment they equal or outnumber the living.',
    ],
  },
  taboo: {
    title: 'Taboo Words',
    steps: [
      'Split into two teams. One player describes a secret word without ever saying it or any of its forbidden words.',
      'Teammates race to guess it before time runs out.',
      'Say a forbidden word — or the word itself — and the turn is skipped.',
      'Take turns describing. Most words guessed correctly wins.',
    ],
  },
  drawingGuess: {
    title: 'Sketch It',
    steps: [
      'Each round, one player becomes the artist and gets a secret word.',
      'They draw it on the shared canvas — no letters, no numbers — while everyone else watches and calls out guesses.',
      'Mark whoever guesses correctly; faster guesses score more.',
      'The artist scores too, based on how many people guessed. Everyone takes a turn as artist.',
    ],
  },
  zarta: {
    title: 'Zarta',
    steps: [
      'One trivia question appears. Everyone secretly writes an answer they think could fool the group — the real answer is mixed in anonymously.',
      "Everyone then votes for the answer they believe is true. You can't vote for your own.",
      'Pick the truth and score 1 point. Write a bluff someone falls for and score 2 points per person tricked.',
      'Highest score after every round wins.',
    ],
  },
  story: {
    title: 'Complete the Story',
    steps: [
      'Pick a fragment — one or two sentences to start from.',
      'Read it together and work out where the rest of the story goes, out loud, as a group.',
      "There's no scoring here — it's a conversation starter, not a race.",
      'Free fragments are always open; premium ones unlock more.',
    ],
  },
  detective: {
    title: 'Detective',
    steps: [
      'Pick a case and read the teaser together.',
      'Work through it as a group and try to solve it before revealing the answer.',
      "It's cooperative, not competitive — everyone's on the same side.",
      'Free cases are always open; premium ones unlock more.',
    ],
  },
  agent: {
    title: 'Agent',
    steps: ["This game's rules haven't been designed yet — check back once they land."],
  },
  imposter: {
    title: 'Imposter',
    steps: [
      'Everyone except one player (the Imposter) is shown the same secret value from a category — Money, Place, Year, and more.',
      "Discuss out loud without saying the value outright. The Imposter has to blend in without knowing what it is.",
      'Call a vote any time to accuse someone — get it right and everyone but the Imposter wins.',
      'The Imposter can also guess the value directly, once — get it right and the Imposter wins alone.',
      "Nobody finds out before time runs out? It's a draw.",
    ],
  },
};
