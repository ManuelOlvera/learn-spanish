import { describe, expect, it } from "vitest";
import {
  buyAccessory,
  toggleAccessory,
  wornAccessories,
} from "../src/domain/wardrobe";
import type { PetState } from "../src/domain/mascota";

const egg: PetState = { meals: 0, lastFed: null };

describe("wardrobe", () => {
  it("buying an accessory owns and auto-wears it", () => {
    const dressed = buyAccessory(egg, "gorro");
    expect(dressed.accessories).toEqual(["gorro"]);
    expect(wornAccessories(dressed)).toEqual(["gorro"]);
  });

  it("buying twice is a no-op", () => {
    const once = buyAccessory(egg, "gorro");
    expect(buyAccessory(once, "gorro")).toBe(once);
  });

  it("a pet with no worn field shows every owned accessory (back-compat)", () => {
    const legacy: PetState = { meals: 5, lastFed: null, accessories: ["gorro", "gafas"] };
    expect(wornAccessories(legacy)).toEqual(["gorro", "gafas"]);
  });

  it("toggling an owned accessory takes it off, then puts it back on", () => {
    const dressed = buyAccessory(egg, "gorro");
    const bare = toggleAccessory(dressed, "gorro");
    expect(wornAccessories(bare)).toEqual([]);
    expect(bare.accessories).toEqual(["gorro"]); // still owned
    const redressed = toggleAccessory(bare, "gorro");
    expect(wornAccessories(redressed)).toEqual(["gorro"]);
  });

  it("cannot wear an accessory it does not own", () => {
    expect(toggleAccessory(egg, "corona")).toBe(egg);
  });

  it("taking one off from a legacy pet keeps the rest worn", () => {
    const legacy: PetState = { meals: 5, lastFed: null, accessories: ["gorro", "gafas"] };
    const off = toggleAccessory(legacy, "gorro");
    expect(wornAccessories(off)).toEqual(["gafas"]);
  });
});
