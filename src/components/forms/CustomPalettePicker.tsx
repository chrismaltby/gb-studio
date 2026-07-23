import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import l10n from "shared/lib/lang/l10n";
import ColorSlider from "./ColorSlider";
import { paletteSelectors } from "store/features/entities/entitiesSelectors";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import { Button } from "ui/buttons/Button";
import styled, { css } from "styled-components";
import { TextField } from "ui/form/TextField";
import { NumberField } from "ui/form/NumberField";
import { EditableText, EditableTextOverlay } from "ui/form/EditableText";
import { TabBar } from "ui/tabs/Tabs";
import API from "renderer/lib/api";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { hexDec } from "shared/lib/helpers/8bit";
import clamp from "shared/lib/helpers/clamp";
import {
  CorrectedHex,
  rgb5BitToGBCHex,
  hex2GBChex,
  rawHexToCorrectedHex,
  rawHexToClosestRepresentableRawHex,
  CanonicalRawHex,
} from "shared/lib/helpers/color";
import { correctedHexToCanonicalHex } from "shared/lib/color/reverseColorCorrection";
import { getSettings } from "store/features/settings/settingsState";

interface CustomPalettePickerProps {
  paletteId: string;
  size?: "normal" | "small";
}

type ColorIndex = 0 | 1 | 2 | 3;

const defaultPaletteColors = ["E8F8E0", "B0F088", "509878", "202850"];
const paletteColorIndexes: ColorIndex[] = [0, 1, 2, 3];
const tabSections = {
  rgb: "RGB",
  hsb: "HSB",
  hex: "Hex",
} as const;

const HSVtoRGB = (h: number, s: number, v: number) => {
  let r = 0;
  let g = 0;
  let b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
    default:
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};

const RGBtoHSV = (r: number, g: number, b: number) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max / 255;

  switch (max) {
    case min:
      h = 0;
      break;
    case r:
      h = (g - b + d * (g < b ? 6 : 0)) / (6 * d);
      break;
    case g:
      h = (b - r + d * 2) / (6 * d);
      break;
    case b:
      h = (r - g + d * 4) / (6 * d);
      break;
    default:
  }

  return { h, s, v };
};

const HSVtoGBCHex = (h: number, s: number, v: number) => {
  const rgb = HSVtoRGB(h, s, v);
  return rgb5BitToGBCHex(
    Math.min(31, Math.round(rgb.r / 8)),
    Math.min(31, Math.round(rgb.g / 8)),
    Math.min(31, Math.round(rgb.b / 8)),
  );
};

const decimalToHexString = (value: number) =>
  value.toString(16).toUpperCase().padStart(2, "0");

const inputValue = (
  eventOrValue: React.ChangeEvent<HTMLInputElement> | number,
) =>
  typeof eventOrValue === "number"
    ? eventOrValue
    : Number(eventOrValue.currentTarget.value);

const isTextEditingTarget = (target: HTMLElement) =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target.isContentEditable;

const Wrapper = styled.div<{ $size: "normal" | "small" }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1000px;
  ${(props) =>
    props.$size === "small"
      ? css`
          max-width: none;
        `
      : ""}
`;

const Header = styled.div<{ $size: "normal" | "small" }>`
  display: flex;
  align-items: center;
  min-width: 0;
  height: ${(props) => (props.$size === "normal" ? "100px" : "auto")};
  margin-bottom: ${(props) => (props.$size === "normal" ? "30px" : "10px")};
  padding: ${(props) => (props.$size === "small" ? "5px 5px 0" : "0")};
`;

const PaletteName = styled.div`
  flex-grow: 1;
  min-width: 0;
`;

const PaletteNameInput = styled(EditableText)<{
  $size: "normal" | "small";
}>`
  font-size: ${(props) => (props.$size === "normal" ? "26px" : "12px")};
  opacity: 0;

  &:focus,
  &:hover {
    opacity: 1;
  }
`;

const PaletteNameOverlay = styled(EditableTextOverlay)<{
  $size: "normal" | "small";
}>`
  background: transparent;
  font-size: ${(props) => (props.$size === "normal" ? "26px" : "12px")};
`;

const ColorsWrapper = styled.div<{ $size: "normal" | "small" }>`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${(props) => (props.$size === "normal" ? "10px" : "0")};
  margin-bottom: ${(props) => (props.$size === "normal" ? "20px" : "10px")};
  padding: ${(props) => (props.$size === "small" ? "0 10px" : "0")};

  ${(props) =>
    props.$size === "small"
      ? css`
          & > *:first-child {
            border-top-left-radius: ${props.theme.borderRadius}px;
            border-bottom-left-radius: ${props.theme.borderRadius}px;
          }

          & > *:last-child {
            border-top-right-radius: ${props.theme.borderRadius}px;
            border-bottom-right-radius: ${props.theme.borderRadius}px;
          }
        `
      : ""}
`;

const ColorValueForm = styled.div<{ $size: "normal" | "small" }>`
  ${(props) =>
    props.$size === "normal"
      ? css`
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        `
      : css`
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 10px 20px 10px 10px;

          label {
            white-space: nowrap;
          }
        `}
`;

const ColorValueSection = styled.div<{
  $size: "normal" | "small";
  $visible: boolean;
}>`
  display: contents;

  ${(props) =>
    props.$size === "small" && !props.$visible
      ? css`
          display: none;
        `
      : ""}
`;

const ColorValueFormItem = styled.div<{ $size: "normal" | "small" }>`
  width: 100%;
  box-sizing: border-box;

  ${(props) =>
    props.$size === "normal"
      ? css`
          display: flex;
          flex-direction: column;

          > *:first-child {
            margin-bottom: 5px;
          }
        `
      : css`
          display: grid;
          grid-template-columns: 105px minmax(0, 1fr);
          align-items: end;
          gap: 8px;
        `}
`;

interface ColorButtonProps {
  $selected?: boolean;
  $size: "normal" | "small";
}

const ColorButton = styled.button<ColorButtonProps>`
  position: relative;
  display: flex;
  justify-content: center;
  text-align: center;
  border: 1px solid ${(props) => props.theme.colors.input.border};
  border-radius: ${(props) => props.theme.borderRadius}px;
  max-height: ${(props) => (props.$size === "normal" ? "128px" : "34px")};
  height: ${(props) => (props.$size === "normal" ? "10vh" : "34px")};
  width: 100%;
  padding: 0;

  span {
    position: absolute;
    top: -25px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    color: ${(props) => props.theme.colors.text};
  }

  ${(props) =>
    props.$size === "normal"
      ? css`
          &:hover {
            box-shadow: 0 0 0 4px ${props.theme.colors.input.border};
          }

          ${
            props.$selected
              ? css`
                  &,
                  &:hover {
                    box-shadow: 0 0 0 4px ${props.theme.colors.highlight};
                  }
                `
              : ""
          }
        `
      : css`
          box-shadow: ${
            props.$selected
              ? `0 0 0 2px ${props.theme.colors.highlight}`
              : "none"
          };
          z-index: ${props.$selected ? "1" : "auto"};

          &:focus {
            box-shadow: ${
              props.$selected
                ? `0 0 0 2px ${props.theme.colors.highlight}`
                : `0 0 0 1px ${props.theme.colors.highlight}`
            };
          }
        `}
`;

const TabWrapper = styled.div`
  border-top: 1px solid ${(props) => props.theme.colors.tabs.border};
  width: 100%;
  display: flex;
  padding: 5px;
`;

const HexField = styled.div<{
  $size: "normal" | "small";
  $visible: boolean;
}>`
  display: ${(props) =>
    props.$size === "small" && !props.$visible ? "none" : "flex"};
  padding: ${(props) => (props.$size === "small" ? "10px" : "0")};
  margin-bottom: ${(props) => (props.$size === "normal" ? "20px" : "0")};
`;

const CustomPalettePicker = ({
  paletteId,
  size = "normal",
}: CustomPalettePickerProps) => {
  const dispatch = useAppDispatch();

  const palette = useAppSelector((state) =>
    paletteSelectors.selectById(state, paletteId),
  );

  const colorCorrection = useAppSelector(
    (state) => getSettings(state).colorCorrection,
  );

  const tab = useAppSelector(
    (state) => state.editor?.paletteEditorTab || "rgb",
  );

  const [selectedColor, setSelectedColor] = useState<ColorIndex>(0);
  const [nameDraft, setNameDraft] = useState(palette?.name || "");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pendingColorUpdateRef = useRef<CanonicalRawHex | null>(null);
  const previousColorKeyRef = useRef<string | null>(null);
  const [colorR, setColorR] = useState(0);
  const [colorG, setColorG] = useState(0);
  const [colorB, setColorB] = useState(0);
  const [colorH, setColorH] = useState(0);
  const [colorS, setColorS] = useState(0);
  const [colorV, setColorV] = useState(0);
  const [colorHex, setColorHex] = useState("000000");
  const [colorCorrectedHex, setColorCorrectedHex] = useState("000000");

  useEffect(() => {
    setNameDraft(palette?.name || "");
  }, [palette?.id, palette?.name]);

  const updateCurrentColor = useCallback(
    (newHex: CanonicalRawHex) => {
      pendingColorUpdateRef.current = newHex;
      dispatch(
        entitiesActions.editPaletteColor({
          paletteId,
          colorId: selectedColor,
          color: newHex,
        }),
      );
    },
    [dispatch, paletteId, selectedColor],
  );

  const updateHexInputs = useCallback((hex: CanonicalRawHex) => {
    setColorHex(hex);
    setColorCorrectedHex(rawHexToCorrectedHex(hex));
  }, []);

  const applyHexToState = useCallback((hex: CanonicalRawHex) => {
    const r = Math.min(31, Math.floor(hexDec(hex.substring(0, 2)) / 8));
    const g = Math.min(31, Math.floor(hexDec(hex.substring(2, 4)) / 8));
    const b = Math.min(31, Math.floor(hexDec(hex.substring(4)) / 8));
    const hsv = RGBtoHSV(r * 8, g * 8, b * 8);

    setColorR(r);
    setColorG(g);
    setColorB(b);
    setColorH(Math.floor(hsv.h * 360));
    setColorS(Math.floor(hsv.s * 100));
    setColorV(Math.floor(hsv.v * 100));
  }, []);

  const initialiseColorValues = useCallback(
    (newColor: string | undefined) => {
      const editHex = rawHexToClosestRepresentableRawHex(
        newColor || defaultPaletteColors[selectedColor],
      );
      updateHexInputs(editHex);
      applyHexToState(editHex);
    },
    [applyHexToState, selectedColor, updateHexInputs],
  );

  const updateColorFromRGB = useCallback(
    (r: number, g: number, b: number) => {
      const hex = rawHexToClosestRepresentableRawHex(
        decimalToHexString(Math.round((r / 31) * 255)) +
          decimalToHexString(Math.round((g / 31) * 255)) +
          decimalToHexString(Math.round((b / 31) * 255)),
      );
      const hsv = RGBtoHSV(r * 8, g * 8, b * 8);
      updateCurrentColor(hex);
      setColorH(Math.floor(hsv.h * 360));
      setColorS(Math.floor(hsv.s * 100));
      setColorV(Math.floor(hsv.v * 100));
      updateHexInputs(hex);
    },
    [updateCurrentColor, updateHexInputs],
  );

  const updateColorFromHSV = useCallback(
    (h: number, s: number, v: number) => {
      const rgb = HSVtoRGB(h / 360, s / 100, v / 100);
      const r = Math.min(31, Math.round(rgb.r / 8));
      const g = Math.min(31, Math.round(rgb.g / 8));
      const b = Math.min(31, Math.round(rgb.b / 8));
      const hex = rawHexToClosestRepresentableRawHex(
        decimalToHexString(r * 8) +
          decimalToHexString(g * 8) +
          decimalToHexString(b * 8),
      );
      updateCurrentColor(hex);
      setColorR(r);
      setColorG(g);
      setColorB(b);
      updateHexInputs(hex);
    },
    [updateCurrentColor, updateHexInputs],
  );

  const onChangeHex = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const croppedValue = event.target.value
        .replace(/[^A-Fa-f0-9]/g, "")
        .substring(0, 6);
      setColorHex(croppedValue);
      const expandedValue =
        croppedValue.length === 3
          ? croppedValue
              .split("")
              .map((character) => character + character)
              .join("")
          : croppedValue;
      if (expandedValue.length === 6) {
        const canonicalHex = rawHexToClosestRepresentableRawHex(expandedValue);
        setColorCorrectedHex(rawHexToCorrectedHex(canonicalHex));
        applyHexToState(canonicalHex);
        updateCurrentColor(canonicalHex);
      }
    },
    [applyHexToState, updateCurrentColor],
  );

  const onChangeCorrectedHex = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const croppedValue = event.target.value
        .replace(/[^A-Fa-f0-9]/g, "")
        .substring(0, 6);
      setColorCorrectedHex(croppedValue);
      const expandedValue =
        croppedValue.length === 3
          ? croppedValue
              .split("")
              .map((character) => character + character)
              .join("")
          : croppedValue;
      if (expandedValue.length === 6) {
        const canonicalHex = correctedHexToCanonicalHex(
          expandedValue as CorrectedHex,
        );
        setColorHex(canonicalHex);
        applyHexToState(canonicalHex);
        updateCurrentColor(canonicalHex);
      }
    },
    [applyHexToState, updateCurrentColor],
  );

  const onChangeR = useCallback(
    (value: React.ChangeEvent<HTMLInputElement> | number) => {
      const next = clamp(inputValue(value), 0, 31);
      setColorR(next);
      updateColorFromRGB(next, colorG, colorB);
    },
    [colorB, colorG, updateColorFromRGB],
  );

  const onChangeG = useCallback(
    (value: React.ChangeEvent<HTMLInputElement> | number) => {
      const next = clamp(inputValue(value), 0, 31);
      setColorG(next);
      updateColorFromRGB(colorR, next, colorB);
    },
    [colorB, colorR, updateColorFromRGB],
  );

  const onChangeB = useCallback(
    (value: React.ChangeEvent<HTMLInputElement> | number) => {
      const next = clamp(inputValue(value), 0, 31);
      setColorB(next);
      updateColorFromRGB(colorR, colorG, next);
    },
    [colorG, colorR, updateColorFromRGB],
  );

  const onChangeH = useCallback(
    (value: React.ChangeEvent<HTMLInputElement> | number) => {
      const next = clamp(inputValue(value), 0, 360);
      setColorH(next);
      updateColorFromHSV(next, colorS, colorV);
    },
    [colorS, colorV, updateColorFromHSV],
  );

  const onChangeS = useCallback(
    (value: React.ChangeEvent<HTMLInputElement> | number) => {
      const next = clamp(inputValue(value), 0, 100);
      setColorS(next);
      updateColorFromHSV(colorH, next, colorV);
    },
    [colorH, colorV, updateColorFromHSV],
  );

  const onChangeV = useCallback(
    (value: React.ChangeEvent<HTMLInputElement> | number) => {
      const next = clamp(inputValue(value), 0, 100);
      setColorV(next);
      updateColorFromHSV(colorH, colorS, next);
    },
    [colorH, colorS, updateColorFromHSV],
  );

  useLayoutEffect(() => {
    const color = palette?.colors[selectedColor];
    const fallbackColor = defaultPaletteColors[selectedColor];
    const colorKey = `${paletteId}:${selectedColor}`;
    const canonicalColor = rawHexToClosestRepresentableRawHex(
      color || fallbackColor,
    );
    const selectionChanged = previousColorKeyRef.current !== colorKey;
    previousColorKeyRef.current = colorKey;

    if (selectionChanged || pendingColorUpdateRef.current !== canonicalColor) {
      initialiseColorValues(color);
    }
    pendingColorUpdateRef.current = null;
  }, [initialiseColorValues, palette?.colors, paletteId, selectedColor]);

  const onColorSelect = useCallback((colorIndex: ColorIndex) => {
    setSelectedColor(colorIndex);
  }, []);

  const onRemove = useCallback(() => {
    dispatch(entitiesActions.removePalette({ paletteId: paletteId }));
  }, [dispatch, paletteId]);

  const onCopy = useCallback(
    (e: ClipboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (isTextEditingTarget(e.target)) {
        return;
      }
      if (
        e.target !== document.body &&
        !wrapperRef.current?.contains(e.target)
      ) {
        return;
      }
      e.preventDefault();
      if (palette) {
        API.clipboard.writeText(palette.colors[selectedColor]);
      }
    },
    [palette, selectedColor],
  );

  const onPaste = useCallback(
    async (e: ClipboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (isTextEditingTarget(e.target)) {
        return;
      }
      if (
        e.target !== document.body &&
        !wrapperRef.current?.contains(e.target)
      ) {
        return;
      }
      e.preventDefault();
      try {
        const clipboardData = await API.clipboard.readText();
        const hexString = clipboardData.replace(/[^A-Fa-f0-9]*/g, "");
        if (hexString.length === 6) {
          updateCurrentColor(rawHexToClosestRepresentableRawHex(hexString));
        }
        initialiseColorValues(hexString);
      } catch {
        // Clipboard isn't pastable, just ignore it
      }
    },
    [initialiseColorValues, updateCurrentColor],
  );

  const onReset = useCallback(() => {
    if (!palette) {
      return;
    }
    initialiseColorValues(palette?.defaultColors?.[selectedColor]);
    dispatch(
      entitiesActions.editPalette({
        paletteId: palette.id,
        changes: {
          colors: palette.defaultColors,
        },
      }),
    );
  }, [dispatch, initialiseColorValues, palette, selectedColor]);

  const onFinishEditName = useCallback(() => {
    if (!palette || palette.defaultColors) {
      return;
    }
    const name = nameDraft || "Palette";
    if (name !== palette.name) {
      dispatch(
        entitiesActions.editPalette({
          paletteId: palette.id,
          changes: { name },
        }),
      );
    }
    setNameDraft(name);
  }, [dispatch, nameDraft, palette]);

  const onKeyDownName = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.currentTarget.blur();
      }
    },
    [],
  );

  useEffect(() => {
    window.addEventListener("copy", onCopy);
    window.addEventListener("paste", onPaste);

    return () => {
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("paste", onPaste);
    };
  });

  if (!palette) {
    return <div />;
  }

  return (
    <Wrapper ref={wrapperRef} $size={size}>
      <Header $size={size}>
        <PaletteName>
          <PaletteNameInput
            $size={size}
            name="name"
            value={nameDraft}
            onChange={
              palette.defaultColors
                ? undefined
                : (event) => setNameDraft(event.currentTarget.value)
            }
            onBlur={palette.defaultColors ? undefined : onFinishEditName}
            onKeyDown={palette.defaultColors ? undefined : onKeyDownName}
            readOnly={!!palette.defaultColors}
          />
          <PaletteNameOverlay $size={size}>
            {nameDraft.replace(/.*[/\\]/, "")}
          </PaletteNameOverlay>
        </PaletteName>
      </Header>

      <ColorsWrapper $size={size}>
        {paletteColorIndexes.map((index) => (
          <ColorButton
            key={index}
            type="button"
            $size={size}
            $selected={selectedColor === index}
            className="focus-visible"
            aria-label={`${palette.name} ${index + 1}`}
            onClick={() => onColorSelect(index)}
            style={{
              background: `#${hex2GBChex(
                palette.colors[index],
                colorCorrection,
              )}`,
            }}
          >
            {size === "normal" && index === 0 && (
              <span>{l10n("FIELD_COLOR_LIGHTEST")}</span>
            )}
            {size === "normal" && index === 3 && (
              <span>{l10n("FIELD_COLOR_DARKEST")}</span>
            )}
          </ColorButton>
        ))}
      </ColorsWrapper>

      {size === "small" && (
        <TabWrapper>
          <TabBar
            variant="eventSection"
            value={tab}
            values={tabSections}
            onChange={(newTab) =>
              dispatch(editorActions.setPaletteEditorTab(newTab))
            }
          />
        </TabWrapper>
      )}

      {(size === "normal" || tab !== "hex") && (
        <ColorValueForm $size={size}>
          <ColorValueSection
            $size={size}
            $visible={size === "normal" || tab === "rgb"}
          >
            <ColorValueFormItem $size={size}>
              <NumberField
                name="colorR"
                label={`${l10n("FIELD_CUSTOM_RED")} (0-31)`}
                type="number"
                value={colorR}
                min={0}
                max={31}
                placeholder="0"
                onChange={onChangeR}
              />
              <ColorSlider
                steps={11}
                value={(colorR || 0) / 31}
                onChange={(value) => onChangeR(Math.round(Number(value) * 31))}
                colorAtValue={(value) =>
                  `#${rgb5BitToGBCHex(Math.round(value * 31), colorG, colorB)}`
                }
              />
            </ColorValueFormItem>

            <ColorValueFormItem $size={size}>
              <NumberField
                name="colorG"
                label={`${l10n("FIELD_CUSTOM_GREEN")} (0-31)`}
                type="number"
                value={colorG}
                min={0}
                max={31}
                placeholder="0"
                onChange={onChangeG}
              />
              <ColorSlider
                steps={11}
                value={(colorG || 0) / 31}
                onChange={(value) => onChangeG(Math.round(value * 31))}
                colorAtValue={(value) =>
                  `#${rgb5BitToGBCHex(colorR, Math.round(value * 31), colorB)}`
                }
              />
            </ColorValueFormItem>

            <ColorValueFormItem $size={size}>
              <NumberField
                name="colorB"
                label={`${l10n("FIELD_CUSTOM_BLUE")} (0-31)`}
                type="number"
                value={colorB}
                min={0}
                max={31}
                placeholder="0"
                onChange={onChangeB}
              />
              <ColorSlider
                steps={11}
                value={(colorB || 0) / 31}
                onChange={(value) => onChangeB(Math.round(value * 31))}
                colorAtValue={(value) =>
                  `#${rgb5BitToGBCHex(colorR, colorG, Math.round(value * 31))}`
                }
              />
            </ColorValueFormItem>
          </ColorValueSection>

          <ColorValueSection
            $size={size}
            $visible={size === "normal" || tab === "hsb"}
          >
            <ColorValueFormItem $size={size}>
              <NumberField
                name="colorHue"
                label={`${l10n("FIELD_HUE")} (0-360)`}
                type="number"
                value={colorH}
                min={0}
                max={360}
                placeholder="0"
                onChange={onChangeH}
              />
              <ColorSlider
                steps={60}
                value={(colorH || 0) / 360}
                onChange={(value) => onChangeH(Math.round(value * 360))}
                colorAtValue={(value) => {
                  const rgb = HSVtoRGB(value, 1, 1);
                  return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
                }}
              />
            </ColorValueFormItem>

            <ColorValueFormItem $size={size}>
              <NumberField
                name="colorSaturation"
                label={`${l10n("FIELD_SATURATION")} (0-100)`}
                type="number"
                value={colorS}
                min={0}
                max={100}
                placeholder="0"
                onChange={onChangeS}
              />
              <ColorSlider
                steps={11}
                value={(colorS || 0) / 100}
                onChange={(value) => onChangeS(Math.round(value * 100))}
                colorAtValue={(value) =>
                  `#${HSVtoGBCHex(colorH / 360, value, colorV / 100)}`
                }
              />
            </ColorValueFormItem>

            <ColorValueFormItem $size={size}>
              <NumberField
                name="colorBrightness"
                label={`${l10n("FIELD_BRIGHTNESS")} (0-100)`}
                type="number"
                value={colorV}
                min={0}
                max={100}
                placeholder="0"
                onChange={onChangeV}
              />
              <ColorSlider
                steps={11}
                value={(colorV || 0) / 100}
                onChange={(value) => onChangeV(Math.round(value * 100))}
                colorAtValue={(value) =>
                  `#${HSVtoGBCHex(colorH / 360, colorS / 100, value)}`
                }
              />
            </ColorValueFormItem>
          </ColorValueSection>
        </ColorValueForm>
      )}

      <HexField $size={size} $visible={size === "normal" || tab === "hex"}>
        <TextField
          name="colorHex"
          label={`${l10n("FIELD_HEX_COLOR")} (${l10n("FIELD_CLOSEST_MATCH")})`}
          size={size === "normal" ? "large" : undefined}
          maxLength={7}
          placeholder="#000000"
          value={`#${
            colorCorrection === "none"
              ? colorHex.toLowerCase()
              : colorCorrectedHex.toLowerCase()
          }`}
          onChange={
            colorCorrection === "none" ? onChangeHex : onChangeCorrectedHex
          }
        />
      </HexField>

      {size === "normal" && (
        <div>
          {palette.defaultColors ? (
            <Button onClick={onReset}>{l10n("FIELD_RESET_PALETTE")}</Button>
          ) : (
            <Button onClick={onRemove}>{l10n("FIELD_REMOVE_PALETTE")}</Button>
          )}
        </div>
      )}
    </Wrapper>
  );
};

export default CustomPalettePicker;
