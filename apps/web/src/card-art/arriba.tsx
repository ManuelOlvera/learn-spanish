import { Box, Cat, Ground, Plank, Scene } from "@/card-art/posicion-scene";

/**
 * arriba — the cat is up high, on the shelf; the box is down on the floor.
 *
 * The shelf is what separates this from `encima`: up high is a place, not a
 * thing you are on top of.
 */
export function ArribaArt({ className }: { className?: string }) {
  return (
    <Scene className={className}>
      <Ground/>
      <Box x={64} y={140} w={72} h={44}/>
      <Plank y={84}/>
      <Cat x={100} y={84}/>
    </Scene>
  );
}
