import { describe, expect, it } from "vitest";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";
import { siNoQuestion } from "../src/domain/si-no";
import { sceneQuestion } from "../src/domain/scene";

const repo = new StaticDeckRepository();

describe("starter pack content", () => {
  it("ships the expected categories", async () => {
    const decks = await repo.listDecks();
    expect(decks.map((d) => d.id)).toEqual([
      "animals",
      "colors",
      "numbers",
      "numbers-11-20",
      "numbers-tens",
      "centenas",
      "food",
      "body",
      "clothes",
      "house",
      "vehicles",
      "weather",
      "school",
      "feelings",
      "nature",
      "toys",
      "sports",
      "bugs",
      "zoo",
      "jobs",
      "city",
      "sea",
      "fruit",
      "music",
      "aves",
      "verbs-infinitive",
      "verbs-gerund",
      "verbs-imperative",
      "vocales",
      "letras-b-m",
      "letras-n-z",
      "dias-semana",
      "meses",
      "la-hora",
      "dia-noche",
      "estaciones",
      "mystery",
    ]);
  });

  it("matches the README's advertised pack size (update both together)", async () => {
    // The root README's Features section states these totals ("36 decks /
    // 420 words … 37 decks / 432 words total"). This test turns silent README
    // drift into a red build: when content changes, recount, update the
    // README bullet, then these numbers — in the same change.
    const decks = await repo.listDecks();
    const publicDecks = decks.filter((d) => !d.secret);
    expect(decks).toHaveLength(37);
    expect(decks.flatMap((d) => d.cards)).toHaveLength(432);
    expect(publicDecks).toHaveLength(36);
    expect(publicDecks.flatMap((d) => d.cards)).toHaveLength(420);
  });

  it("ships the whole alphabet as a game-enabled letters shelf", async () => {
    const decks = await repo.listDecks();
    const letterDecks = ["vocales", "letras-b-m", "letras-n-z"].map((id) =>
      decks.find((d) => d.id === id),
    );
    for (const deck of letterDecks) {
      expect(deck, "letter deck must exist").toBeDefined();
      // Letters play the games: quiz/reto/duel speak the bare name, scene
      // gets "¿Dónde está la …?" from the article, sí-o-no from overrides.
      expect(deck!.learnOnly).toBeUndefined();
    }
    // Every letter of the Spanish alphabet (ñ included) appears exactly once
    // across the three decks — the card face shows both cases ("Bb").
    const glyphs = letterDecks.flatMap((d) => d!.cards.map((c) => c.emoji));
    const alphabet = [..."ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"];
    for (const letter of alphabet) {
      expect(
        glyphs.some((g) => g.startsWith(letter)),
        `missing ${letter}`,
      ).toBe(true);
    }
    expect(new Set(glyphs).size).toBe(glyphs.length);
    // Las vocales: the five vowels plus their accented forms — ten cards.
    const vocales = letterDecks[0]!;
    expect(vocales.cards.map((c) => c.emoji)).toEqual([
      "Aa", "Ee", "Ii", "Oo", "Uu", "Áá", "Éé", "Íí", "Óó", "Úú",
    ]);
  });

  it("phrases letter questions natively (letters are feminine unique entities)", async () => {
    const decks = await repo.listDecks();
    const letterCards = ["vocales", "letras-b-m", "letras-n-z"].flatMap(
      (id) => decks.find((d) => d.id === id)!.cards,
    );
    for (const card of letterCards) {
      // A letter's NAME is bare ("be") — the kids found "la be" confusing.
      // The article lives in `article` (letters are feminine), so games can
      // still build a native phrase: "¿Es la be?", never "¿Es una be?".
      expect(card.spanish.startsWith("la "), card.id).toBe(false);
      expect(card.article, card.id).toBe("la");
      expect(card.question, card.id).toBe(`¿Es la ${card.spanish}?`);
    }
    // Accented vowels must SOUND distinct from their plain twins, or a
    // listen-mode quiz dealing both is unanswerable by ear.
    const acute = letterCards.find((c) => c.id === "letra-a-tilde")!;
    expect(acute.spanish).toBe("a con tilde");
  });

  it("ships the calendar in order: seven days, twelve months, twelve hours", async () => {
    const dias = await repo.getDeck("dias-semana");
    // Calendar order, not shuffled — the deck is how a kid learns the week.
    expect(dias?.cards.slice(0, 7).map((c) => c.spanish)).toEqual([
      "lunes",
      "martes",
      "miércoles",
      "jueves",
      "viernes",
      "sábado",
      "domingo",
    ]);
    // The face is the abbreviation a Spanish calendar prints, so a day is
    // findable on a real one; the spoken name stays bare.
    expect(dias?.cards.slice(0, 7).map((c) => c.emoji)).toEqual([
      "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom",
    ]);
    const meses = await repo.getDeck("meses");
    expect(meses?.cards.map((c) => c.spanish)).toEqual([
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ]);
    const hora = await repo.getDeck("la-hora");
    expect(hora?.cards).toHaveLength(12);
    expect(hora?.cards[0]?.spanish).toBe("la una");
  });

  it("phrases calendar questions natively (no article on a month, no 'un lunes')", async () => {
    const decks = await repo.listDecks();
    const dayCards = decks
      .find((d) => d.id === "dias-semana")!
      .cards.slice(0, 7);
    for (const card of dayCards) {
      // "el lunes" means "on Monday" — the NAME of the day is bare. The
      // article lives in `article` so the scene hunt still reads native.
      expect(card.spanish.startsWith("el "), card.id).toBe(false);
      expect(card.article, card.id).toBe("el");
      expect(siNoQuestion(card)).toBe(`¿Es ${card.spanish}?`);
      expect(sceneQuestion(card)).toBe(`¿Dónde está el ${card.spanish}?`);
    }
    for (const card of decks.find((d) => d.id === "meses")!.cards) {
      // A month takes no article at all: never "el enero", in any game.
      expect(card.article, card.id).toBeUndefined();
      expect(siNoQuestion(card)).toBe(`¿Es ${card.spanish}?`);
      expect(sceneQuestion(card)).toBe(`¿Dónde está ${card.spanish}?`);
    }
    // Telling the time: one o'clock is singular, every other hour plural.
    const hours = decks.find((d) => d.id === "la-hora")!.cards;
    expect(siNoQuestion(hours[0]!)).toBe("¿Es la una?");
    for (const card of hours.slice(1)) {
      expect(siNoQuestion(card), card.id).toBe(`¿Son ${card.spanish}?`);
    }
  });

  it("keeps decks kid-sized: 10-15 cards each", async () => {
    const decks = await repo.listDecks();
    for (const deck of decks) {
      expect(deck.cards.length).toBeGreaterThanOrEqual(10);
      expect(deck.cards.length).toBeLessThanOrEqual(15);
    }
  });

  it("counts to 100: 11-20 complete, then every ten up to cien", async () => {
    const teens = await repo.getDeck("numbers-11-20");
    expect(teens?.cards.map((c) => c.spanish)).toEqual([
      "once",
      "doce",
      "trece",
      "catorce",
      "quince",
      "dieciséis",
      "diecisiete",
      "dieciocho",
      "diecinueve",
      "veinte",
    ]);
    const tens = await repo.getDeck("numbers-tens");
    expect(tens?.cards.map((c) => c.spanish)).toEqual([
      "diez",
      "veinte",
      "treinta",
      "cuarenta",
      "cincuenta",
      "sesenta",
      "setenta",
      "ochenta",
      "noventa",
      "cien",
    ]);
  });

  it("gives every card an id, Spanish word, English gloss, and emoji", async () => {
    const decks = await repo.listDecks();
    for (const deck of decks) {
      for (const card of deck.cards) {
        expect(card.id).not.toBe("");
        expect(card.spanish).not.toBe("");
        expect(card.english).not.toBe("");
        // Pre-readers navigate by picture alone — a card without a visual is broken.
        expect(card.emoji).not.toBe("");
      }
    }
  });

  it("never repeats an emoji within a deck (quiz choices are picture-only)", async () => {
    const decks = await repo.listDecks();
    for (const deck of decks) {
      const emoji = deck.cards.map((c) => c.emoji);
      expect(new Set(emoji).size).toBe(emoji.length);
    }
  });

  it("never repeats a card id across the whole pack", async () => {
    const decks = await repo.listDecks();
    const ids = decks.flatMap((d) => d.cards.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ships the verb forms as one learn-only shelf over the same 12 verbs", async () => {
    const forms = ["verbs-infinitive", "verbs-gerund", "verbs-imperative"];
    const decks = await Promise.all(forms.map((id) => repo.getDeck(id)));
    for (const deck of decks) {
      expect(deck, "verb-form deck must exist").not.toBeNull();
      // Learn-only: verbs break the games' noun-shaped "¿Es un…?" question,
      // so they are flashcards-only until verb-native phrasing exists.
      expect(deck!.learnOnly).toBe(true);
      expect(deck!.cards).toHaveLength(15);
    }
    // The three forms teach the same verbs in the same order (same pictures).
    const [inf, ger, imp] = decks;
    expect(ger!.cards.map((c) => c.emoji)).toEqual(inf!.cards.map((c) => c.emoji));
    expect(imp!.cards.map((c) => c.emoji)).toEqual(inf!.cards.map((c) => c.emoji));
  });

  it("keeps learn-only off any deck outside the verbs shelf", async () => {
    const decks = await repo.listDecks();
    for (const deck of decks) {
      if (deck.learnOnly) {
        expect(deck.id.startsWith("verbs-")).toBe(true);
      }
    }
  });

  it("finds a deck by id and returns null for unknown ids", async () => {
    await expect(repo.getDeck("animals")).resolves.toMatchObject({
      id: "animals",
    });
    await expect(repo.getDeck("nope")).resolves.toBeNull();
  });
});
