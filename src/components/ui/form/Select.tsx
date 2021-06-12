import styled from "styled-components";
import WindowedSelect from "react-windowed-select";
import CRSelect from "react-select/creatable";
import React, { CSSProperties, FC, ReactNode } from "react";
import { setDefault } from "lib/helpers/setDefault";
import { SearchIcon } from "../icons/Icons";
import l10n from "lib/helpers/l10n";
export { components } from "react-select";

export interface Option {
  value: string;
  label: string;
}

export interface OptGroup {
  label: string;
  options: Option[];
}

interface OptionLabelWithPreviewProps {
  preview: ReactNode;
  children: ReactNode;
}

interface OptionLabelWithInfoProps {
  info: ReactNode;
  children: ReactNode;
}

interface SingleValueWithPreviewProps {
  preview: ReactNode;
  children: ReactNode;
}

export interface SelectCommonProps {
  placeholder?: string;
  autoFocus?: boolean;
  menuIsOpen?: boolean;
  backspaceRemovesValue?: boolean;
  controlShouldRenderValue?: boolean;
  isClearable?: boolean;
  onBlur?: () => void;
  maxMenuHeight?: number;
  menuPlacement?: "auto" | "bottom" | "top";
  menuPortalTarget?: HTMLElement | null;
}

const menuPortalEl = document.getElementById("MenuPortal");

export const Select = styled(WindowedSelect).attrs((props) => ({
  classNamePrefix: "CustomSelect",
  styles: {
    option: (base: CSSProperties) => ({
      ...base,
      height: 26,
    }),
  },
  inputId: props.name,
  menuPlacement: "auto",
  menuPortalTarget: setDefault(props.menuPortalTarget, menuPortalEl),
}))`
  .CustomSelect__control {
    height: 28px;
    min-height: 28px;
    background: ${(props) => props.theme.colors.input.background};
    color: ${(props) => props.theme.colors.input.text};
    border: 1px solid ${(props) => props.theme.colors.input.border};
    font-size: 11px;
    border-radius: ${(props) => props.theme.borderRadius}px;
  }

  .CustomSelect__control:hover {
    border: 1px solid ${(props) => props.theme.colors.input.border};
  }

  .CustomSelect__control--is-focused {
    outline: none;
    border: 1px solid ${(props) => props.theme.colors.highlight} !important;
    box-shadow: 0 0 0px 2px ${(props) => props.theme.colors.highlight} !important;
    transition: box-shadow 0.2s cubic-bezier(0.175, 0.885, 0.71, 2.65);
  }

  .CustomSelect__value-container {
    padding: 0 3px;
  }

  .CustomSelect__single-value {
    color: ${(props) => props.theme.colors.input.text};
  }

  .CustomSelect__placeholder {
    margin: 0;
    margin-left: 2px;
  }

  .CustomSelect__indicator-separator {
    display: none;
  }

  .CustomSelect__dropdown-indicator {
    padding: 0;
    width: 20px;
    display: flex;
    justify-content: center;
  }

  .CustomSelect__dropdown-indicator svg {
    width: 16px;
    height: 16px;
  }

  .CustomSelect__menu-list {
    background: ${(props) => props.theme.colors.menu.background};
    color: ${(props) => props.theme.colors.text};
    font-size: ${(props) => props.theme.typography.menuFontSize};
    border-radius: 4px;
  }

  .CustomSelect__option {
    padding: 5px 10px;
    background: ${(props) => props.theme.colors.menu.background};
  }

  .CustomSelect__option--is-selected {
    color: ${(props) => props.theme.colors.highlight};
  }

  .CustomSelect__option--is-focused {
    background: ${(props) => props.theme.colors.menu.hoverBackground};
  }

  .CustomSelect__option:active {
    background: ${(props) => props.theme.colors.menu.activeBackground};
  }

  &.CustomSelect--is-disabled {
    opacity: 0.5;
  }

  input:focus {
    box-shadow: none !important;
  }
`;

const ValuePreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;

  canvas {
    max-width: 22px;
    max-height: 22px;
    image-rendering: auto !important;
  }
`;

const OptionLabelWithPreviewWrapper = styled.div`
  display: flex;
  white-space: nowrap;
  align-items: center;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const OptionLabelPreview = styled.div`
  height: 1px;
  margin-right: 2px;

  svg {
    max-width: 14px;
  }
`;

const OptionLabelPreviewOffset = styled.div`
  transform: translate(-3px, -10px);
`;

const OptionLabelWithInfoWrapper = styled.div`
  display: flex;
  white-space: nowrap;
  align-items: center;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const OptionLabelInfo = styled.div`
  flex-grow: 1;
  text-align: right;
  opacity: 0.5;
  font-size: 0.8em;
`;

export const OptionLabelWithPreview: FC<OptionLabelWithPreviewProps> = ({
  preview,
  children,
}) => (
  <OptionLabelWithPreviewWrapper>
    <OptionLabelPreview>
      <OptionLabelPreviewOffset>
        <ValuePreview>{preview}</ValuePreview>
      </OptionLabelPreviewOffset>
    </OptionLabelPreview>
    {children}
  </OptionLabelWithPreviewWrapper>
);

export const OptionLabelWithInfo: FC<OptionLabelWithInfoProps> = ({
  info,
  children,
}) => (
  <OptionLabelWithInfoWrapper>
    {children}
    <OptionLabelInfo>{info}</OptionLabelInfo>
  </OptionLabelWithInfoWrapper>
);

const SingleValueWithPreviewWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 5px;
  right: 0;
  bottom: 0;
  display: flex;
  white-space: nowrap;
  align-items: center;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SingleValuePreview = styled.div`
  height: 1px;
  margin-right: 2px;

  svg {
    max-width: 14px;
  }
`;

const SingleValuePreviewOffset = styled.div`
  transform: translate(-3px, -11px);
`;

export const SingleValueWithPreview: FC<SingleValueWithPreviewProps> = ({
  preview,
  children,
}) => (
  <SingleValueWithPreviewWrapper>
    <SingleValuePreview>
      <SingleValuePreviewOffset>
        <ValuePreview>{preview}</ValuePreview>
      </SingleValuePreviewOffset>
    </SingleValuePreview>
    {children}
  </SingleValueWithPreviewWrapper>
);

export const selectMenuStyleProps = {
  autoFocus: true,
  menuIsOpen: true,
  placeholder: l10n("TOOLBAR_SEARCH"),
  backspaceRemovesValue: false,
  controlShouldRenderValue: false,
  isClearable: false,
  menuPortalTarget: null,
  components: { DropdownIndicator: () => <SearchIcon /> },
};

export const SelectMenu = styled.div`
  background: ${(props) => props.theme.colors.menu.background};
  border-radius: ${(props) => props.theme.borderRadius}px;
  box-shadow: ${(props) => props.theme.colors.menu.boxShadow};
  margin-top: 5px;
  padding-top: 5px;

  .CustomSelect__control {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    min-width: 240px;
    margin: 5px;
    margin-top: 0;

    svg {
      width: 12px;
      height: 12px;
      margin-right: 5px;
      fill: #999;
    }
  }

  .CustomSelect__menu {
    margin: 0;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    border-top: 0;
    position: static;
    box-shadow: none;
    background-color: transparent;
  }
`;

export const CreatableSelect = styled(CRSelect).attrs((props) => ({
  classNamePrefix: "CustomSelect",
  styles: {
    option: (base: CSSProperties) => ({
      ...base,
      height: 26,
    }),
  },
  inputId: props.name,
  menuPlacement: "auto",
  menuPortalTarget: setDefault(props.menuPortalTarget, menuPortalEl),
}))`
  .CustomSelect__control {
    height: 28px;
    min-height: 28px;
    background: ${(props) => props.theme.colors.input.background};
    color: ${(props) => props.theme.colors.input.text};
    border: 1px solid ${(props) => props.theme.colors.input.border};
    font-size: 11px;
    border-radius: ${(props) => props.theme.borderRadius}px;
  }

  .CustomSelect__control:hover {
    border: 1px solid ${(props) => props.theme.colors.input.border};
  }

  .CustomSelect__control--is-focused {
    outline: none;
    border: 1px solid ${(props) => props.theme.colors.highlight} !important;
    box-shadow: 0 0 0px 2px ${(props) => props.theme.colors.highlight} !important;
    transition: box-shadow 0.2s cubic-bezier(0.175, 0.885, 0.71, 2.65);
  }

  .CustomSelect__value-container {
    padding: 0 3px;
  }

  .CustomSelect__single-value {
    color: ${(props) => props.theme.colors.input.text};
  }

  .CustomSelect__placeholder {
    margin: 0;
    margin-left: 2px;
  }

  .CustomSelect__indicator-separator {
    display: none;
  }

  .CustomSelect__dropdown-indicator {
    padding: 0;
    width: 20px;
    display: flex;
    justify-content: center;
  }

  .CustomSelect__dropdown-indicator svg {
    width: 16px;
    height: 16px;
  }

  .CustomSelect__menu-list {
    background: ${(props) => props.theme.colors.menu.background};
    color: ${(props) => props.theme.colors.text};
    font-size: ${(props) => props.theme.typography.menuFontSize};
    border-radius: 4px;
  }

  .CustomSelect__option {
    padding: 5px 10px;
    background: ${(props) => props.theme.colors.menu.background};
  }

  .CustomSelect__option--is-selected {
    color: ${(props) => props.theme.colors.highlight};
  }

  .CustomSelect__option--is-focused {
    background: ${(props) => props.theme.colors.menu.hoverBackground};
  }

  .CustomSelect__option:active {
    background: ${(props) => props.theme.colors.menu.activeBackground};
  }

  &.CustomSelect--is-disabled {
    opacity: 0.5;
  }

  input:focus {
    box-shadow: none !important;
  }
`;
