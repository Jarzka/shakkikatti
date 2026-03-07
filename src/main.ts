import { SpriteContainer } from "./engine/SpriteContainer";
import { GameLoop } from "./engine/GameLoop";
import { ChessMouse, setTileSize } from "./chess/inputdevices/ChessMouse";
import { MainMenuScene } from "./chess/scenes/MainMenuScene";
import { GameplayScene, type GameConfig } from "./chess/scenes/GameplayScene";

const BOARD_SIZE = 8;
const TILE_SIZE = 64;

function resizeCanvas(canvas: HTMLCanvasElement): void {
  const effectiveTileSize = Math.min(
    TILE_SIZE,
    Math.floor(window.innerWidth / BOARD_SIZE),
  );
  canvas.width = BOARD_SIZE * effectiveTileSize;
  canvas.height = BOARD_SIZE * effectiveTileSize;
  setTileSize(effectiveTileSize);
}

async function main() {
  const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
  resizeCanvas(canvas);
  window.addEventListener("resize", () => resizeCanvas(canvas));
  const ctx = canvas.getContext("2d")!;

  // Load sprites
  const sprites = new SpriteContainer();
  await sprites.loadAllGameboardSprites();

  // Setup mouse
  const mouse = new ChessMouse();
  mouse.attachToCanvas(canvas);

  // Show main menu
  const menuScene = new MainMenuScene();
  menuScene.show();

  let gameplayScene: GameplayScene | undefined;

  // Game loop
  const loop = new GameLoop(ctx);

  menuScene.onGameStart = (config: GameConfig) => {
    gameplayScene?.destroy();
    gameplayScene = new GameplayScene(sprites, config, mouse);
    loop.setScene(gameplayScene);
  };

  loop.start();
}

main().catch(console.error);
