import { Box, Cat, Ground, Plank, Scene } from "@/card-art/posicion-scene";

/**
 * abajo — the box is up on the shelf; the cat is down on the floor.
 *
 * The exact inverse of `arriba`: same shelf, the two swapped. What moved is
 * the box as well as the cat, which is what keeps it from reading as `debajo`.
 */
export function AbajoArt({ className }: { className?: string }) {
  return (
    <Scene className={className}>
      <Ground/>
      <Box x={64} y={22} w={72} h={48}/>
      <Plank y={70}/>
      <Cat x={100} y={184}/>
    </Scene>
  );
}
