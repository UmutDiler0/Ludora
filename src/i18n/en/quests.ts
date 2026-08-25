export const quests = {
  daily: 'Daily',
  weekly: 'Weekly',
  today: 'Today',
  thisWeek: 'This week',
  resetsIn: (in_: string) => `resets in ${in_}`,
  claim: (gold: number) => `Claim ${gold}g`,
  collected: 'Collected',
  /** Keyed by `QuestDef.id` — see `features/progression/quests.ts`. */
  items: {
    d_play_1: { name: 'Warm Up', description: 'Finish one game.' },
    d_play_3: { name: 'Triple Threat', description: 'Finish three games.' },
    d_win_1: { name: 'Take One', description: 'Win a game.' },
    d_distinct_2: { name: 'Mix It Up', description: 'Play two different games.' },
    d_survive_3: { name: 'Still Standing', description: 'Survive three rounds in one game.' },
    w_play_15: { name: 'Marathon', description: 'Finish fifteen games.' },
    w_win_7: { name: 'On a Roll', description: 'Win seven games.' },
    w_distinct_4: { name: 'Well Rounded', description: 'Play four different games.' },
    w_survive_20: { name: 'Hard to Kill', description: 'Survive twenty rounds in total.' },
  },
};
