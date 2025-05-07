export const calculateTextBoxHeight = ({
  textLines,
  textY,
  textHeight,
  minHeight,
  maxHeight,
  showFrame,
}: {
  textLines: number;
  textY: number;
  textHeight: number;
  minHeight: number;
  maxHeight: number;
  showFrame: boolean;
}): number =>
  Math.max(
    minHeight,
    Math.min(
      maxHeight,
      Math.min(textLines, textHeight) + textY + (showFrame ? 1 : 0)
    )
  );
