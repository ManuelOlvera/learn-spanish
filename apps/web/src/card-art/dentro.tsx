import { Cat, Ground, OpenBox, Scene } from "@/card-art/posicion-scene";

/**
 * dentro — the cat is in the box: head and one curl of tail over the rim.
 *
 * The cat is drawn first and the box's front wall over it, so the box hides
 * everything below the rim. That is the whole trick, and it is why the box
 * has to be the open one.
 */
export function DentroArt({ className }: { className?: string }) {
  return (
    <Scene className={className}>
      <Ground/>
      <Cat x={104} y={152}/>
      <OpenBox x={52} y={112} w={96} h={72}/>
    </Scene>
  );
}
