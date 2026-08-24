/**
 * Zarta question bank.
 *
 * Real content, the same status `words.ts`/`prompts.ts` have for Taboo and
 * Sketch It — a starter set standing in for the eventual
 * `game_content/zarta/questions` (Firestore) source. Short, unambiguous
 * factual answers on purpose: the whole game is other players' bluffs
 * sitting next to the truth, and a bluff only works if it's the same shape
 * as a real answer (one place, one name, one number).
 */

export interface ZartaQuestion {
  id: string;
  question: string;
  answer: string;
}

export const ZARTA_QUESTIONS: ZartaQuestion[] = [
  { id: 'z01', question: 'Where is the capital of Turkey?', answer: 'Ankara' },
  { id: 'z02', question: 'What is the largest planet in our solar system?', answer: 'Jupiter' },
  { id: 'z03', question: 'What is the longest river in the world?', answer: 'The Nile' },
  { id: 'z04', question: 'Where is the capital of Japan?', answer: 'Tokyo' },
  { id: 'z05', question: 'Who painted the Mona Lisa?', answer: 'Leonardo da Vinci' },
  { id: 'z06', question: 'What is the tallest mountain in the world?', answer: 'Mount Everest' },
  { id: 'z07', question: 'What is the smallest country in the world?', answer: 'Vatican City' },
  { id: 'z08', question: 'Where is the capital of Australia?', answer: 'Canberra' },
  { id: 'z09', question: 'What is the hardest natural substance on Earth?', answer: 'Diamond' },
  { id: 'z10', question: 'Who wrote Romeo and Juliet?', answer: 'William Shakespeare' },
  { id: 'z11', question: 'What is the currency of Japan?', answer: 'Yen' },
  { id: 'z12', question: 'What is the largest ocean on Earth?', answer: 'The Pacific Ocean' },
  { id: 'z13', question: 'Where is the capital of Canada?', answer: 'Ottawa' },
  { id: 'z14', question: 'What is the fastest land animal?', answer: 'Cheetah' },
  { id: 'z15', question: 'What is the largest desert in the world?', answer: 'The Sahara' },
  { id: 'z16', question: 'Who developed the theory of relativity?', answer: 'Albert Einstein' },
  { id: 'z17', question: 'What is the national sport of Japan?', answer: 'Sumo wrestling' },
  { id: 'z18', question: 'Where is the capital of Egypt?', answer: 'Cairo' },
  { id: 'z19', question: 'What is the chemical symbol for gold?', answer: 'Au' },
  { id: 'z20', question: 'What is the largest mammal in the world?', answer: 'Blue whale' },
  { id: 'z21', question: 'Where is the capital of Brazil?', answer: 'Brasília' },
  { id: 'z22', question: 'How many bones are in the adult human body?', answer: '206' },
  { id: 'z23', question: 'What is the deepest point in the ocean?', answer: 'The Mariana Trench' },
  { id: 'z24', question: 'Who was the first person to walk on the Moon?', answer: 'Neil Armstrong' },
  { id: 'z25', question: 'What is the official language of Brazil?', answer: 'Portuguese' },
  { id: 'z26', question: 'What is the tallest animal in the world?', answer: 'Giraffe' },
  { id: 'z27', question: 'Where is the capital of South Korea?', answer: 'Seoul' },
  { id: 'z28', question: 'What gas do plants absorb from the atmosphere?', answer: 'Carbon dioxide' },
  { id: 'z29', question: 'What is the largest island in the world?', answer: 'Greenland' },
  { id: 'z30', question: 'Who composed the Ninth Symphony?', answer: 'Ludwig van Beethoven' },
];
