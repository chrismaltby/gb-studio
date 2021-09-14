import * as React from "react";
import { findDOMNode } from "react-dom";
import {
  DragSource,
  DropTarget,
  ConnectDropTarget,
  ConnectDragSource,
  DropTargetMonitor,
  DropTargetConnector,
  DragSourceConnector,
  DragSourceMonitor,
} from "react-dnd";
import styled, { css } from "styled-components";
import { MetaspriteCanvas } from "./preview/MetaspriteCanvas";

interface CardWrapperProps {
  selected: boolean;
  isDragging?: boolean;
}

const ItemType = "frame";

export const CardWrapper = styled.div<CardWrapperProps>`
  width: 50px;
  height: 50px;
  background-color: #ffffff;
  cursor: move;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2px;
  box-sizing: border-box;

  ${(props) =>
    props.selected
      ? css`
          box-shadow: 0 0 0px 4px ${(props) => props.theme.colors.highlight};
        `
      : ""}
  ${(props) =>
    props.isDragging
      ? css`
          opacity: 0;
        `
      : ""}

  canvas {
    max-width: 100%;
    max-height: 100%;
  }
`;

const cardSource = {
  beginDrag(props: CardProps) {
    return {
      id: props.id,
      index: props.index,
    };
  },
};

const cardTarget = {
  hover(props: CardProps, monitor: DropTargetMonitor, component: Card | null) {
    if (!component) {
      return null;
    }
    const dragIndex = (monitor.getItem() as { index: number }).index;
    const hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = (
      findDOMNode(component) as Element
    ).getBoundingClientRect();
    // ).getBoundingClientRect();

    // Get horizontal middle
    const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    if (!clientOffset) {
      return;
    }

    // Get pixels to the left
    const hoverClientX = clientOffset.x - hoverBoundingRect.left;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
      return;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
      return;
    }

    // Time to actually perform the action
    props.moveCard(dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    (monitor.getItem() as { index: number }).index = hoverIndex;
  },
};

export interface CardProps {
  id: string;
  spriteSheetId: string;
  text: string;
  index: number;
  selected: boolean;
  isDragging?: boolean;
  onSelect: (id: string) => void;
  connectDragSource?: ConnectDragSource;
  connectDropTarget?: ConnectDropTarget;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
}

class Card extends React.Component<CardProps> {
  render() {
    const {
      id,
      spriteSheetId,
      selected,
      isDragging,
      onSelect,
      connectDragSource,
      connectDropTarget,
    } = this.props;

    return (
      connectDragSource &&
      connectDropTarget &&
      connectDragSource(
        connectDropTarget(
          <div onClick={() => onSelect(id)}>
            <CardWrapper selected={selected} isDragging={isDragging}>
              <MetaspriteCanvas
                metaspriteId={id}
                spriteSheetId={spriteSheetId}
              />
            </CardWrapper>
          </div>
        )
      )
    );
  }
}

const DraggableCard = DropTarget(
  ItemType,
  cardTarget,
  (connect: DropTargetConnector) => ({
    connectDropTarget: connect.dropTarget(),
  })
)(
  DragSource(
    ItemType,
    cardSource,
    (connect: DragSourceConnector, monitor: DragSourceMonitor) => ({
      connectDragSource: connect.dragSource(),
      isDragging: monitor.isDragging(),
    })
  )(Card)
);

export default DraggableCard;
