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
 *
 * The later stories (the Mundial pair, the trip to Japan) are pitched at the
 * reader: eight pages, longer sentences, real plot, and the **simple past** —
 * which the decks never teach, so a story is the only place a kid meets it.
 * They are not tiered or gated; the shelf is picked by picture and an older
 * kid reliably picks the football. The two true stories keep their real
 * details (the minute, the scorer, the score) because getting a family's own
 * memory wrong is worse than not telling it.
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
        image: "gato-pez-1",
      },
      {
        text: "El gato salta al agua. ¡Plof!",
        english: "The cat jumps into the water. Splash!",
        scene: { hero: "🐱", props: ["💦", "🐟"] },
        image: "gato-pez-2",
      },
      {
        text: "¡Ay! El gato no sabe nadar.",
        english: "Oh no! The cat can't swim.",
        scene: { hero: "🙀", props: ["🌊"] },
        image: "gato-pez-3",
      },
      {
        text: "El pez es bueno. El pez lo empuja fuera.",
        english: "The fish is kind. The fish pushes him out.",
        scene: { hero: "🐟", props: ["🐱", "🌊"] },
        image: "gato-pez-4",
      },
      {
        text: "Ahora el gato bebe leche al sol.",
        english: "Now the cat drinks milk in the sun.",
        scene: { hero: "🐱", props: ["🥛", "☀️"] },
        image: "gato-pez-5",
      },
      {
        text: "El gato y el pez son amigos. ¡Fin!",
        english: "The cat and the fish are friends. The end!",
        scene: { hero: "🐱", props: ["🐟", "🦋"] },
        image: "gato-pez-6",
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
        image: "rana-lluvia-1",
      },
      {
        text: "Cae la lluvia. Plic, plac, plic, plac.",
        english: "The rain falls. Drip, drop, drip, drop.",
        scene: { hero: "🌧️", props: ["🐸"] },
        image: "rana-lluvia-2",
      },
      {
        text: "El caracol corre a su casa. ¡La rana no!",
        english: "The snail runs home. Not the frog!",
        scene: { hero: "🐌", props: ["🏠", "🌧️"] },
        image: "rana-lluvia-3",
      },
      {
        text: "La rana baila en la lluvia. ¡Qué feliz!",
        english: "The frog dances in the rain. So happy!",
        scene: { hero: "🐸", props: ["💃", "🌧️"] },
        image: "rana-lluvia-4",
      },
      {
        text: "Sale el sol. La lluvia se va.",
        english: "The sun comes out. The rain goes away.",
        scene: { hero: "☀️", props: ["🐸"] },
        image: "rana-lluvia-5",
      },
      {
        text: "¡Mira! Un arcoíris enorme. ¡Fin!",
        english: "Look! A huge rainbow. The end!",
        scene: { hero: "🌈", props: ["🐸", "🐌"] },
        image: "rana-lluvia-6",
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
        image: "perro-pelota-1",
      },
      {
        text: "¡Oh, no! La pelota vuela muy alto.",
        english: "Oh no! The ball flies very high.",
        scene: { hero: "⚽", props: ["🐶", "🌳"] },
        image: "perro-pelota-2",
      },
      {
        text: "La pelota está en el árbol. El perro salta y salta.",
        english: "The ball is in the tree. The dog jumps and jumps.",
        scene: { hero: "🌳", props: ["⚽", "🐶"] },
        image: "perro-pelota-3",
      },
      {
        text: "Llega el gato. El gato sube al árbol.",
        english: "The cat arrives. The cat climbs the tree.",
        scene: { hero: "🐱", props: ["🌳", "⚽"] },
        image: "perro-pelota-4",
      },
      {
        text: "El gato tira la pelota. ¡Gracias, gato!",
        english: "The cat drops the ball down. Thank you, cat!",
        scene: { hero: "⚽", props: ["🐱", "🐶"] },
        image: "perro-pelota-5",
      },
      {
        text: "Ahora juegan los dos juntos. ¡Fin!",
        english: "Now the two of them play together. The end!",
        scene: { hero: "🐶", props: ["🐱", "⚽", "🌼"] },
        image: "perro-pelota-6",
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
        image: "elefante-baila-1",
      },
      {
        text: "El elefante baila. ¡Pum! ¡Pum! ¡Pum!",
        english: "The elephant dances. Boom! Boom! Boom!",
        scene: { hero: "🐘", props: ["🎶", "💥"] },
        image: "elefante-baila-2",
      },
      {
        text: "Tiembla el suelo y el ratón se cae. ¡Ay!",
        english: "The ground shakes and the mouse falls over. Ouch!",
        scene: { hero: "🐭", props: ["🐘", "💫"] },
        image: "elefante-baila-3",
      },
      {
        text: "Ahora el elefante está triste. No baila más.",
        english: "Now the elephant is sad. He doesn't dance anymore.",
        scene: { hero: "🐘", props: ["😢"] },
        image: "elefante-baila-4",
      },
      {
        text: "Pero el ratón toca el tambor: ¡pum, pum, pum!",
        english: "But the mouse plays the drum: boom, boom, boom!",
        scene: { hero: "🐭", props: ["🥁", "🐘"] },
        image: "elefante-baila-5",
      },
      {
        text: "Y todos bailan con el elefante. ¡Fin!",
        english: "And everybody dances with the elephant. The end!",
        scene: { hero: "🐘", props: ["🐭", "🥁", "🌙"] },
        image: "elefante-baila-6",
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
        image: "luna-galleta-1",
      },
      {
        text: "El ratón dice: ¡La luna es una galleta!",
        english: "The mouse says: the moon is a cookie!",
        scene: { hero: "🌙", props: ["🍪", "🐭"] },
        image: "luna-galleta-2",
      },
      {
        text: "El ratón sube a la montaña. Sube y sube.",
        english: "The mouse climbs the mountain. Up and up.",
        scene: { hero: "⛰️", props: ["🐭", "🌙"] },
        image: "luna-galleta-3",
      },
      {
        text: "Pero la luna está muy lejos. El ratón no llega.",
        english: "But the moon is very far away. The mouse can't reach it.",
        scene: { hero: "🐭", props: ["🌙", "⭐"] },
        image: "luna-galleta-4",
      },
      {
        text: "El ratón está cansado. Vuelve a su casa.",
        english: "The mouse is tired. He goes back home.",
        scene: { hero: "🐭", props: ["🏠", "🌙"] },
        image: "luna-galleta-5",
      },
      {
        text: "¡En casa hay una galleta de verdad! ¡Fin!",
        english: "At home there is a real cookie! The end!",
        scene: { hero: "🍪", props: ["🐭", "🧀"] },
        image: "luna-galleta-6",
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
        image: "oso-dormir-1",
      },
      {
        text: "El oso cuenta estrellas: una, dos, tres...",
        english: "The bear counts stars: one, two, three...",
        scene: { hero: "🐻", props: ["⭐", "⭐"] },
        image: "oso-dormir-2",
      },
      {
        text: "El oso bebe leche caliente. Pero nada.",
        english: "The bear drinks warm milk. But nothing.",
        scene: { hero: "🐻", props: ["🥛"] },
        image: "oso-dormir-3",
      },
      {
        text: "Entonces abraza su peluche. ¡Qué bien!",
        english: "Then he hugs his teddy. That's better!",
        scene: { hero: "🧸", props: ["🐻"] },
        image: "oso-dormir-4",
      },
      {
        text: "Y la luna canta una canción muy suave.",
        english: "And the moon sings a very soft song.",
        scene: { hero: "🌙", props: ["🎵", "🐻"] },
        image: "oso-dormir-5",
      },
      {
        text: "El oso duerme. ¡Chsss! ¡Fin!",
        english: "The bear is asleep. Shhh! The end!",
        scene: { hero: "😴", props: ["🐻", "🧸", "🌙"] },
        image: "oso-dormir-6",
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
  {
    id: "mundial-2010",
    titleSpanish: "El gol de Iniesta",
    titleEnglish: "Iniesta's goal",
    emoji: "🏆",
    cast: ["futbol", "pelota", "trofeo", "camiseta", "rojo", "medalla"],
    pages: [
      {
        text: "En 2010, España jugó la final del Mundial. Todo el país miraba la televisión.",
        english: "In 2010, Spain played the World Cup final. The whole country was watching.",
        scene: { hero: "📺", props: ["⚽", "🇪🇸"] },
        image: "mundial-2010-1",
      },
      {
        text: "El partido fue en Sudáfrica. Los jugadores salieron con la camiseta roja.",
        english: "The match was in South Africa. The players came out in the red shirt.",
        scene: { hero: "👕", props: ["⚽", "🏟️"] },
        image: "mundial-2010-2",
      },
      {
        text: "España jugaba contra Holanda. Fue un partido durísimo y nadie marcaba.",
        english: "Spain played against the Netherlands. It was a very tough match and nobody scored.",
        scene: { hero: "⚽", props: ["😬"] },
        image: "mundial-2010-3",
      },
      {
        text: "Pasaron noventa minutos. Cero a cero. Empezó la prórroga y todos estaban nerviosos.",
        english: "Ninety minutes passed. Nil-nil. Extra time began and everyone was nervous.",
        scene: { hero: "⏱️", props: ["⚽", "😰"] },
        image: "mundial-2010-4",
      },
      {
        text: "Minuto 116. Cesc vio a Iniesta solo dentro del área y le pasó la pelota.",
        english: "Minute 116. Cesc saw Iniesta alone in the box and passed him the ball.",
        scene: { hero: "⚽", props: ["👟"] },
        image: "mundial-2010-5",
      },
      {
        text: "Iniesta paró la pelota, disparó fuerte y... ¡GOOOL! España ganaba uno a cero.",
        english: "Iniesta controlled the ball, shot hard and... GOAL! Spain were winning one-nil.",
        scene: { hero: "🥅", props: ["⚽", "🎉"] },
        image: "mundial-2010-6",
      },
      {
        text: "En la calle la gente gritaba y saltaba. En toda España nadie se quedó sentado.",
        english: "In the street people were shouting and jumping. Nobody in Spain stayed sitting down.",
        scene: { hero: "🎉", props: ["🇪🇸", "🎆"] },
        image: "mundial-2010-7",
      },
      {
        text: "Casillas levantó el trofeo. ¡España campeona del mundo por primera vez! ¡Fin!",
        english: "Casillas lifted the trophy. Spain world champions for the first time! The end!",
        scene: { hero: "🏆", props: ["🥇", "🇪🇸"] },
        image: "mundial-2010-8",
      },
    ],
    questions: [
      {
        id: "deporte",
        ask: "¿A qué deporte jugaban?",
        english: "What sport were they playing?",
        answerId: "futbol",
      },
      {
        id: "camiseta",
        ask: "¿De qué color era la camiseta de España?",
        english: "What colour was Spain's shirt?",
        answerId: "rojo",
      },
      {
        id: "gol",
        ask: "¿Qué disparó Iniesta?",
        english: "What did Iniesta shoot?",
        answerId: "pelota",
      },
      {
        id: "final",
        ask: "¿Qué levantó Casillas al final?",
        english: "What did Casillas lift at the end?",
        answerId: "trofeo",
      },
    ],
  },
  {
    id: "mundial-2023",
    titleSpanish: "Las campeonas",
    titleEnglish: "The champions",
    emoji: "🥇",
    cast: ["futbol", "pelota", "trofeo", "camiseta", "medalla", "estrella"],
    pages: [
      {
        text: "En 2023, la selección española de mujeres llegó a su primera final del Mundial.",
        english: "In 2023, the Spanish women's team reached their first World Cup final.",
        scene: { hero: "⚽", props: ["🇪🇸", "🌏"] },
        image: "mundial-2023-1",
      },
      {
        text: "La final fue en Sídney, en Australia, al otro lado del mundo.",
        english: "The final was in Sydney, Australia, on the other side of the world.",
        scene: { hero: "🏟️", props: ["🇦🇺", "✈️"] },
        image: "mundial-2023-2",
      },
      {
        text: "España jugaba contra Inglaterra. Las dos selecciones querían la copa.",
        english: "Spain played against England. Both teams wanted the cup.",
        scene: { hero: "👕", props: ["⚽"] },
        image: "mundial-2023-3",
      },
      {
        text: "En el minuto 29, Olga Carmona corrió por la banda y recibió la pelota.",
        english: "In the 29th minute, Olga Carmona ran down the wing and received the ball.",
        scene: { hero: "👟", props: ["⚽"] },
        image: "mundial-2023-4",
      },
      {
        text: "Olga disparó cruzado. La pelota entró junto al poste. ¡Uno a cero!",
        english: "Olga shot across goal. The ball went in by the post. One-nil!",
        scene: { hero: "🥅", props: ["⚽", "🎉"] },
        image: "mundial-2023-5",
      },
      {
        text: "En la segunda parte España tuvo un penalti, pero la portera inglesa lo paró.",
        english: "In the second half Spain had a penalty, but the English keeper saved it.",
        scene: { hero: "🧤", props: ["⚽", "😲"] },
        image: "mundial-2023-6",
      },
      {
        text: "El árbitro pitó el final. España ganó su primer Mundial femenino.",
        english: "The referee blew the final whistle. Spain won their first Women's World Cup.",
        scene: { hero: "📣", props: ["⚽", "🎉"] },
        image: "mundial-2023-7",
      },
      {
        text: "Las jugadoras levantaron el trofeo juntas. ¡Campeonas del mundo! ¡Fin!",
        english: "The players lifted the trophy together. World champions! The end!",
        scene: { hero: "🏆", props: ["🥇", "🇪🇸"] },
        image: "mundial-2023-8",
      },
    ],
    questions: [
      {
        id: "deporte",
        ask: "¿A qué deporte jugaban?",
        english: "What sport were they playing?",
        answerId: "futbol",
      },
      {
        id: "paro",
        ask: "¿Qué paró la portera inglesa?",
        english: "What did the English keeper save?",
        answerId: "pelota",
      },
      {
        id: "llevan",
        ask: "¿Qué llevan las jugadoras para jugar?",
        english: "What do the players wear to play?",
        answerId: "camiseta",
      },
      {
        id: "final",
        ask: "¿Qué levantaron las jugadoras al final?",
        english: "What did the players lift at the end?",
        answerId: "trofeo",
      },
    ],
  },
  {
    id: "mundial-2026",
    titleSpanish: "La segunda estrella",
    titleEnglish: "The second star",
    emoji: "⭐",
    cast: ["futbol", "pelota", "trofeo", "camiseta", "estrella", "rojo"],
    pages: [
      {
        text: "En 2026, dieciséis años después, España volvió a jugar una final del Mundial.",
        english: "In 2026, sixteen years later, Spain played a World Cup final again.",
        scene: { hero: "⚽", props: ["🇪🇸", "📺"] },
        image: "mundial-2026-1",
      },
      {
        text: "Esta vez fue en Nueva Jersey, en Estados Unidos, en un estadio gigantesco.",
        english: "This time it was in New Jersey, in the United States, in a giant stadium.",
        scene: { hero: "🏟️", props: ["🇺🇸"] },
        image: "mundial-2026-2",
      },
      {
        text: "Enfrente estaba Argentina, con Messi. Todo el mundo quería ver ese partido.",
        english: "Argentina were the opponents, with Messi. Everyone wanted to watch that match.",
        scene: { hero: "👕", props: ["⚽", "🌍"] },
        image: "mundial-2026-3",
      },
      {
        text: "España atacaba y atacaba, pero la pelota no entraba. Noventa minutos: cero a cero.",
        english: "Spain attacked and attacked, but the ball wouldn't go in. Ninety minutes: nil-nil.",
        scene: { hero: "⚽", props: ["😬", "⏱️"] },
        image: "mundial-2026-4",
      },
      {
        text: "Otra vez prórroga, como en 2010. Los jugadores estaban cansadísimos.",
        english: "Extra time again, just like in 2010. The players were exhausted.",
        scene: { hero: "⏱️", props: ["😮‍💨", "⚽"] },
        image: "mundial-2026-5",
      },
      {
        text: "Minuto 106. Ferran Torres había salido del banquillo y vio la pelota botar en el área.",
        english: "Minute 106. Ferran Torres had come off the bench and saw the ball bounce in the box.",
        scene: { hero: "👟", props: ["⚽"] },
        image: "mundial-2026-6",
      },
      {
        text: "Disparó con la izquierda desde lejos. ¡GOL! El estadio entero se volvió loco.",
        english: "He shot with his left foot from distance. GOAL! The whole stadium went wild.",
        scene: { hero: "🥅", props: ["⚽", "🎉"] },
        image: "mundial-2026-7",
      },
      {
        text: "España levantó su segundo trofeo. ¡Ahora la camiseta lleva dos estrellas! ¡Fin!",
        english: "Spain lifted their second trophy. Now the shirt carries two stars! The end!",
        scene: { hero: "🏆", props: ["⭐", "⭐"] },
        image: "mundial-2026-8",
      },
    ],
    questions: [
      {
        id: "deporte",
        ask: "¿A qué deporte jugaban?",
        english: "What sport were they playing?",
        answerId: "futbol",
      },
      {
        id: "disparo",
        ask: "¿Qué disparó Ferran Torres?",
        english: "What did Ferran Torres shoot?",
        answerId: "pelota",
      },
      {
        id: "levanto",
        ask: "¿Qué levantó España al final?",
        english: "What did Spain lift at the end?",
        answerId: "trofeo",
      },
      {
        id: "estrellas",
        ask: "¿Qué lleva ahora la camiseta de España?",
        english: "What does Spain's shirt carry now?",
        answerId: "estrella",
      },
    ],
  },
  {
    id: "halloween-japon",
    titleSpanish: "Halloween en Japón",
    titleEnglish: "Halloween in Japan",
    emoji: "🎃",
    cast: ["avion", "tren", "volcan", "arana", "telarana", "luna", "robot", "helado"],
    pages: [
      {
        text: "Noah y Ava son hermanos. En octubre subieron a un avión enorme: ¡se iban a Japón!",
        english: "Noah and Ava are brother and sister. In October they boarded a huge plane: they were off to Japan!",
        scene: { hero: "✈️", props: ["🎒", "🌏"] },
        image: "halloween-japon-1",
      },
      {
        text: "Volaron toda la noche. Por la ventana vieron salir el sol entre las nubes.",
        english: "They flew all night. Through the window they saw the sun rise between the clouds.",
        scene: { hero: "🌅", props: ["✈️", "☁️"] },
        image: "halloween-japon-2",
      },
      {
        text: "En Tokio cogieron un tren blanco y larguísimo que corría como una flecha.",
        english: "In Tokyo they took a long white train that ran like an arrow.",
        scene: { hero: "🚄", props: ["🚉"] },
        image: "halloween-japon-3",
      },
      {
        text: "Desde la ventana vieron el volcán Fuji, altísimo y blanco de nieve.",
        english: "From the window they saw Mount Fuji, towering and white with snow.",
        scene: { hero: "🗻", props: ["🚄"] },
        image: "halloween-japon-4",
      },
      {
        text: "Por fin llegaron a Universal Studios. ¡El parque entero estaba decorado de Halloween!",
        english: "At last they reached Universal Studios. The whole park was decorated for Halloween!",
        scene: { hero: "🎃", props: ["🎡", "🎢"] },
        image: "halloween-japon-5",
      },
      {
        text: "Había calabazas por todas partes y una telaraña gigante con una araña peluda.",
        english: "There were pumpkins everywhere and a giant spiderweb with a furry spider.",
        scene: { hero: "🕸️", props: ["🕷️", "🎃"] },
        image: "halloween-japon-6",
      },
      {
        text: "Ava se disfrazó de bruja y Noah de robot. Salió la luna y pidieron caramelos.",
        english: "Ava dressed as a witch and Noah as a robot. The moon came out and they went trick-or-treating.",
        scene: { hero: "🧙", props: ["🤖", "🌙"] },
        image: "halloween-japon-7",
      },
      {
        text: "Cenaron un helado con forma de calabaza y volvieron al hotel felices. ¡Fin!",
        english: "They had a pumpkin-shaped ice cream and went back to the hotel happy. The end!",
        scene: { hero: "🍦", props: ["🎃", "🌙"] },
        image: "halloween-japon-8",
      },
    ],
    questions: [
      {
        id: "viajaron",
        ask: "¿En qué viajaron a Japón?",
        english: "What did they travel to Japan in?",
        answerId: "avion",
      },
      {
        id: "vieron",
        ask: "¿Qué vieron desde la ventana del tren?",
        english: "What did they see from the train window?",
        answerId: "volcan",
      },
      {
        id: "telarana",
        ask: "¿Qué había en la telaraña gigante?",
        english: "What was in the giant spiderweb?",
        answerId: "arana",
      },
      {
        id: "cenaron",
        ask: "¿Qué cenaron al final?",
        english: "What did they have at the end?",
        answerId: "helado",
      },
    ],
  },
];
