/**
 * Sketch It prompt bank.
 *
 * Real content, the same status `words.ts` has for Taboo — a starter set
 * curated for one clean gameplay loop, standing in for the eventual
 * `game_content/sketchIt/prompts` (Firestore) source. Picked for being fast to
 * draw and hard to mistake for something else once a few lines are down,
 * since the round is timed and the whole room is trying to read the sketch
 * as it happens.
 */

export interface SketchPrompt {
  id: string;
  word: string;
}

export const SKETCH_PROMPTS: SketchPrompt[] = [
  { id: 's01', word: 'Cat' },
  { id: 's02', word: 'Umbrella' },
  { id: 's03', word: 'Robot' },
  { id: 's04', word: 'Pizza' },
  { id: 's05', word: 'Rainbow' },
  { id: 's06', word: 'Guitar' },
  { id: 's07', word: 'Snowman' },
  { id: 's08', word: 'Rocket' },
  { id: 's09', word: 'Octopus' },
  { id: 's10', word: 'Birthday Cake' },
  { id: 's11', word: 'Ghost' },
  { id: 's12', word: 'Sunglasses' },
  { id: 's13', word: 'Castle' },
  { id: 's14', word: 'Dinosaur' },
  { id: 's15', word: 'Ice Cream' },
  { id: 's16', word: 'Pirate Ship' },
  { id: 's17', word: 'Butterfly' },
  { id: 's18', word: 'Volcano' },
  { id: 's19', word: 'Snail' },
  { id: 's20', word: 'Traffic Light' },
  { id: 's21', word: 'Kangaroo' },
  { id: 's22', word: 'Lighthouse' },
  { id: 's23', word: 'Spider Web' },
  { id: 's24', word: 'Sandwich' },
  { id: 's25', word: 'Alarm Clock' },
  { id: 's26', word: 'Penguin' },
  { id: 's27', word: 'Windmill' },
  { id: 's28', word: 'Dragon' },
  { id: 's29', word: 'Fishing Rod' },
  { id: 's30', word: 'Snowflake' },
  { id: 's31', word: 'Wizard Hat' },
  { id: 's32', word: 'Cactus' },
  { id: 's33', word: 'Hot Air Balloon' },
  { id: 's34', word: 'Mermaid' },
  { id: 's35', word: 'Skateboard' },
  { id: 's36', word: 'Beehive' },
  { id: 's37', word: 'Campfire' },
  { id: 's38', word: 'Submarine' },
  { id: 's39', word: 'Scarecrow' },
  { id: 's40', word: 'Roller Coaster' },
];
