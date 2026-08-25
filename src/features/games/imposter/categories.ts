/**
 * Imposter's category pools. Real content, not placeholder text — same status
 * `questions.ts`/`words.ts`/`prompts.ts` have for Zarta/Taboo/Sketch It.
 *
 * Every round draws one category, then one value from that category's pool.
 * Every player except the imposter is told the value; the imposter is told
 * only the category, and has to guess the value (or blend in well enough that
 * nobody votes them out) before time runs out.
 */

export interface ImposterValue {
  id: string;
  text: string;
}

export interface ImposterCategory {
  id: string;
  name: string;
  values: ImposterValue[];
}

export const IMPOSTER_CATEGORIES: ImposterCategory[] = [
  {
    id: 'money',
    name: 'Money',
    values: [
      { id: 'money_1', text: '5' },
      { id: 'money_2', text: '50' },
      { id: 'money_3', text: '500' },
      { id: 'money_4', text: '5,000' },
      { id: 'money_5', text: '50,000' },
      { id: 'money_6', text: '500,000' },
      { id: 'money_7', text: '5,000,000' },
      { id: 'money_8', text: '10,000,000' },
    ],
  },
  {
    id: 'place',
    name: 'Place',
    values: [
      { id: 'place_1', text: 'Paris' },
      { id: 'place_2', text: 'Tokyo' },
      { id: 'place_3', text: 'Cairo' },
      { id: 'place_4', text: 'Rio de Janeiro' },
      { id: 'place_5', text: 'Reykjavik' },
      { id: 'place_6', text: 'Marrakech' },
      { id: 'place_7', text: 'Bangkok' },
      { id: 'place_8', text: 'Oslo' },
    ],
  },
  {
    id: 'year',
    name: 'Year',
    values: [
      { id: 'year_1', text: '1969' },
      { id: 'year_2', text: '1987' },
      { id: 'year_3', text: '1999' },
      { id: 'year_4', text: '2001' },
      { id: 'year_5', text: '2008' },
      { id: 'year_6', text: '2012' },
      { id: 'year_7', text: '2020' },
      { id: 'year_8', text: '2030' },
    ],
  },
  {
    id: 'animal',
    name: 'Animal',
    values: [
      { id: 'animal_1', text: 'Elephant' },
      { id: 'animal_2', text: 'Penguin' },
      { id: 'animal_3', text: 'Octopus' },
      { id: 'animal_4', text: 'Kangaroo' },
      { id: 'animal_5', text: 'Flamingo' },
      { id: 'animal_6', text: 'Hedgehog' },
      { id: 'animal_7', text: 'Cheetah' },
      { id: 'animal_8', text: 'Narwhal' },
    ],
  },
  {
    id: 'food',
    name: 'Food',
    values: [
      { id: 'food_1', text: 'Sushi' },
      { id: 'food_2', text: 'Tacos' },
      { id: 'food_3', text: 'Lasagna' },
      { id: 'food_4', text: 'Baklava' },
      { id: 'food_5', text: 'Pho' },
      { id: 'food_6', text: 'Paella' },
      { id: 'food_7', text: 'Dumplings' },
      { id: 'food_8', text: 'Falafel' },
    ],
  },
];
