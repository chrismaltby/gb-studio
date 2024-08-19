import styled, { css } from "styled-components";
import { PillButton } from "ui/buttons/PillButton";

interface PrefabHeaderProps {
  prefabSet: boolean;
}

export const PrefabHeader = styled.div<PrefabHeaderProps>`
  ${(props) =>
    props.prefabSet
      ? css`
          background: ${(props) => props.theme.colors.prefab.background};
          color: ${(props) => props.theme.colors.prefab.text};
          position: sticky;
          z-index: 1;
          top: 0;

          ${PillButton} {
            background: ${(props) =>
              props.theme.colors.prefab.button.background};
            color: ${(props) => props.theme.colors.prefab.button.text};
            :hover {
              background: ${(props) =>
                props.theme.colors.prefab.button.hoverBackground};
            }
          }

          &&& svg {
            fill: ${(props) => props.theme.colors.prefab.button.text};
          }
        `
      : ""}

  font-size: 11px;
  width: 100%;
  height: 38px;
  padding: 8px 10px;
  box-sizing: border-box;
  display: flex;
  align-items: center;

  ${PillButton} {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 5px;
  }

  && svg {
    max-height: 10px;
    fill: ${(props) => props.theme.colors.text};
  }
`;
