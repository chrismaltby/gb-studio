import React from "react";
import { useDrop } from "react-dnd";
import {
  StyledListDropzone,
  StyledListWithDropzoneWrapper,
} from "ui/lists/style";

export const createFlatListOuterDropTarget = <T,>(
  acceptTypes: string[],
  onDrop: (item: T) => void,
) => {
  const Outer = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >((props, ref) => {
    const [{ isOver }, drop] = useDrop({
      accept: acceptTypes,
      drop: (item: T, monitor) => {
        if (monitor.didDrop()) return;
        onDrop(item);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
      }),
    });

    return (
      <StyledListWithDropzoneWrapper {...props} ref={ref}>
        {props.children}
        <StyledListDropzone ref={drop} $isOver={isOver} />
      </StyledListWithDropzoneWrapper>
    );
  });

  return Outer;
};
