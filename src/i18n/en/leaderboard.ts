export const leaderboard = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  resetsInDays: (days: number, hours: number) => `Resets in ${days}d ${hours}h`,
  resetsInHours: (hours: number) => `Resets in ${hours}h`,
  you: 'You',
  guestsNotRanked: "Guests aren't ranked",
  guestsNotRankedBody: (period: string) => `Sign up to post a score and climb the ${period} board.`,
  signUp: 'Sign Up',
  yourRank: 'Your rank',
  thisWeek: 'This week',
  thisMonth: 'This month',
};
