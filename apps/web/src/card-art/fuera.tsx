import { Cat, Ground, OpenBox, Scene } from "@/card-art/posicion-scene";

/**
 * fuera — the cat is out of the box, and the box is visibly empty.
 *
 * The empty interior is what makes this the opposite of `dentro` rather than
 * just another cat standing beside a box: the place it could be is showing,
 * and it is not there. The cat looks back at it.
 */
export function FueraArt({ className }: { className?: string }) {
  return (
    <Scene className={className}>
      <Ground/>
      <OpenBox x={14} y={128} w={70} h={56} empty/>
      <Cat x={148} y={184} scale={0.92} facing={-1}/>
    </Scene>
  );
}
