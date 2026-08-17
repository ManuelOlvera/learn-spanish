import { Box, Cat, Ground, Scene } from "@/card-art/posicion-scene";

/**
 * encima — the cat is on top of the box, sitting on the lid.
 *
 * Cat and box touch and stack into one shape. No shelf, unlike `arriba`.
 */
export function EncimaArt({ className }: { className?: string }) {
  return (
    <Scene className={className}>
      <Ground/>
      <Box x={54} y={110} w={92} h={74}/>
      <Cat x={100} y={110}/>
    </Scene>
  );
}
