import { AIAlgorithm } from "../gamelogic/players/ai";
import type { PlayerConfig } from "./GameplayScene";

const PLAY_SETTINGS_KEY = "chess_play_settings";

export function loadPlaySettings(): { white: PlayerConfig; black: PlayerConfig } {
  try {
    const raw = sessionStorage.getItem(PLAY_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { white: PlayerConfig; black: PlayerConfig };
      const validAlgorithms = Object.values(AIAlgorithm) as string[];
      const sanitize = (cfg: PlayerConfig): PlayerConfig => ({
        type: cfg.type === "ai" ? "ai" : "human",
        algorithm: validAlgorithms.includes(cfg.algorithm as string)
          ? cfg.algorithm
          : AIAlgorithm.BEST_RESPONSE,
      });
      return { white: sanitize(parsed.white), black: sanitize(parsed.black) };
    }
  } catch {
    // ignore malformed data
  }
  return {
    white: { type: "human", algorithm: AIAlgorithm.BEST_RESPONSE },
    black: { type: "ai", algorithm: AIAlgorithm.BEST_RESPONSE },
  };
}

export function savePlaySettings(white: PlayerConfig, black: PlayerConfig): void {
  try {
    sessionStorage.setItem(PLAY_SETTINGS_KEY, JSON.stringify({ white, black }));
  } catch {
    // ignore
  }
}
