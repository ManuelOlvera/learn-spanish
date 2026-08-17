import { Box, Cat, Dashes, Ground, Scene } from "@/card-art/posicion-scene";

/**
 * cerca — a short hop between the cat and the box.
 *
 * cerca and lejos are a matched pair: same cat, same box, and a dashed run
 * along the floor that measures the gap. Here it is a few dashes long.
 */
export function CercaArt({ className }: { className?: string }) {
  return (
    <Scene className={className}>
      <Ground/>
      <Box x={124} y={112} w={64} h={72}/>
      <Cat x={58} y={184}/>
      <Dashes x1={96} x2={122} y={172}/>
    </Scene>
  );
}
