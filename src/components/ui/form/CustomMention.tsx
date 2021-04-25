import React from "react";
import PropTypes from "prop-types";
import useStyles from "substyle";
import { MentionProps } from "react-mentions";

interface CustomMentionProps extends MentionProps {
  display?: string;
  hoverTransform?: (id: string) => string;
  id?: string;
  onClick?: (
    e: React.MouseEvent<HTMLElement, MouseEvent>,
    id: string,
    index: number
  ) => void;
}

const defaultStyle = {
  fontWeight: "inherit",
};

const CustomMention = ({
  display,
  style,
  className,
  hoverTransform,
  id,
  onClick,
}: CustomMentionProps) => {
  const styles = useStyles(defaultStyle, { style, className });
  if (!id) {
    return null;
  }
  return (
    <strong
      {...styles}
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

CustomMention.propTypes = {
  onAdd: PropTypes.func,
  onRemove: PropTypes.func,
  renderSuggestion: PropTypes.func,
  trigger: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(RegExp),
  ]),
  markup: PropTypes.string,
  displayTransform: PropTypes.func,
  allowSpaceInQuery: PropTypes.bool,
  isLoading: PropTypes.bool,
};

CustomMention.defaultProps = {
  trigger: "@",
  markup: "@[__display__](__id__)",
  displayTransform: function (id: string, display: string) {
    return display || id;
  },
  onAdd: () => null,
  onRemove: () => null,
  renderSuggestion: undefined,
  isLoading: false,
  appendSpaceOnAdd: false,
};

export default CustomMention;
