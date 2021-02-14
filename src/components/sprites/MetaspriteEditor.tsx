import React from "react";
import { SpriteSliceCanvas } from "./preview/SpriteSliceCanvas";

interface MetaspriteEditorProps {
  id: string;
}

const MetaspriteEditor = ({ id }: MetaspriteEditorProps) => {
  return (
    <div>
      METASPRITE EDITOR {id}
      <SpriteSliceCanvas
        spriteSheetId={id}
        offsetX={0}
        offsetY={0}
        width={8}
        height={16}
      />
      <SpriteSliceCanvas
        spriteSheetId={id}
        offsetX={8}
        offsetY={0}
        width={8}
        height={16}
      />
      <SpriteSliceCanvas
        spriteSheetId={id}
        offsetX={0}
        offsetY={0}
        width={8}
        height={16}
        flipX
      />
      <SpriteSliceCanvas
        spriteSheetId={id}
        offsetX={0}
        offsetY={0}
        width={8}
        height={16}
        flipY
      />
      <SpriteSliceCanvas
        spriteSheetId={id}
        offsetX={0}
        offsetY={0}
        width={8}
        height={16}
        flipX
        flipY
      />
    </div>
  );
};

export default MetaspriteEditor;
