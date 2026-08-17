import { Box, Cat, Ground, Scene } from "@/card-art/posicion-scene";

/**
 * al lado — the cat is beside the box, right up against it.
 *
 * Touching, both on the floor, and no dashed distance between them: that is
 * what separates this from `cerca`, which is beside but with a gap.
 */
export function AlLadoArt({ className }: { className?: string }) {
  return (
    <Scene className={className}>
      <Ground/>
      <Box x={22} y={116} w={80} h={68}/>
      <Cat x={138} y={184} facing={-1}/>
    </Scene>
  );
}
