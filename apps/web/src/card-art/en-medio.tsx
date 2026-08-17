import { Box, Cat, Ground, Scene } from "@/card-art/posicion-scene";

/**
 * en medio — the cat is in the middle, a box on either side.
 *
 * Two boxes is the only card in the deck with two, which is what makes the
 * picture unmistakable. The deck teaches "en medio" rather than "entre"
 * because "¿Está entre?" asks between what and cannot be answered alone.
 */
export function EnMedioArt({ className }: { className?: string }) {
  return (
    <Scene className={className}>
      <Ground/>
      <Box x={4} y={124} w={50} h={60}/>
      <Box x={146} y={124} w={50} h={60}/>
      <Cat x={100} y={184} scale={0.85}/>
    </Scene>
  );
}
