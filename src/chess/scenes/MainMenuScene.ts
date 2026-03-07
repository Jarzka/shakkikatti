import { Scene } from "../../engine/Scene";
import { AIAlgorithm } from "../gamelogic/players/ai";
import { validateFEN } from "../gamelogic/fen";
import { Colors } from "../ui/colors";
import type { GameConfig, PlayerConfig } from "./GameplayScene";
import { loadPlaySettings, savePlaySettings } from "./playSettingsStorage";

/**
 * Multi-screen main menu rendered as an HTML overlay.
 *
 * Screen flow:
 *   Main Menu  →  Play Config  →  (game starts)
 */
export class MainMenuScene extends Scene {
  private overlay: HTMLDivElement | undefined;
  private container: HTMLDivElement | undefined;

  /** Fires when the player has configured a game and pressed "Play". */
  onGameStart: ((config: GameConfig) => void) | undefined;

  getName(): string {
    return "MAIN_MENU";
  }

  // ---- Public API ----

  show(): void {
    if (this.overlay !== undefined) return;

    this.overlay = document.createElement("div");
    Object.assign(this.overlay.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: Colors.OVERLAY_BG,
      zIndex: "10",
    });

    this.container = document.createElement("div");
    Object.assign(this.container.style, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "16px",
      position: "relative",
      zIndex: "2",
    });
    this.overlay.appendChild(this.container);

    const version = document.createElement("span");
    version.textContent = "v1.1.0";
    Object.assign(version.style, {
      position: "absolute",
      bottom: "10px",
      right: "14px",
      fontSize: "11px",
      fontFamily: Colors.FONT_FAMILY,
      color: Colors.TEXT_HINT,
      pointerEvents: "none",
      zIndex: "1",
    });
    this.overlay.appendChild(version);

    const credit = document.createElement("span");
    credit.textContent = "Game by Jari Hanhela";
    Object.assign(credit.style, {
      position: "absolute",
      bottom: "10px",
      left: "14px",
      fontSize: "11px",
      fontFamily: Colors.FONT_FAMILY,
      color: Colors.TEXT_HINT,
      pointerEvents: "none",
      zIndex: "1",
    });
    this.overlay.appendChild(credit);

    const sourceLink = document.createElement("a");
    sourceLink.textContent = "Source code";
    sourceLink.href = "https://github.com/Jarzka/shakkikatti";
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener noreferrer";
    Object.assign(sourceLink.style, {
      position: "absolute",
      bottom: "10px",
      left: "50%",
      transform: "translateX(-50%)",
      fontSize: "11px",
      fontFamily: Colors.FONT_FAMILY,
      color: Colors.TEXT_HINT,
      textDecoration: "underline",
      zIndex: "1",
      cursor: "pointer",
      transition: "color 0.2s",
    });
    sourceLink.addEventListener("mouseenter", () => {
      sourceLink.style.color = Colors.TEXT_PRIMARY;
    });
    sourceLink.addEventListener("mouseleave", () => {
      sourceLink.style.color = Colors.TEXT_HINT;
    });
    this.overlay.appendChild(sourceLink);

    const gameContainer = document.getElementById("game-container") ?? document.body;
    gameContainer.appendChild(this.overlay);
    this.showMainMenu();
  }

  hide(): void {
    if (this.overlay !== undefined) {
      this.overlay.remove();
      this.overlay = undefined;
      this.container = undefined;
    }
  }

  update(_timeDelta: number): void {
    // Static menu — nothing to update
  }

  render(_ctx: CanvasRenderingContext2D): void {
    // HTML overlay — no canvas rendering needed
  }

  // ---- Screen transitions ----

  /**
   * Animate current container children out, then call `next` to populate the
   * container with the new screen's elements.
   */
  private transitionTo(next: () => void): void {
    if (!this.container) return;

    const children = Array.from(this.container.children) as HTMLElement[];
    const outDuration = 0.3;
    const stagger = 0.05;
    const totalMs = (outDuration + children.length * stagger) * 1000 + 50;

    for (const [i, el] of children.entries()) {
      el.style.animation = `shakkiLogoOut ${outDuration}s ease-in ${(i * stagger).toFixed(2)}s both`;
    }

    setTimeout(() => {
      if (!this.container) return;
      this.container.innerHTML = "";
      next();
    }, totalMs);
  }

  // ---- Screen builders ----

  private showMainMenu(): void {
    if (!this.container) return;

    const logo = document.createElement("img");
    logo.src = "/assets/logo.avif";
    Object.assign(logo.style, {
      maxWidth: "280px",
      width: "80%",
      height: "auto",
      marginBottom: "8px",
      animation: "shakkiLogoIn 0.8s ease-out both",
    });
    this.container.appendChild(logo);

    const playBtn = this.makePrimaryButton("Play", "0.35");
    playBtn.addEventListener("click", () => this.transitionTo(() => this.showPlayConfig()));
    this.container.appendChild(playBtn);
  }

  private showPlayConfig(): void {
    if (!this.container) return;

    const { white: whiteConfig, black: blackConfig } = loadPlaySettings();

    let delay = 0.05;
    const nextDelay = () => {
      const d = delay.toFixed(2);
      delay += 0.1;
      return d;
    };

    // Player rows
    const saveSettings = () => savePlaySettings(whiteConfig, blackConfig);
    const whiteRow = this.makePlayerRow("White", whiteConfig, nextDelay(), saveSettings);
    this.container.appendChild(whiteRow);

    const blackRow = this.makePlayerRow("Black", blackConfig, nextDelay(), saveSettings);
    this.container.appendChild(blackRow);

    // FEN input (optional)
    const fenLabel = document.createElement("p");
    fenLabel.textContent = "Starting position (FEN)";
    Object.assign(fenLabel.style, {
      color: Colors.TEXT_SECONDARY,
      fontSize: "14px",
      fontFamily: Colors.FONT_FAMILY,
      margin: "8px 0 2px",
      animation: `shakkiLogoIn 0.6s ease-out ${nextDelay()}s both`,
    });
    this.container.appendChild(fenLabel);

    const fenTextarea = document.createElement("input");
    fenTextarea.type = "text";
    Object.assign(fenTextarea.style, {
      width: "340px",
      padding: "10px",
      fontSize: "13px",
      fontFamily: "monospace",
      background: Colors.INPUT_BG,
      color: Colors.TEXT_PRIMARY,
      border: `1px solid ${Colors.INPUT_BORDER}`,
      borderRadius: "6px",
      outline: "none",
      animation: `shakkiLogoIn 0.6s ease-out ${nextDelay()}s both`,
    });
    this.container.appendChild(fenTextarea);

    const fenError = document.createElement("p");
    fenError.textContent = "";
    Object.assign(fenError.style, {
      color: Colors.TEXT_ERROR,
      fontSize: "13px",
      fontFamily: Colors.FONT_FAMILY,
      margin: "0",
      minHeight: "18px",
      display: "none",
    });
    this.container.appendChild(fenError);

    // Button row
    const btnRow = document.createElement("div");
    Object.assign(btnRow.style, {
      display: "flex",
      gap: "12px",
      animation: `shakkiLogoIn 0.6s ease-out ${nextDelay()}s both`,
    });

    const playBtn = this.makePrimaryButton("Play", "0");
    playBtn.style.animation = "none"; // parent div handles animation
    playBtn.style.minWidth = "120px";
    playBtn.addEventListener("click", () => {
      const fen = fenTextarea.value.trim();
      if (fen) {
        const result = validateFEN(fen);
        if (!result.valid) {
          fenError.textContent = result.error ?? "Invalid FEN.";
          fenError.style.display = "block";
          return;
        }
      }
      fenError.style.display = "none";
      this.hide();
      this.onGameStart?.({ white: whiteConfig, black: blackConfig, ...(fen ? { fen } : {}) });
    });
    btnRow.appendChild(playBtn);

    const backBtn = this.makeSecondaryButton("Back");
    backBtn.addEventListener("click", () =>
      this.transitionTo(() => this.showMainMenu()),
    );
    btnRow.appendChild(backBtn);

    this.container.appendChild(btnRow);

    // Hint text (below buttons) — hidden on mobile via injected media query
    if (!document.getElementById("esc-hint-style")) {
      const style = document.createElement("style");
      style.id = "esc-hint-style";
      style.textContent = "@media (max-width: 600px) { .esc-hint { display: none !important; } }";
      document.head.appendChild(style);
    }
    const hint = document.createElement("p");
    hint.className = "esc-hint";
    hint.textContent = "You can open a menu during the game by pressing Esc";
    Object.assign(hint.style, {
      color: Colors.TEXT_HINT,
      fontSize: "13px",
      fontFamily: Colors.FONT_FAMILY,
      margin: "4px 0",
      textAlign: "center",
      maxWidth: "320px",
      animation: `shakkiLogoIn 0.6s ease-out ${nextDelay()}s both`,
    });
    this.container.appendChild(hint);
  }

  // ---- Component builders ----

  /**
   * Builds a player configuration row with a toggle (Human/AI) and an
   * algorithm selector that appears when AI is selected.
   * The `config` object is mutated in place as the user changes settings.
   */
  private makePlayerRow(
    label: string,
    config: PlayerConfig,
    animDelay: string,
    onChange?: () => void,
  ): HTMLDivElement {
    const row = document.createElement("div");
    Object.assign(row.style, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
      animation: `shakkiLogoIn 0.6s ease-out ${animDelay}s both`,
    });

    const labelEl = document.createElement("p");
    labelEl.textContent = label;
    Object.assign(labelEl.style, {
      color: Colors.TEXT_SECONDARY,
      fontSize: "15px",
      fontFamily: Colors.FONT_FAMILY,
      fontWeight: "bold",
      margin: "0",
    });
    row.appendChild(labelEl);

    const controls = document.createElement("div");
    Object.assign(controls.style, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "6px",
    });
    row.appendChild(controls);

    // Toggle row
    const toggleRow = document.createElement("div");
    Object.assign(toggleRow.style, {
      display: "flex",
      borderRadius: "6px",
      overflow: "hidden",
      border: `1px solid ${Colors.TOGGLE_BORDER}`,
    });

    const humanBtn = document.createElement("button");
    humanBtn.textContent = "Human";
    const aiBtn = document.createElement("button");
    aiBtn.textContent = "AI";

    const applyToggleStyle = (btn: HTMLButtonElement, active: boolean) => {
      Object.assign(btn.style, {
        padding: "8px 20px",
        fontSize: "15px",
        cursor: "pointer",
        border: "none",
        background: active ? Colors.BUTTON_PRIMARY : Colors.TOGGLE_INACTIVE_BG,
        color: active ? Colors.TEXT_PRIMARY : Colors.TOGGLE_INACTIVE_TEXT,
        fontFamily: Colors.FONT_FAMILY,
      });
    };

    // Algorithm selector (shown only when AI is selected)
    const algoSelect = document.createElement("select");
    Object.assign(algoSelect.style, {
      padding: "6px 10px",
      fontSize: "14px",
      fontFamily: Colors.FONT_FAMILY,
      background: Colors.INPUT_BG,
      color: Colors.TEXT_PRIMARY,
      border: `1px solid ${Colors.INPUT_BORDER}`,
      borderRadius: "6px",
      cursor: "pointer",
      display: config.type === "ai" ? "block" : "none",
    });

    const algorithms: { label: string; value: AIAlgorithm }[] = [
      { label: "BestResponse 2014 (easy)", value: AIAlgorithm.BEST_RESPONSE },
      { label: "AlphaSonne 2026 (medium)", value: AIAlgorithm.ALPHA_SONNE },
    ];
    for (const { label: algoLabel, value } of algorithms) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = algoLabel;
      opt.selected = value === config.algorithm;
      algoSelect.appendChild(opt);
    }
    algoSelect.addEventListener("change", () => {
      config.algorithm = algoSelect.value as AIAlgorithm;
      onChange?.();
    });

    humanBtn.addEventListener("click", () => {
      config.type = "human";
      applyToggleStyle(humanBtn, true);
      applyToggleStyle(aiBtn, false);
      algoSelect.style.display = "none";
      onChange?.();
    });
    aiBtn.addEventListener("click", () => {
      config.type = "ai";
      applyToggleStyle(humanBtn, false);
      applyToggleStyle(aiBtn, true);
      algoSelect.style.display = "block";
      onChange?.();
    });

    applyToggleStyle(humanBtn, config.type === "human");
    applyToggleStyle(aiBtn, config.type === "ai");

    toggleRow.appendChild(humanBtn);
    toggleRow.appendChild(aiBtn);
    controls.appendChild(toggleRow);
    controls.appendChild(algoSelect);

    return row;
  }

  private makePrimaryButton(label: string, animDelay: string): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.textContent = label;
    Object.assign(btn.style, {
      padding: "12px 32px",
      fontSize: "18px",
      cursor: "pointer",
      border: "none",
      borderRadius: "6px",
      background: Colors.BUTTON_PRIMARY,
      color: Colors.TEXT_PRIMARY,
      fontFamily: Colors.FONT_FAMILY,
      minWidth: "200px",
      animation: `shakkiLogoIn 0.6s ease-out ${animDelay}s both`,
    });
    btn.addEventListener("mouseenter", () => { btn.style.background = Colors.BUTTON_PRIMARY_HOVER; });
    btn.addEventListener("mouseleave", () => { btn.style.background = Colors.BUTTON_PRIMARY; });
    return btn;
  }

  private makeSecondaryButton(label: string): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.textContent = label;
    Object.assign(btn.style, {
      padding: "12px 32px",
      fontSize: "18px",
      cursor: "pointer",
      border: `1px solid ${Colors.BUTTON_SECONDARY_BORDER}`,
      borderRadius: "6px",
      background: Colors.BUTTON_SECONDARY_BG,
      color: Colors.BUTTON_SECONDARY_TEXT,
      fontFamily: Colors.FONT_FAMILY,
      minWidth: "120px",
    });
    btn.addEventListener("mouseenter", () => { btn.style.background = Colors.BUTTON_SECONDARY_BG_HOVER; });
    btn.addEventListener("mouseleave", () => { btn.style.background = Colors.BUTTON_SECONDARY_BG; });
    return btn;
  }
}
