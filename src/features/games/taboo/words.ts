/**
 * Taboo word deck.
 *
 * Real content, not placeholder data — the same status `roles.ts` has for
 * Vampire Village. A starter set curated for one clean gameplay loop; the real
 * source will eventually be `game_content/taboo/cards` (Firestore, mirroring
 * how `game_definitions` already backs the catalogue), at which point this
 * file becomes the offline fallback rather than the only deck.
 *
 * Five forbidden words per card, the traditional count — few enough to read at
 * a glance while the clock is running, many enough that the easy synonyms are
 * already gone.
 */

export interface TabooCard {
  id: string;
  word: string;
  forbidden: string[];
}

export const TABOO_WORDS: TabooCard[] = [
  { id: 'w01', word: 'Birthday', forbidden: ['Cake', 'Candle', 'Party', 'Age', 'Gift'] },
  { id: 'w02', word: 'Vampire', forbidden: ['Blood', 'Bite', 'Night', 'Garlic', 'Dracula'] },
  { id: 'w03', word: 'Umbrella', forbidden: ['Rain', 'Wet', 'Open', 'Handle', 'Cover'] },
  { id: 'w04', word: 'Pizza', forbidden: ['Cheese', 'Slice', 'Italian', 'Topping', 'Oven'] },
  { id: 'w05', word: 'Elevator', forbidden: ['Floor', 'Button', 'Stairs', 'Up', 'Building'] },
  { id: 'w06', word: 'Wedding', forbidden: ['Marry', 'Bride', 'Groom', 'Ring', 'Dress'] },
  { id: 'w07', word: 'Astronaut', forbidden: ['Space', 'Moon', 'Rocket', 'Suit', 'NASA'] },
  { id: 'w08', word: 'Toothbrush', forbidden: ['Teeth', 'Brush', 'Paste', 'Clean', 'Mouth'] },
  { id: 'w09', word: 'Snowman', forbidden: ['Snow', 'Carrot', 'Winter', 'Cold', 'Melt'] },
  { id: 'w10', word: 'Guitar', forbidden: ['String', 'Music', 'Play', 'Band', 'Chord'] },
  { id: 'w11', word: 'Hospital', forbidden: ['Doctor', 'Sick', 'Nurse', 'Bed', 'Emergency'] },
  { id: 'w12', word: 'Volcano', forbidden: ['Lava', 'Erupt', 'Mountain', 'Hot', 'Ash'] },
  { id: 'w13', word: 'Library', forbidden: ['Book', 'Quiet', 'Shelf', 'Read', 'Borrow'] },
  { id: 'w14', word: 'Passport', forbidden: ['Travel', 'Country', 'Airport', 'Photo', 'Stamp'] },
  { id: 'w15', word: 'Spider', forbidden: ['Web', 'Leg', 'Bite', 'Insect', 'Crawl'] },
  { id: 'w16', word: 'Referee', forbidden: ['Whistle', 'Foul', 'Sport', 'Rule', 'Card'] },
  { id: 'w17', word: 'Campfire', forbidden: ['Wood', 'Marshmallow', 'Smoke', 'Tent', 'Spark'] },
  { id: 'w18', word: 'Alarm Clock', forbidden: ['Wake', 'Ring', 'Morning', 'Snooze', 'Time'] },
  { id: 'w19', word: 'Skeleton', forbidden: ['Bone', 'Body', 'Halloween', 'Rattle', 'X-ray'] },
  { id: 'w20', word: 'Roller Coaster', forbidden: ['Ride', 'Loop', 'Fast', 'Scream', 'Track'] },
  { id: 'w21', word: 'Detective', forbidden: ['Clue', 'Solve', 'Crime', 'Suspect', 'Mystery'] },
  { id: 'w22', word: 'Beehive', forbidden: ['Bee', 'Honey', 'Sting', 'Buzz', 'Queen'] },
  { id: 'w23', word: 'Fireworks', forbidden: ['Sky', 'Explode', 'Bang', 'Light', 'Celebrate'] },
  { id: 'w24', word: 'Treasure Map', forbidden: ['Pirate', 'X', 'Gold', 'Island', 'Hidden'] },
  { id: 'w25', word: 'Piano', forbidden: ['Key', 'Play', 'Music', 'Black', 'White'] },
  { id: 'w26', word: 'Scarecrow', forbidden: ['Field', 'Crow', 'Straw', 'Farm', 'Bird'] },
  { id: 'w27', word: 'Submarine', forbidden: ['Underwater', 'Ocean', 'Navy', 'Dive', 'Periscope'] },
  { id: 'w28', word: 'Magician', forbidden: ['Trick', 'Hat', 'Rabbit', 'Wand', 'Illusion'] },
  { id: 'w29', word: 'Waterfall', forbidden: ['River', 'Fall', 'Water', 'Cliff', 'Splash'] },
  { id: 'w30', word: 'Chess', forbidden: ['King', 'Board', 'Move', 'Piece', 'Checkmate'] },
];
