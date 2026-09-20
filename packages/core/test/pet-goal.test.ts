import { describe, expect, it } from "vitest";
import {
  defaultCollection,
  nextPetGoal,
  PET_SPECIES,
  STARTER_SPECIES,
} from "../src/domain/mascota";
import type { PetCollection } from "../src/domain/mascota";

function owning(...ids: readonly string[]): PetCollection {
  const base = defaultCollection();
  return { ...base, owned: [STARTER_SPECIES, ...ids] };
}

const CONEJO = PET_SPECIES.find((s) => s.id === "conejo")!;
const GATO = PET_SPECIES.find((s) => s.id === "gato")!;
const PERRO = PET_SPECIES.find((s) => s.id === "perro")!;

describe("the next mascota to save for", () => {
  it("points at the cheapest pet the kid does not own", () => {
    expect(nextPetGoal(defaultCollection(), 0)?.species.id).toBe("conejo");
  });

  it("moves to the next rung once one is bought", () => {
    expect(nextPetGoal(owning("conejo"), 0)?.species.id).toBe("gato");
    expect(nextPetGoal(owning("conejo", "gato"), 0)?.species.id).toBe("perro");
  });

  it("skips a gap rather than pointing at something already owned", () => {
    // Pets are bought from a shop, not in order — a kid who saved for the
    // dragon first must still be pointed at el conejo.
    expect(nextPetGoal(owning("dragon"), 0)?.species.id).toBe("conejo");
  });

  it("never points at the free starter", () => {
    expect(nextPetGoal(defaultCollection(), 0)?.species.cost).toBeGreaterThan(0);
  });

  it("has nothing to say once every pet is owned", () => {
    const all = { ...defaultCollection(), owned: PET_SPECIES.map((s) => s.id) };
    expect(nextPetGoal(all, 9999)).toBeNull();
  });

  it("reports what is still missing", () => {
    const goal = nextPetGoal(defaultCollection(), 74)!;
    expect(goal.species.id).toBe("conejo");
    expect(goal.remaining).toBe(CONEJO.cost - 74);
  });

  it("reports progress as a fraction of the way there", () => {
    const goal = nextPetGoal(defaultCollection(), 25)!;
    expect(goal.progress).toBeCloseTo(25 / CONEJO.cost);
  });

  it("clamps progress at full once the kid can afford it", () => {
    // Affordable but unbought is a real state: the shop needs a tap. The bar
    // must read "done", never overflow.
    const goal = nextPetGoal(defaultCollection(), CONEJO.cost + 500)!;
    expect(goal.progress).toBe(1);
    expect(goal.remaining).toBe(0);
  });

  it("never reports a negative remainder", () => {
    for (const balance of [0, 1, 99, 100, 101, 10_000]) {
      expect(nextPetGoal(defaultCollection(), balance)!.remaining).toBeGreaterThanOrEqual(0);
    }
  });

  it("treats a zero balance as no progress, not as a divide-by-zero", () => {
    const goal = nextPetGoal(defaultCollection(), 0)!;
    expect(goal.progress).toBe(0);
    expect(goal.remaining).toBe(CONEJO.cost);
  });

  it("measures against the target's own cost, not the ladder's first rung", () => {
    const goal = nextPetGoal(owning("conejo", "gato"), 110)!;
    expect(goal.species.id).toBe("perro");
    expect(goal.remaining).toBe(PERRO.cost - 110);
    expect(goal.progress).toBeCloseTo(110 / PERRO.cost);
  });

  it("keeps the cheap rungs within a few good games (ADR 020's pace)", () => {
    // The invariant ADR 020 pinned is about *reach*, and this bar is the
    // surface that promises it: if a rung ever stops being a few games away,
    // the promise this feature makes is the thing that breaks.
    expect(GATO.cost - CONEJO.cost).toBeLessThanOrEqual(100);
  });
});
