import { useEffect, useRef, useState } from "react";
import {
  GROUND_Y,
  HEIGHT,
  RUNNER_SIZE,
  RUNNER_X,
  WIDTH,
  createGame,
  jump,
  loadBestScore,
  metres,
  saveBestScore,
  step,
  type GameState,
} from "@/lib/coffeeGame";

type Props = {
  /** The feed has loaded: the coffee shop appears and the run can end. */
  siteReady: boolean;
  /** "Go in" — close the game and show the feed. */
  onEnter: () => void;
};

function cssColor(name: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `hsl(${v})` : "#888";
}

function draw(ctx: CanvasRenderingContext2D, g: GameState) {
  const fg = cssColor("--foreground");
  const muted = cssColor("--muted-foreground");
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Ground with moving dashes.
  ctx.strokeStyle = muted;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(WIDTH, GROUND_Y);
  ctx.stroke();
  const offset = g.distance % 40;
  for (let x = -offset; x < WIDTH; x += 40) ctx.fillRect(x, GROUND_Y + 8, 12, 1);

  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  // Coffee shop.
  if (g.shopX !== null) {
    ctx.font = "44px serif";
    ctx.fillText("🏪", g.shopX + 30, GROUND_Y + 4);
    ctx.font = "18px serif";
    ctx.fillText("☕", g.shopX + 30, GROUND_Y - 46);
  }

  // Obstacles.
  ctx.font = "22px serif";
  for (const o of g.obstacles) ctx.fillText(o.kind === "bug" ? "🐛" : "🚧", o.x + o.w / 2, GROUND_Y + 3);

  // Runner (flipped to face right), bobbing while running.
  const bob = g.status === "running" && g.y === 0 ? Math.abs(Math.sin(g.t * 18)) * 2 : 0;
  ctx.save();
  ctx.translate(RUNNER_X, GROUND_Y + 3 - g.y - bob);
  ctx.scale(-1, 1);
  ctx.font = `${RUNNER_SIZE}px serif`;
  ctx.fillText("🐈", 0, 0);
  ctx.restore();

  // Score.
  ctx.fillStyle = fg;
  ctx.font = "600 13px ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(`${metres(g)} m`, WIDTH - 10, 10);
}

export default function CoffeeRun({ siteReady, onEnter }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState>(createGame());
  const readyRef = useRef(siteReady);
  const [status, setStatus] = useState(gameRef.current.status);
  const [best, setBest] = useState(loadBestScore);
  const [keepPlaying, setKeepPlaying] = useState(false);

  readyRef.current = siteReady && !keepPlaying;

  const doJump = () => {
    gameRef.current = jump(gameRef.current);
    setStatus(gameRef.current.status);
  };

  // Keyboard: Space / ↑ to jump (only while the game is on screen).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.code !== "ArrowUp") return;
      const el = canvasRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      doJump();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Game loop: runs only while mounted and the tab is visible (rAF pauses when hidden).
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const prev = gameRef.current;
      const next = step(prev, dt, readyRef.current);
      gameRef.current = next;
      if (next.status !== prev.status) {
        setStatus(next.status);
        if (next.status === "crashed" || next.status === "arrived") {
          const score = metres(next);
          setBest((b) => {
            if (score > b) saveBestScore(score);
            return Math.max(b, score);
          });
        }
      }
      draw(ctx, next);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Site is ready but the player never started (or crashed): just offer to go in.
  const showReadyPrompt = siteReady && !keepPlaying && status !== "running";

  return (
    <div className="mb-4 rounded-xl border border-border p-3">
      <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{siteReady ? "The site is ready!" : "Waking up the server… run to the coffee shop ☕"}</span>
        <span className="font-mono">best {best} m</span>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          onPointerDown={doJump}
          aria-label="Coffee Run mini game. Press space or tap to jump."
          className="block aspect-[3/1] w-full max-h-[160px] cursor-pointer touch-manipulation select-none"
        />
        {showReadyPrompt ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 text-center">
            <p className="text-sm font-medium">
              {status === "arrived" ? `You made it — ${metres(gameRef.current)} m! ` : ""}Website is ready. Shall we go in?
            </p>
            <div className="flex gap-2">
              <button
                onClick={onEnter}
                autoFocus
                className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background"
              >
                Go in
              </button>
              <button
                onClick={() => {
                  setKeepPlaying(true);
                  doJump();
                }}
                className="rounded-full border border-border px-4 py-1.5 text-xs font-medium hover:bg-muted"
              >
                Keep playing
              </button>
            </div>
          </div>
        ) : (
          status !== "running" && (
            <button
              onClick={doJump}
              className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground"
            >
              {status === "crashed"
                ? `Oops! ${metres(gameRef.current)} m — tap or press space to try again`
                : status === "arrived"
                  ? "☕ Coffee break! Tap or press space to run again"
                  : "Tap or press space to jump"}
            </button>
          )
        )}
      </div>
    </div>
  );
}
