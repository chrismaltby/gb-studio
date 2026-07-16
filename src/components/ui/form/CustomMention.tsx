import React from "react";
import { MentionProps } from "react-mentions";

interface CustomMentionProps extends MentionProps {
  display?: string;
  hoverTransform?: (id: string) => string;
  id?: string;
  onClick?: (
    e: React.MouseEvent<HTMLElement, MouseEvent>,
    id: string,
    index: number,
  ) => void;
}

const defaultStyle = {
  fontWeight: "inherit",
} satisfies React.CSSProperties;

const CustomMention = ({
  display,
  style,
  className,
  hoverTransform,
  id,
  onClick,
}: CustomMentionProps) => {
  if (!id) {
    return null;
  }
  return (
    <strong
      className={className}
      style={{ ...defaultStyle, ...style }}
      title={hoverTransform ? hoverTransform(id) : id}
      onClick={(e) => {
        if (!onClick) {
          return;
        }
        const parent = e.currentTarget.parentElement;
        if (!parent) {
          return;
        }
        let foundIndex = 0;
        for (let i = 0; i < parent.children.length; i++) {
          const childNode = parent.children[i];
          if (childNode === e.currentTarget) {
            break;
          } else if (childNode.className === className) {
            foundIndex++;
          }
        }
        onClick(e, id, foundIndex);
      }}
    >
      {display}
    </strong>
  );
};

export default CustomMention;
