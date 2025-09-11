import React from "react";
import { StyledTextarea } from "ui/form/style";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly displaySize?: "small" | "medium" | "large";
}

export const Textarea = ({
  displaySize = "medium",
  ...props
}: TextareaProps) => {
  return <StyledTextarea $displaySize={displaySize} {...props} />;
};
