import { describe, expect, it } from "vitest";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";
import { cardPicture } from "../src/domain/card";
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
      "cara",
      "body",
      "pelo",
      "tamanos",
      "rutina",
      "clothes",
      "house",
      "familia",
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
    // The root README's Features section states these totals ("41 decks /
    // 480 words … 42 decks / 492 words total"). This test turns silent README
    // drift into a red build: when content changes, recount, update the
    // README bullet, then these numbers — in the same change.
    const decks = await repo.listDecks();
    const publicDecks = decks.filter((d) => !d.secret);
    expect(decks).toHaveLength(42);
    expect(decks.flatMap((d) => d.cards)).toHaveLength(492);
    expect(publicDecks).toHaveLength(41);
    expect(publicDecks.flatMap((d) => d.cards)).toHaveLength(480);
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

  it("phrases the description shelf natively (a person is 'quién', not 'dónde')", async () => {
    const decks = await repo.listDecks();
    const pelo = decks.find((d) => d.id === "pelo")!;
    const tamanos = decks.find((d) => d.id === "tamanos")!;

    // How-you-look adjectives take ser, so the sí-o-no claim reads bare
    // ("¿Es rubio?") — never "¿Está rubio?", which would mean dyed hair.
    for (const card of [...pelo.cards, ...tamanos.cards]) {
      expect(card.usesEstar, card.id).toBeUndefined();
    }

    // …but the scene hunt's bare-word fallback ("¿Dónde está el gordo?")
    // turns a description into a nickname. Every adjective card overrides it
    // to the question you'd actually ask about a person.
    const adjectives = [
      ...pelo.cards.filter((c) => !c.spanish.startsWith("la ") && !c.spanish.startsWith("el ")),
      ...tamanos.cards,
    ];
    for (const card of adjectives) {
      expect(siNoQuestion(card), card.id).toBe(`¿Es ${card.spanish}?`);
      expect(sceneQuestion(card), card.id).toBe(`¿Quién es ${card.spanish}?`);
    }

    // Skin tone is a noun phrase, and "¿Es una piel clara?" is not Spanish.
    const skin = pelo.cards.filter((c) => c.id.startsWith("piel-"));
    expect(skin).toHaveLength(3);
    for (const card of skin) {
      expect(siNoQuestion(card), card.id).toBe(`¿Es ${card.spanish}?`);
      expect(sceneQuestion(card), card.id).toBe(`¿Dónde está ${card.spanish}?`);
    }
  });

  it("teaches La familia in gender pairs, and asks for a person by dónde", async () => {
    const familia = (await repo.listDecks()).find((d) => d.id === "familia")!;

    // The point of the deck beyond the words: -o/-a is the same person in a
    // different gender. Each pair sits adjacent so a kid meets them together.
    const pairs: readonly (readonly [string, string])[] = [
      ["hermano", "hermana"],
      ["abuelo", "abuela"],
      ["tio", "tia"],
    ];
    const ids = familia.cards.map((c) => c.id);
    for (const [masculine, feminine] of pairs) {
      expect(ids.indexOf(feminine), feminine).toBe(ids.indexOf(masculine) + 1);
      const el = familia.cards[ids.indexOf(masculine)]!;
      const la = familia.cards[ids.indexOf(feminine)]!;
      expect(el.spanish.startsWith("el "), el.id).toBe(true);
      expect(la.spanish.startsWith("la "), la.id).toBe(true);
      // Same stem, opposite ending — that's what makes it a pair.
      expect(la.spanish.slice(3, -1)).toBe(el.spanish.slice(3, -1));
    }

    for (const card of familia.cards) {
      // A relative is a countable person, so the built questions already read
      // native ("¿Es una abuela?", "¿Dónde está la abuela?"). Unlike the
      // ¿Cómo soy? adjectives, no card here needs an override — a family
      // member is somewhere in the scene, not a description of somebody.
      expect(card.question, card.id).toBeUndefined();
      expect(card.sceneQuestion, card.id).toBeUndefined();
      expect(card.usesEstar, card.id).toBeUndefined();
      expect(siNoQuestion(card), card.id).toMatch(/^¿Es un[a]? \S/);
      expect(sceneQuestion(card), card.id).toMatch(/^¿Dónde está (el|la) \S/);
    }
  });

  it("plays Mi día as actions, not things — the first game-enabled verb deck", async () => {
    const rutina = (await repo.listDecks()).find((d) => d.id === "rutina")!;

    // The verbs shelf is learnOnly because "¿Es un desayunar?" is nonsense.
    // This deck answers the same games by overriding both built questions,
    // so it must NOT inherit that flag — losing the games is the whole cost
    // the overrides exist to avoid.
    expect(rutina.learnOnly).toBeUndefined();

    for (const card of rutina.cards) {
      // A picture of someone mid-action: the claim is progressive, and a
      // reflexive verb keeps its pronoun ("¿Se está peinando?").
      expect(siNoQuestion(card), card.id).toMatch(/^¿(Se está|Está) \S+(ndo)\b/);
      expect(sceneQuestion(card), card.id).toMatch(/^¿Quién /);
    }

    // Reflexives are the point of the deck: the infinitive ends in -se, and
    // both questions must carry the pronoun, never drop it.
    const reflexive = rutina.cards.filter((c) => /(^|\s)\S+se($|\s)/.test(c.spanish));
    expect(reflexive.length).toBeGreaterThanOrEqual(6);
    for (const card of reflexive) {
      expect(siNoQuestion(card), card.id).toMatch(/^¿Se está /);
      expect(sceneQuestion(card), card.id).toMatch(/^¿Quién se está /);
    }
  });

  it("keeps decks kid-sized: 10-17 cards each", async () => {
    // Raised from 15 to 17 for El cuerpo (2026-08-12). The cap is about
    // pacing, not structure: every game caps its own rounds independently, so
    // the only things that feel deck length are Las tarjetas (walks every card
    // before the ¡Muy bien! payoff) and Conecta (one board per 5 cards). Two
    // extra cards cost one longer flashcard sitting on one deck — accepted,
    // because the alternative was leaving body parts out that have a picture.
    const decks = await repo.listDecks();
    for (const deck of decks) {
      expect(deck.cards.length).toBeGreaterThanOrEqual(10);
      expect(deck.cards.length).toBeLessThanOrEqual(17);
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

  it("never repeats a picture within a deck (quiz choices are picture-only)", async () => {
    const decks = await repo.listDecks();
    for (const deck of decks) {
      const pictures = deck.cards.map(cardPicture);
      expect(new Set(pictures).size, deck.id).toBe(pictures.length);
    }
  });

  it("gives every drawn card its own art key (a key is never shared)", async () => {
    // A reused key would silently draw one word's picture for another.
    const drawn = (await repo.listDecks())
      .flatMap((d) => d.cards)
      .filter((c) => c.image !== undefined);
    expect(drawn.length).toBeGreaterThan(0);
    for (const card of drawn) {
      expect(card.image, card.id).not.toBe("");
      // The fallback stays required even when it never renders (ADR 009).
      expect(card.emoji, card.id).not.toBe("");
    }
    const keys = drawn.map((c) => c.image);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("draws the words emoji cannot show, and only those", async () => {
    const decks = await repo.listDecks();
    const drawn = decks.flatMap((d) => d.cards).filter((c) => c.image !== undefined);
    expect(drawn.map((c) => c.id).sort()).toEqual([
      "barriga",
      "cabeza",
      "cejas",
      "codo",
      "cuello",
      "espalda",
      "hombro",
      "labios",
      "mejillas",
      "pelo-cara",
      "pestanas",
      "rodilla",
    ]);
  });

  it("splits the face from the body, keeping every card id (progress survives)", async () => {
    const cara = await repo.getDeck("cara");
    const body = await repo.getDeck("body");
    expect(cara?.cards.map((c) => c.id)).toEqual([
      "cabeza", "pelo-cara", "cejas", "pestanas", "ojos", "nariz", "mejillas",
      "boca", "labios", "diente", "lengua", "oreja", "cuello",
    ]);
    expect(body?.cards.map((c) => c.id)).toEqual([
      "hombro", "brazo", "codo", "mano", "dedo", "unas", "barriga", "espalda",
      "pierna", "rodilla", "pie", "corazon", "cerebro", "pulmones", "sangre",
    ]);
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
