import { describe, expect, it } from "vitest";
import { RUNNER_X, createGame, jump, metres, startGame, step, type GameState } from "@/lib/coffeeGame";

const run = (g: GameState, seconds: number, ready = false) => {
  for (let t = 0; t < seconds; t += 1 / 60) g = step(g, 1 / 60, ready, () => 0.5);
  return g;
};

describe("coffee run", () => {
  it("waits for the first jump to start", () => {
    expect(step(createGame(), 0.1, false).status).toBe("ready");
    expect(jump(createGame()).status).toBe("running");
  });

  it("moves forward and counts metres", () => {
    const g = step(startGame(), 0.05, false);
    expect(g.distance).toBeGreaterThan(0);
    expect(metres(run(startGame(), 1))).toBeGreaterThan(20);
  });

  it("jumps and lands back on the ground", () => {
    const up = step(jump(startGame()), 0.05, false);
    expect(up.y).toBeGreaterThan(0);
    expect(run(up, 1).y).toBe(0);
  });

  it("crashes into an obstacle on the ground", () => {
    const g: GameState = {
      ...startGame(),
      obstacles: [{ id: 1, x: RUNNER_X - 5, w: 20, h: 18, kind: "bug" }],
    };
    expect(step(g, 0.01, false).status).toBe("crashed");
  });

  it("clears an obstacle while in the air", () => {
    const g: GameState = {
      ...startGame(),
      y: 60,
      obstacles: [{ id: 1, x: RUNNER_X - 5, w: 20, h: 18, kind: "bug" }],
    };
    expect(step(g, 0.01, false).status).toBe("running");
  });

  it("shows the coffee shop once the site is ready, and arrives there", () => {
    const g = step(startGame(), 0.01, true);
    expect(g.shopX).not.toBeNull();
    expect(run(g, 5, true).status).toBe("arrived");
  });

  it("starts a new run after arriving (keep playing)", () => {
    const arrived: GameState = { ...startGame(), status: "arrived", shopX: RUNNER_X, distance: 500 };
    const again = jump(arrived);
    expect(again.status).toBe("running");
    expect(again.shopX).toBeNull();
  });

  it("restarts after a crash", () => {
    const crashed: GameState = { ...startGame(), status: "crashed", distance: 999 };
    const again = jump(crashed);
    expect(again.status).toBe("running");
    expect(again.distance).toBe(0);
  });
});
