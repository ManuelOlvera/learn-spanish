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

const pet: PetState = { meals: 0, lastFed: null };

/** El pollito's own shapes: 🥚 at form 0, 🐔 at form 3. A hat that sits on the
 *  hen's head hangs in mid-air over the egg — which is why outfits are per form. */
const EGG = 0;
const HEN = 3;

describe("wardrobe ownership (kid-level)", () => {
  it("buying adds to the owned set, once", () => {
    const owned = buyAccessory([], "gorro");
    expect(owned).toEqual(["gorro"]);
    expect(buyAccessory(owned, "gorro")).toBe(owned); // idempotent
    expect(ownsAccessory(owned, "gorro")).toBe(true);
    expect(ownsAccessory(owned, "corona")).toBe(false);
  });
});

describe("wardrobe wearing (per form)", () => {
  it("a fresh pet wears nothing on any form", () => {
    expect(wornAccessories(pet, EGG)).toEqual([]);
    expect(wornAccessories(pet, HEN)).toEqual([]);
  });

  it("wear puts an item on that form, idempotently", () => {
    const dressed = wear(pet, HEN, "gorro");
    expect(wornAccessories(dressed, HEN)).toEqual(["gorro"]);
    expect(wear(dressed, HEN, "gorro")).toBe(dressed);
  });

  it("dressing the grown form leaves the egg bare", () => {
    const dressed = wear(pet, HEN, "gorro");
    expect(wornAccessories(dressed, EGG)).toEqual([]);
  });

  it("each form keeps its own outfit", () => {
    const both = wear(wear(pet, HEN, "corona"), EGG, "lazo");
    expect(wornAccessories(both, HEN)).toEqual(["corona"]);
    expect(wornAccessories(both, EGG)).toEqual(["lazo"]);
  });

  it("toggle takes an item off that form then puts it back", () => {
    const on = wear(pet, HEN, "gorro");
    const off = toggleWorn(on, HEN, "gorro");
    expect(wornAccessories(off, HEN)).toEqual([]);
    expect(wornAccessories(toggleWorn(off, HEN, "gorro"), HEN)).toEqual(["gorro"]);
  });

  it("toggling one form never undresses another", () => {
    const both = wear(wear(pet, HEN, "gorro"), EGG, "gorro");
    const off = toggleWorn(both, EGG, "gorro");
    expect(wornAccessories(off, EGG)).toEqual([]);
    expect(wornAccessories(off, HEN)).toEqual(["gorro"]);
  });

  it("two pets keep independent outfits from one owned crown", () => {
    const cat = wear({ meals: 3, lastFed: null }, HEN, "corona");
    const dog = { meals: 3, lastFed: null }; // owns the crown too, but bare
    expect(wornAccessories(cat, HEN)).toEqual(["corona"]);
    expect(wornAccessories(dog, HEN)).toEqual([]);
  });

  it("ignores legacy per-pet outfits — the storage migration lifts those onto a form", () => {
    const legacy: PetState = {
      meals: 5,
      lastFed: null,
      worn: ["gorro"],
      accessories: ["gafas"],
    };
    expect(wornAccessories(legacy, EGG)).toEqual([]);
    expect(wornAccessories(legacy, HEN)).toEqual([]);
  });

  it("treats a nonsense form as its nearest real one instead of storing junk", () => {
    const dressed = wear(pet, -3.7, "gorro");
    expect(wornAccessories(dressed, 0)).toEqual(["gorro"]);
  });
});

describe("wardrobe placement (per-form drag spots)", () => {
  it("has no saved spot until the kid drags it", () => {
    expect(accessoryPlacement(pet, HEN, "gorro")).toBeNull();
  });

  it("placing saves clamped percent coords and overwrites only that item", () => {
    const one = placeAccessory(pet, HEN, "gorro", 20, 30);
    expect(accessoryPlacement(one, HEN, "gorro")).toEqual({ x: 20, y: 30 });

    const two = placeAccessory(one, HEN, "corona", 60, 10);
    expect(accessoryPlacement(two, HEN, "gorro")).toEqual({ x: 20, y: 30 }); // untouched
    expect(accessoryPlacement(two, HEN, "corona")).toEqual({ x: 60, y: 10 });

    const moved = placeAccessory(two, HEN, "gorro", 80, 90);
    expect(accessoryPlacement(moved, HEN, "gorro")).toEqual({ x: 80, y: 90 });
  });

  it("the same accessory sits at its own spot on each form", () => {
    const hen = placeAccessory(pet, HEN, "gorro", 50, 8);
    const both = placeAccessory(hen, EGG, "gorro", 50, 20);
    expect(accessoryPlacement(both, HEN, "gorro")).toEqual({ x: 50, y: 8 });
    expect(accessoryPlacement(both, EGG, "gorro")).toEqual({ x: 50, y: 20 });
  });

  it("a form the kid never dragged on falls back to the default spot", () => {
    const hen = placeAccessory(pet, HEN, "gorro", 50, 8);
    expect(accessoryPlacement(hen, EGG, "gorro")).toBeNull();
  });

  it("clamps out-of-box drags to the 0–100 edges", () => {
    const p = placeAccessory(pet, HEN, "gorro", -25, 140);
    expect(accessoryPlacement(p, HEN, "gorro")).toEqual({ x: 0, y: 100 });
  });

  it("ignores a non-finite drag instead of corrupting the outfit", () => {
    const p = placeAccessory(pet, HEN, "gorro", Number.NaN, 50);
    expect(p).toBe(pet);
    expect(accessoryPlacement(p, HEN, "gorro")).toBeNull();
  });

  it("does not disturb what the form is wearing", () => {
    const dressed = wear(pet, HEN, "gorro");
    const placed = placeAccessory(dressed, HEN, "gorro", 40, 40);
    expect(wornAccessories(placed, HEN)).toEqual(["gorro"]);
  });
});
