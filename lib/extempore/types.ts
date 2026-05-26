export type Language = 'english' | 'hindi';
export type Duration = '1' | '2' | '3';
export type EnglishStage = 'junior' | 'middle' | 'senior';
export type HindiStage = 'प्रारंभिक' | 'मध्य' | 'वरिष्ठ';

export type DictionaryEntry = {
  word: string;
  meaning: string;
  usage: string;
};

export type Draft = {
  topic: string;
  title: string;
  intro: string;
  paragraphs: string[];
  closing: string;
  ideas: string[];
  difficultWords: DictionaryEntry[];
  duration: Duration;
  estimatedLength: string;
};
