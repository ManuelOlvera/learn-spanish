import { describe, expect, it } from "vitest";
import {
  buyAccessory,
  ownsAccessory,
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
