import API from "renderer/lib/api";
import styled from "styled-components";

export interface StyledMenuAcceleratorProps {
  $accelerator: string;
}

export const acceleratorForPlatform = (accelerator: string) => {
  if (API.platform === "darwin") {
    return accelerator
      .replace(/CommandOrControl\+/g, "⌘")
      .replace(/Shift\+/g, "⇧")
      .replace(/Alt\+/g, "⌥");
  }
  return accelerator
    .replace(/CommandOrControl\+/g, "Ctrl+")
    .replace(/Shift\+/g, "Shift+")
    .replace(/Alt\+/g, "Alt+");
};

export const StyledMenuAccelerator = styled.div.attrs<StyledMenuAcceleratorProps>(
  (props) => ({
    children: acceleratorForPlatform(props.$accelerator),
  })
)<StyledMenuAcceleratorProps>`
  flex-grow: 1;
  font-size: 0.8em;
  text-align: right;
  margin-left: 20px;
  color: ${(props) => props.theme.colors.secondaryText};
`;
