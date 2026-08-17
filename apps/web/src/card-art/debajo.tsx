import { Box, Cat, Ground, Scene } from "@/card-art/posicion-scene";

/**
 * debajo — the cat is underneath, between the legs of the box.
 *
 * The legs are what make "under" possible at all: a box flat on the floor has
 * no underneath. They also keep this from reading as `abajo`, where the two
 * are far apart and a shelf holds the box.
 */
export function DebajoArt({ className }: { className?: string }) {
  return (
    <Scene className={className}>
      <Ground/>
      <Box x={30} y={40} w={140} h={56} legs={88}/>
      <Cat x={100} y={184}/>
    </Scene>
  );
}
