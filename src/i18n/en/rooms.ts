/** Find Room screen — code entry plus the public room list (services/rooms). */
export const rooms = {
  title: 'Find a Room',
  subtitle: 'Enter a code or join an open public room.',
  codeLabel: 'Room code',
  codePlaceholder: 'ABC123',
  join: 'Join',
  codeNotFound: 'No open room with that code.',
  publicRoomsLabel: 'Public rooms',
  emptyTitle: 'No public rooms yet',
  emptyBody: 'Start a game from Play and choose Public — it will show up here.',
  hostedBy: (name: string) => `Hosted by ${name}`,
  waiting: 'Waiting',
};
