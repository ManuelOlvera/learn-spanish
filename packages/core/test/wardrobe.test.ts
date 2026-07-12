import { describe, expect, it } from "vitest";
import {
  accessoryPlacement,
  buyAccessory,
  ownsAccessory,
  placeAccessory,
  toggleWorn,
  wear,
  wornAccessories,
} from "../src/domain/wardrobe";
import type { PetState } from "../src/domain/mascota";

const egg: PetState = { meals: 0, lastFed: null };

describe("wardrobe ownership (kid-level)", () => {
  it("buying adds to the owned set, once", () => {
    const owned = buyAccessory([], "gorro");
    expect(owned).toEqual(["gorro"]);
    expect(buyAccessory(owned, "gorro")).toBe(owned); // idempotent
    expect(ownsAccessory(owned, "gorro")).toBe(true);
    expect(ownsAccessory(owned, "corona")).toBe(false);
  });
});

describe("wardrobe wearing (per-pet)", () => {
  it("a fresh pet wears nothing until dressed", () => {
    expect(wornAccessories(egg)).toEqual([]);
  });

  it("wear puts an item on, idempotently", () => {
    const dressed = wear(egg, "gorro");
    expect(wornAccessories(dressed)).toEqual(["gorro"]);
    expect(wear(dressed, "gorro")).toBe(dressed);
  });

  it("toggle takes an item off then puts it back", () => {
    const on = wear(egg, "gorro");
    const off = toggleWorn(on, "gorro");
    expect(wornAccessories(off)).toEqual([]);
    expect(wornAccessories(toggleWorn(off, "gorro"))).toEqual(["gorro"]);
  });

  it("two pets keep independent outfits from one owned crown", () => {
    const cat = wear({ meals: 3, lastFed: null }, "corona");
    const dog = { meals: 3, lastFed: null }; // owns the crown too, but bare
    expect(wornAccessories(cat)).toEqual(["corona"]);
    expect(wornAccessories(dog)).toEqual([]);
  });

  it("a legacy pet's per-pet accessories are what it wears until toggled", () => {
    const legacy: PetState = { meals: 5, lastFed: null, accessories: ["gorro", "gafas"] };
    expect(wornAccessories(legacy)).toEqual(["gorro", "gafas"]);
    const off = toggleWorn(legacy, "gorro");
    expect(wornAccessories(off)).toEqual(["gafas"]);
  });
});

describe("wardrobe placement (per-pet drag spots)", () => {
  it("has no saved spot until the kid drags it", () => {
    expect(accessoryPlacement(egg, "gorro")).toBeNull();
  });

  it("placing saves clamped percent coords and overwrites only that item", () => {
    const one = placeAccessory(egg, "gorro", 20, 30);
    expect(accessoryPlacement(one, "gorro")).toEqual({ x: 20, y: 30 });

    const two = placeAccessory(one, "corona", 60, 10);
    expect(accessoryPlacement(two, "gorro")).toEqual({ x: 20, y: 30 }); // untouched
    expect(accessoryPlacement(two, "corona")).toEqual({ x: 60, y: 10 });

    const moved = placeAccessory(two, "gorro", 80, 90);
    expect(accessoryPlacement(moved, "gorro")).toEqual({ x: 80, y: 90 });
  });

  it("clamps out-of-box drags to the 0–100 edges", () => {
    const p = placeAccessory(egg, "gorro", -25, 140);
    expect(accessoryPlacement(p, "gorro")).toEqual({ x: 0, y: 100 });
  });

  it("ignores a non-finite drag instead of corrupting the outfit", () => {
    const p = placeAccessory(egg, "gorro", Number.NaN, 50);
    expect(p).toBe(egg);
    expect(accessoryPlacement(p, "gorro")).toBeNull();
  });

  it("does not disturb what the pet is wearing", () => {
    const dressed = wear(egg, "gorro");
    const placed = placeAccessory(dressed, "gorro", 40, 40);
    expect(wornAccessories(placed)).toEqual(["gorro"]);
  });
});
