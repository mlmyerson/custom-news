export type Phrase = {
  phrase: string;
  summary: string;
  weight: number;
};

export const placeholderPhrases: Phrase[] = [
  { phrase: 'Global Supply Chains', summary: 'Manufacturing corridors & shipping costs', weight: 42 },
  { phrase: 'Election Integrity', summary: 'Voter access, audits, and reforms', weight: 33 },
  { phrase: 'AI Regulation', summary: 'Governance for foundation models', weight: 27 },
  { phrase: 'Ceasefire Talks', summary: 'Diplomatic efforts across regions', weight: 31 },
  { phrase: 'Climate Finance', summary: 'Funding the energy transition', weight: 24 },
  { phrase: 'Rare Earth Metals', summary: 'Mining headlines in the Indo-Pacific', weight: 18 },
];
