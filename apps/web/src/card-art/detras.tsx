import { Box, Cat, Ground, Scene } from "@/card-art/posicion-scene";

/**
 * detrás — the cat is behind the box, peeking over the top.
 *
 * The mirror of `delante` in draw order: the cat goes down first and the box
 * covers it, leaving the ears and the top of the head showing.
 */
export function DetrasArt({ className }: { className?: string }) {
  return (
    <Scene className={className}>
      <Ground/>
      <Cat x={100} y={156}/>
      <Box x={48} y={104} w={104} h={80}/>
    </Scene>
  );
}
