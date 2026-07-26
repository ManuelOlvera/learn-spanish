import type { Story } from "../domain/story";

/**
 * The built-in stories. Every cast id is a card from STARTER_PACK, so a kid
 * meets only words the app has already taught them — the story is the first
 * place those words act on each other.
 *
 * House style, learned from reading these aloud to a four-year-old:
 *  - one sentence per page, one breath long (speech synthesis reads long
 *    clauses flatly, and a pre-reader loses the thread);
 *  - a shape, not a list: somebody wants something, it goes wrong, it turns,
 *    it ends warm;
 *  - sound words (¡Plof! ¡Pum! Plic, plac) — the biggest laugh per character
 *    in the whole file;
 *  - a repeated beat ("Sube y sube") because small kids join in on repeats;
 *  - present tense throughout, and nobody is ever shamed. The elephant who
 *    shakes the floor gets a drummer, not a scolding.
 */
export const STORY_PACK: readonly Story[] = [
  {
    id: "gato-pez",
    titleSpanish: "El gato y el pez",
    titleEnglish: "The cat and the fish",
    emoji: "🐱",
    cast: ["gato", "pez", "leche", "agua", "mariposa", "sol"],
    pages: [
      {
        text: "El gato tiene hambre. ¡Mira, un pez!",
        english: "The cat is hungry. Look, a fish!",
        scene: { hero: "🐱", props: ["🐟", "☀️"] },
      },
      {
        text: "El gato salta al agua. ¡Plof!",
        english: "The cat jumps into the water. Splash!",
        scene: { hero: "🐱", props: ["💦", "🐟"] },
      },
      {
        text: "¡Ay! El gato no sabe nadar.",
        english: "Oh no! The cat can't swim.",
        scene: { hero: "🙀", props: ["🌊"] },
      },
      {
        text: "El pez es bueno. El pez lo empuja fuera.",
        english: "The fish is kind. The fish pushes him out.",
        scene: { hero: "🐟", props: ["🐱", "🌊"] },
      },
      {
        text: "Ahora el gato bebe leche al sol.",
        english: "Now the cat drinks milk in the sun.",
        scene: { hero: "🐱", props: ["🥛", "☀️"] },
      },
      {
        text: "El gato y el pez son amigos. ¡Fin!",
        english: "The cat and the fish are friends. The end!",
        scene: { hero: "🐱", props: ["🐟", "🦋"] },
      },
    ],
    questions: [
      {
        id: "hambre",
        ask: "¿Quién tiene hambre?",
        english: "Who is hungry?",
        answerId: "gato",
      },
      {
        id: "en-el-agua",
        ask: "¿Quién vive en el agua?",
        english: "Who lives in the water?",
        answerId: "pez",
      },
      {
        id: "salta",
        ask: "¿A dónde salta el gato?",
        english: "Where does the cat jump?",
        answerId: "agua",
      },
      {
        id: "bebe",
        ask: "¿Qué bebe el gato al final?",
        english: "What does the cat drink at the end?",
        answerId: "leche",
      },
    ],
  },
  {
    id: "rana-lluvia",
    titleSpanish: "La rana y la lluvia",
    titleEnglish: "The frog and the rain",
    emoji: "🐸",
    cast: ["rana", "lluvia", "nube", "arcoiris", "caracol", "sol"],
    pages: [
      {
        text: "La rana mira una nube muy gris.",
        english: "The frog looks at a very gray cloud.",
        scene: { hero: "🐸", props: ["☁️"] },
      },
      {
        text: "Cae la lluvia. Plic, plac, plic, plac.",
        english: "The rain falls. Drip, drop, drip, drop.",
        scene: { hero: "🌧️", props: ["🐸"] },
      },
      {
        text: "El caracol corre a su casa. ¡La rana no!",
        english: "The snail runs home. Not the frog!",
        scene: { hero: "🐌", props: ["🏠", "🌧️"] },
      },
      {
        text: "La rana baila en la lluvia. ¡Qué feliz!",
        english: "The frog dances in the rain. So happy!",
        scene: { hero: "🐸", props: ["💃", "🌧️"] },
      },
      {
        text: "Sale el sol. La lluvia se va.",
        english: "The sun comes out. The rain goes away.",
        scene: { hero: "☀️", props: ["🐸"] },
      },
      {
        text: "¡Mira! Un arcoíris enorme. ¡Fin!",
        english: "Look! A huge rainbow. The end!",
        scene: { hero: "🌈", props: ["🐸", "🐌"] },
      },
    ],
    questions: [
      {
        id: "baila",
        ask: "¿Quién baila en la lluvia?",
        english: "Who dances in the rain?",
        answerId: "rana",
      },
      {
        id: "cae",
        ask: "¿Qué cae de la nube?",
        english: "What falls from the cloud?",
        answerId: "lluvia",
      },
      {
        id: "corre",
        ask: "¿Quién corre a su casa?",
        english: "Who runs home?",
        answerId: "caracol",
      },
      {
        id: "final",
        ask: "¿Qué sale al final, con muchos colores?",
        english: "What appears at the end, with many colors?",
        answerId: "arcoiris",
      },
    ],
  },
  {
    id: "perro-pelota",
    titleSpanish: "El perro y la pelota",
    titleEnglish: "The dog and the ball",
    emoji: "🐶",
    cast: ["perro", "pelota", "arbol", "gato", "flor", "mariposa"],
    pages: [
      {
        text: "El perro juega con su pelota roja.",
        english: "The dog plays with his red ball.",
        scene: { hero: "🐶", props: ["⚽"] },
      },
      {
        text: "¡Oh, no! La pelota vuela muy alto.",
        english: "Oh no! The ball flies very high.",
        scene: { hero: "⚽", props: ["🐶", "🌳"] },
      },
      {
        text: "La pelota está en el árbol. El perro salta y salta.",
        english: "The ball is in the tree. The dog jumps and jumps.",
        scene: { hero: "🌳", props: ["⚽", "🐶"] },
      },
      {
        text: "Llega el gato. El gato sube al árbol.",
        english: "The cat arrives. The cat climbs the tree.",
        scene: { hero: "🐱", props: ["🌳", "⚽"] },
      },
      {
        text: "El gato tira la pelota. ¡Gracias, gato!",
        english: "The cat drops the ball down. Thank you, cat!",
        scene: { hero: "⚽", props: ["🐱", "🐶"] },
      },
      {
        text: "Ahora juegan los dos juntos. ¡Fin!",
        english: "Now the two of them play together. The end!",
        scene: { hero: "🐶", props: ["🐱", "⚽", "🌼"] },
      },
    ],
    questions: [
      {
        id: "juega",
        ask: "¿Con qué juega el perro?",
        english: "What does the dog play with?",
        answerId: "pelota",
      },
      {
        id: "donde",
        ask: "¿Dónde está la pelota?",
        english: "Where is the ball?",
        answerId: "arbol",
      },
      {
        id: "sube",
        ask: "¿Quién sube al árbol?",
        english: "Who climbs the tree?",
        answerId: "gato",
      },
      {
        id: "salta",
        ask: "¿Quién salta y salta?",
        english: "Who jumps and jumps?",
        answerId: "perro",
      },
    ],
  },
  {
    id: "elefante-baila",
    titleSpanish: "El elefante que quiere bailar",
    titleEnglish: "The elephant who wants to dance",
    emoji: "🐘",
    cast: ["elefante", "raton", "tambor", "triste", "musica", "luna"],
    pages: [
      {
        text: "El elefante quiere bailar. ¡Le encanta la música!",
        english: "The elephant wants to dance. He loves music!",
        scene: { hero: "🐘", props: ["🎵"] },
      },
      {
        text: "El elefante baila. ¡Pum! ¡Pum! ¡Pum!",
        english: "The elephant dances. Boom! Boom! Boom!",
        scene: { hero: "🐘", props: ["🎶", "💥"] },
      },
      {
        text: "Tiembla el suelo y el ratón se cae. ¡Ay!",
        english: "The ground shakes and the mouse falls over. Ouch!",
        scene: { hero: "🐭", props: ["🐘", "💫"] },
      },
      {
        text: "Ahora el elefante está triste. No baila más.",
        english: "Now the elephant is sad. He doesn't dance anymore.",
        scene: { hero: "🐘", props: ["😢"] },
      },
      {
        text: "Pero el ratón toca el tambor: ¡pum, pum, pum!",
        english: "But the mouse plays the drum: boom, boom, boom!",
        scene: { hero: "🐭", props: ["🥁", "🐘"] },
      },
      {
        text: "Y todos bailan con el elefante. ¡Fin!",
        english: "And everybody dances with the elephant. The end!",
        scene: { hero: "🐘", props: ["🐭", "🥁", "🌙"] },
      },
    ],
    questions: [
      {
        id: "quiere",
        ask: "¿Quién quiere bailar?",
        english: "Who wants to dance?",
        answerId: "elefante",
      },
      {
        id: "cae",
        ask: "¿Quién se cae al suelo?",
        english: "Who falls on the floor?",
        answerId: "raton",
      },
      {
        id: "toca",
        ask: "¿Qué toca el ratón?",
        english: "What does the mouse play?",
        answerId: "tambor",
      },
      {
        id: "como-esta",
        ask: "¿Cómo está el elefante cuando nadie baila?",
        english: "How does the elephant feel when nobody dances?",
        answerId: "triste",
      },
    ],
  },
  {
    id: "luna-galleta",
    titleSpanish: "La luna es una galleta",
    titleEnglish: "The moon is a cookie",
    emoji: "🌙",
    cast: ["raton", "luna", "galleta", "montana", "estrella", "queso"],
    pages: [
      {
        text: "Es de noche. El ratón mira la luna.",
        english: "It is night. The mouse looks at the moon.",
        scene: { hero: "🐭", props: ["🌙", "⭐"] },
      },
      {
        text: "El ratón dice: ¡La luna es una galleta!",
        english: "The mouse says: the moon is a cookie!",
        scene: { hero: "🌙", props: ["🍪", "🐭"] },
      },
      {
        text: "El ratón sube a la montaña. Sube y sube.",
        english: "The mouse climbs the mountain. Up and up.",
        scene: { hero: "⛰️", props: ["🐭", "🌙"] },
      },
      {
        text: "Pero la luna está muy lejos. El ratón no llega.",
        english: "But the moon is very far away. The mouse can't reach it.",
        scene: { hero: "🐭", props: ["🌙", "⭐"] },
      },
      {
        text: "El ratón está cansado. Vuelve a su casa.",
        english: "The mouse is tired. He goes back home.",
        scene: { hero: "🐭", props: ["🏠", "🌙"] },
      },
      {
        text: "¡En casa hay una galleta de verdad! ¡Fin!",
        english: "At home there is a real cookie! The end!",
        scene: { hero: "🍪", props: ["🐭", "🧀"] },
      },
    ],
    questions: [
      {
        id: "mira",
        ask: "¿Qué mira el ratón en el cielo?",
        english: "What does the mouse look at in the sky?",
        answerId: "luna",
      },
      {
        id: "sube",
        ask: "¿A dónde sube el ratón?",
        english: "What does the mouse climb?",
        answerId: "montana",
      },
      {
        id: "quien",
        ask: "¿Quién quiere comer la luna?",
        english: "Who wants to eat the moon?",
        answerId: "raton",
      },
      {
        id: "casa",
        ask: "¿Qué hay en casa al final?",
        english: "What is at home at the end?",
        answerId: "galleta",
      },
    ],
  },
  {
    id: "oso-dormir",
    titleSpanish: "El oso no puede dormir",
    titleEnglish: "The bear can't sleep",
    emoji: "🐻",
    cast: ["oso", "peluche", "cama", "dormir", "luna", "cantar"],
    pages: [
      {
        text: "El oso está en su cama. No puede dormir.",
        english: "The bear is in his bed. He can't sleep.",
        scene: { hero: "🐻", props: ["🛏️"] },
      },
      {
        text: "El oso cuenta estrellas: una, dos, tres...",
        english: "The bear counts stars: one, two, three...",
        scene: { hero: "🐻", props: ["⭐", "⭐"] },
      },
      {
        text: "El oso bebe leche caliente. Pero nada.",
        english: "The bear drinks warm milk. But nothing.",
        scene: { hero: "🐻", props: ["🥛"] },
      },
      {
        text: "Entonces abraza su peluche. ¡Qué bien!",
        english: "Then he hugs his teddy. That's better!",
        scene: { hero: "🧸", props: ["🐻"] },
      },
      {
        text: "Y la luna canta una canción muy suave.",
        english: "And the moon sings a very soft song.",
        scene: { hero: "🌙", props: ["🎵", "🐻"] },
      },
      {
        text: "El oso duerme. ¡Chsss! ¡Fin!",
        english: "The bear is asleep. Shhh! The end!",
        scene: { hero: "😴", props: ["🐻", "🧸", "🌙"] },
      },
    ],
    questions: [
      {
        id: "quien",
        ask: "¿Quién no puede dormir?",
        english: "Who can't sleep?",
        answerId: "oso",
      },
      {
        id: "abraza",
        ask: "¿Qué abraza el oso?",
        english: "What does the bear hug?",
        answerId: "peluche",
      },
      {
        id: "canta",
        ask: "¿Quién canta una canción?",
        english: "Who sings a song?",
        answerId: "luna",
      },
      {
        id: "final",
        ask: "¿Qué hace el oso al final?",
        english: "What does the bear do at the end?",
        answerId: "dormir",
      },
    ],
  },
];
