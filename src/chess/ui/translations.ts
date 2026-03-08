export type Language = "fi" | "en";

export interface TranslationKeys {
  // Language select screen
  langButtonFinnish: string;
  langButtonEnglish: string;

  // Play config screen
  playerWhite: string;
  playerBlack: string;
  toggleHuman: string;
  toggleAI: string;
  algoEasy: string;
  algoMedium: string;
  fenLabel: string;
  fenInvalid: string;
  btnPlay: string;
  btnBack: string;
  escHint: string;

  // Pause menu
  pauseTitle: string;
  btnCopyFen: string;
  btnClose: string;
  fenCopied: string;

  // End state
  drawThreefold: string;
  draw75Move: string;
  draw: string;
  stalemate: string;
  whiteWon: string;
  blackWon: string;
}

const en: TranslationKeys = {
  langButtonFinnish: "Suomeksi",
  langButtonEnglish: "In English",

  playerWhite: "White",
  playerBlack: "Black",
  toggleHuman: "Human",
  toggleAI: "AI",
  algoEasy: "Easy",
  algoMedium: "Medium",
  fenLabel: "Starting position (FEN)",
  fenInvalid: "Invalid FEN.",
  btnPlay: "Play",
  btnBack: "Back",
  escHint: "You can open a menu during the game by pressing Esc",

  pauseTitle: "Game Paused",
  btnCopyFen: "Copy FEN to Clipboard",
  btnClose: "Close",
  fenCopied: "FEN copied to clipboard",

  drawThreefold: "Draw by threefold repetition!",
  draw75Move: "Draw by 75-move rule!",
  draw: "Draw!",
  stalemate: "Stalemate!",
  whiteWon: "White won the match!",
  blackWon: "Black won the match!",
};

const fi: TranslationKeys = {
  langButtonFinnish: "Suomeksi",
  langButtonEnglish: "In English",

  playerWhite: "Valkoinen",
  playerBlack: "Musta",
  toggleHuman: "Ihminen",
  toggleAI: "AI",
  algoEasy: "Helppo",
  algoMedium: "Keskivaikea",
  fenLabel: "Aloitustilanne (FEN)",
  fenInvalid: "Virheellinen FEN.",
  btnPlay: "Pelaa",
  btnBack: "Takaisin",
  escHint: "Voit avata valikon pelin aikana painamalla Esc",

  pauseTitle: "Pelitauko",
  btnCopyFen: "Kopioi FEN leikepöydälle",
  btnClose: "Sulje",
  fenCopied: "FEN kopioitu leikepöydälle",

  drawThreefold: "Tasapeli (threefold repetition)",
  draw75Move: "Tasapeli (75-move rule)",
  draw: "Tasapeli!",
  stalemate: "Patti!",
  whiteWon: "Valkoinen voitti pelin!",
  blackWon: "Musta voitti pelin!",
};

const translations: Record<Language, TranslationKeys> = { en, fi };

export function getTranslations(lang: Language): TranslationKeys {
  return translations[lang];
}
