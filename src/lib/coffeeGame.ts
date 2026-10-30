/**
 * "Coffee Run" — a tiny endless runner shown while the server wakes up.
 * Jump over bugs on the way to the coffee shop. When the site is ready the
 * shop appears; reaching it ends the run and the app offers to go in.
 *
 * Pure game logic (no DOM) so it can be unit-tested; the canvas component
 * only feeds it input and draws the state.
 */

/** Logical playfield size; the canvas scales it to fit. */
export const WIDTH = 600;
export const HEIGHT = 200;
export const GROUND_Y = 168; // y of the ground line
export const RUNNER_X = 70;
export const RUNNER_SIZE = 30;

const GRAVITY = 2100; // px/s²
const JUMP_VELOCITY = 640; // px/s
const START_SPEED = 260; // px/s
const MAX_SPEED = 560;
const SPEED_UP = 6; // px/s gained per second

export type ObstacleKind = "bug" | "cone";
export type Obstacle = { id: number; x: number; w: number; h: number; kind: ObstacleKind };

export type GameStatus = "ready" | "running" | "crashed" | "arrived";

export type GameState = {
  status: GameStatus;
  /** Height of the runner's feet above the ground (0 = on the ground). */
  y: number;
  vy: number;
  speed: number;
  distance: number; // px travelled, shown as metres (÷ 10)
  obstacles: Obstacle[];
  spawnIn: number; // px until the next obstacle may appear
  nextId: number;
  /** x of the coffee shop once the site is ready; null while still loading. */
  shopX: number | null;
  /** Animation clock for the running legs. */
  t: number;
};

export function createGame(): GameState {
  return {
    status: "ready",
    y: 0,
    vy: 0,
    speed: START_SPEED,
    distance: 0,
    obstacles: [],
    spawnIn: 420,
    nextId: 1,
    shopX: null,
    t: 0,
  };
}

export function startGame(): GameState {
  return { ...createGame(), status: "running" };
}

/** Jump if on the ground; starts a new run when not running (ready, crashed or arrived). */
export function jump(state: GameState): GameState {
  if (state.status !== "running") return { ...startGame(), vy: JUMP_VELOCITY };
  if (state.status !== "running" || state.y > 0) return state;
  return { ...state, vy: JUMP_VELOCITY };
}

export function metres(state: GameState): number {
  return Math.floor(state.distance / 10);
}

function hits(state: GameState, o: Obstacle): boolean {
  const pad = 6; // forgiving hitboxes feel fairer
  const runnerLeft = RUNNER_X - RUNNER_SIZE / 2 + pad;
  const runnerRight = RUNNER_X + RUNNER_SIZE / 2 - pad;
  const overlapX = o.x < runnerRight && o.x + o.w > runnerLeft;
  const overlapY = state.y < o.h - pad / 2;
  return overlapX && overlapY;
}

/**
 * Advance the game by `dt` seconds. Returns a new state; never mutates.
 * `siteReady` makes the coffee shop appear. `rand` is injectable for tests.
 */
export function step(
  state: GameState,
  dt: number,
  siteReady: boolean,
  rand: () => number = Math.random,
): GameState {
  if (state.status !== "running") return state;
  dt = Math.min(dt, 0.05); // avoid huge jumps after a tab switch

  const speed = Math.min(state.speed + SPEED_UP * dt, MAX_SPEED);
  const dx = speed * dt;

  // Runner physics.
  let vy = state.vy - GRAVITY * dt;
  let y = state.y + vy * dt;
  if (y <= 0) {
    y = 0;
    vy = 0;
  }

  // Scroll obstacles; spawn new ones (not once the shop is on its way).
  let { spawnIn, nextId } = state;
  const obstacles = state.obstacles.map((o) => ({ ...o, x: o.x - dx })).filter((o) => o.x + o.w > -10);
  let shopX = state.shopX;
  if (shopX === null && siteReady) shopX = WIDTH + 40;

  spawnIn -= dx;
  if (spawnIn <= 0 && shopX === null) {
    const kind: ObstacleKind = rand() < 0.7 ? "bug" : "cone";
    obstacles.push({
      id: nextId++,
      x: WIDTH + 10,
      w: kind === "bug" ? 22 : 18,
      h: kind === "bug" ? 18 : 26,
      kind,
    });
    // Gaps shrink a little as it speeds up, but always leave room to land.
    spawnIn = 240 + rand() * 260 + (speed - START_SPEED) * 0.4;
  }

  if (shopX !== null) shopX -= dx;

  const next: GameState = {
    ...state,
    y,
    vy,
    speed,
    distance: state.distance + dx,
    obstacles,
    spawnIn,
    nextId,
    shopX,
    t: state.t + dt,
  };

  if (obstacles.some((o) => hits(next, o))) return { ...next, status: "crashed" };
  if (shopX !== null && shopX <= RUNNER_X) return { ...next, status: "arrived", shopX: RUNNER_X };
  return next;
}

export const BEST_SCORE_KEY = "dailyd_game_best";

export function loadBestScore(): number {
  try {
    const n = Number(localStorage.getItem(BEST_SCORE_KEY));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function saveBestScore(score: number): void {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // ignore
  }
}
