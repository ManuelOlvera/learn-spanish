import { Box, Cat, Ground, Scene } from "@/card-art/posicion-scene";

/**
 * delante — the cat is in front of the box, standing nearer than it.
 *
 * Depth with no perspective to spend: the box is lifted off the ground line
 * so it reads as further back, and the cat is drawn last so it overlaps.
 */
export function DelanteArt({ className }: { className?: string }) {
  return (
    <Scene className={className}>
      <Ground/>
      <Box x={52} y={84} w={96} h={68}/>
      <Cat x={104} y={184}/>
    </Scene>
  );
}
