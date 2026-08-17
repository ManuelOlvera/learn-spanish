import { Box, Cat, Dashes, Ground, Scene } from "@/card-art/posicion-scene";

/**
 * lejos — the cat is far away, small, with a long run of dashes to cross.
 *
 * The pair to `cerca`: the dashed gap is three times as long, and the cat is
 * drawn at half size, because small is what far away looks like to a child.
 */
export function LejosArt({ className }: { className?: string }) {
  return (
    <Scene className={className}>
      <Ground/>
      <Box x={124} y={112} w={64} h={72}/>
      <Cat x={34} y={184} scale={0.5}/>
      <Dashes x1={56} x2={120} y={176}/>
    </Scene>
  );
}
