import styled from "styled-components";
import CRSelect from "react-select/creatable";
import React, { FC, JSX, ReactNode } from "react";
import { setDefault } from "shared/lib/helpers/setDefault";
import { SearchIcon } from "ui/icons/Icons";
import L10NText from "./L10NText";
import API from "renderer/lib/api";
import { SelectWindowed } from "./SelectWindowed";

export interface Option {
  value: string;
  label: string;
}

export interface OptGroup {
  label: string;
  options: Option[];
}

export const findSelectOption = <TOption extends Option>(
  options: readonly (TOption | { options: readonly TOption[] })[],
  value: string | undefined,
): TOption | undefined =>
  options
    .flatMap((option) => ("options" in option ? option.options : option))
    .find((option) => option.value === value);

interface OptionLabelWithPreviewProps {
  preview: ReactNode;
  info?: ReactNode;
  children: ReactNode;
}

interface OptionLabelWithInfoProps {
  info: ReactNode;
  children: ReactNode;
}

interface SingleValueWithPreviewProps {
  preview?: ReactNode;
  children: ReactNode;
}

interface FormatFolderLabelProps {
  label?: string;
}

export interface SelectCommonProps {
  placeholder?: JSX.Element;
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

export const Select: typeof SelectWindowed = styled(SelectWindowed).attrs(
  (props) => {
    const rowHeight = API.env === "web" && window.innerWidth < 840 ? 38 : 26;
    const groupHeadingHeight = 28.75;
    return {
      className: "CustomSelect",
      classNamePrefix: props.classNamePrefix
        ? `${props.classNamePrefix} CustomSelect`
        : "CustomSelect",
      styles: {
        option: (base) => ({
          ...base,
          height: rowHeight,
        }),
        group: (base) => ({
          ...base,
          paddingTop: 0,
          paddingBottom: 0,
        }),
        groupHeading: (base) => ({
          ...base,
          display: "flex",
          alignItems: "center",
          height: groupHeadingHeight,
          marginBottom: 0,
        }),
        menuList: (base) => ({
          ...base,
          paddingTop: 0,
          paddingBottom: 0,
        }),
      },
      inputId: props.name,
      menuPlacement: props.menuPlacement ?? "auto",
      menuPortalTarget: setDefault(props.menuPortalTarget, menuPortalEl),
      windowThreshold: 0,
    };
  },
)`
  position: relative;
  width: 100%;
  min-width: 78px;

  .CustomSelect__control {
    height: 28px;
    min-height: 28px;
    background: ${(props) => props.theme.colors.input.background};
    color: ${(props) => props.theme.colors.input.text};
    border: 1px solid ${(props) => props.theme.colors.input.border};
    font-size: ${(props) => props.theme.typography.fontSize};
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
    width: 100%;
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

  .CustomSelect__input {
    color: ${(props) => props.theme.colors.text};
  }

  input:focus {
    box-shadow: none !important;
  }

  ${() =>
    API.env === "web" &&
    `@media (max-width: 840px) {
    .CustomSelect__control {
      height: 38px;
      font-size: 14px;
    }

    .CustomSelect__option {
      padding: 10px;
      font-size: 14px;
    }
  }`}
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
  }
`;

export const OptionLabelHoverContent = styled.div`
  flex-shrink: 0;
  opacity: 0;
  .CustomSelect__option:hover & {
    opacity: 1;
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
  justify-content: space-between;
`;

const OptionLabelInfo = styled.div`
  flex-grow: 1;
  text-align: right;
  opacity: 0.5;
  font-size: 0.8em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: no-wrap;
  padding-left: 5px;
`;

export const OptionLabelWithPreview: FC<OptionLabelWithPreviewProps> = ({
  preview,
  info,
  children,
}) => (
  <OptionLabelWithPreviewWrapper>
    <OptionLabelPreview>
      <OptionLabelPreviewOffset>
        <ValuePreview>{preview}</ValuePreview>
      </OptionLabelPreviewOffset>
    </OptionLabelPreview>
    {children}
    {info && <OptionLabelInfo>{info}</OptionLabelInfo>}
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

export const FormatFolderLabel = ({ label }: FormatFolderLabelProps) => {
  if (!label) {
    return null;
  }
  const filePart = label.replace(/.*[\\/]/g, "");
  const pathPart = label.slice(0, -filePart.length);
  return (
    <span>
      {pathPart.length > 0 && <span>{pathPart}</span>}
      {filePart}
    </span>
  );
};

export const SingleValueWithPreview: FC<SingleValueWithPreviewProps> = ({
  preview,
  children,
}) => (
  <SingleValueWithPreviewWrapper>
    {preview && (
      <SingleValuePreview>
        <SingleValuePreviewOffset>
          <ValuePreview>{preview}</ValuePreview>
        </SingleValuePreviewOffset>
      </SingleValuePreview>
    )}
    {children}
  </SingleValueWithPreviewWrapper>
);

export const selectMenuStyleProps = {
  autoFocus: true,
  menuIsOpen: true,
  placeholder: <L10NText l10nKey="TOOLBAR_SEARCH" />,
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

export const CreatableSelect: typeof CRSelect = styled(CRSelect).attrs(
  (props) => ({
    className: "CustomSelect",
    classNamePrefix: props.classNamePrefix
      ? `${props.classNamePrefix} CustomSelect`
      : "CustomSelect",
    styles: {
      option: (base) => ({
        ...base,
        height: 26,
      }),
    },
    inputId: props.name,
    menuPlacement: "auto",
    menuPortalTarget: setDefault(props.menuPortalTarget, menuPortalEl),
  }),
)`
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
