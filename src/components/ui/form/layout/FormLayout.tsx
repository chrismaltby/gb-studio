import React, { FC, ReactNode, useState } from "react";
import { Label } from "ui/form/Label";
import {
  StyledFormContainer,
  StyledFormDivider,
  StyledFormField,
  StyledFormFieldInfo,
  StyledFormFieldInput,
  StyledFormHeader,
  StyledFormLink,
  StyledFormRow,
  StyledFormSectionTitle,
} from "ui/form/layout/style";

interface FormContainerProps {
  children: ReactNode;
}

export const FormContainer = ({ children }: FormContainerProps) => (
  <StyledFormContainer children={children} />
);

interface FormHeaderProps {
  variant?: "normal" | "prefab";
  children: ReactNode;
}

export const FormHeader = ({ children, variant }: FormHeaderProps) => (
  <StyledFormHeader $variant={variant} children={children} />
);

interface FormRowProps {
  children: ReactNode;
}

export const FormRow = ({ children }: FormRowProps) => (
  <StyledFormRow children={children} />
);

export const FormDivider = () => <StyledFormDivider />;

interface FormFieldInfoProps {
  children: ReactNode;
}

export const FormFieldInfo = ({ children }: FormFieldInfoProps) => (
  <StyledFormFieldInfo children={children} />
);

export interface FormFieldProps {
  readonly name: string;
  readonly label?: string | React.ReactNode;
  readonly title?: string;
  readonly info?: string;
  readonly alignCheckbox?: boolean;
  readonly variant?: "normal" | "error" | "warning";
  readonly hasOverride?: boolean;
  readonly children?: ReactNode;
}

export const FormField: FC<FormFieldProps> = ({
  name,
  label,
  title,
  info,
  variant,
  alignCheckbox,
  hasOverride,
  children,
}: FormFieldProps) => (
  <StyledFormField
    $variant={variant}
    $alignCheckbox={alignCheckbox}
    $hasOverride={hasOverride}
  >
    {label && (
      <Label htmlFor={name} title={title}>
        {label}
      </Label>
    )}
    <StyledFormFieldInput $hasOverride={hasOverride}>
      {children}
    </StyledFormFieldInput>
    {info && <StyledFormFieldInfo>{info}</StyledFormFieldInfo>}
  </StyledFormField>
);

interface FormSectionTitleProps {
  readonly noTopBorder?: boolean;
  readonly noMarginBottom?: boolean;
  children: ReactNode;
}

export const FormSectionTitle = ({
  noTopBorder,
  noMarginBottom,
  children,
}: FormSectionTitleProps) => (
  <StyledFormSectionTitle
    $noTopBorder={noTopBorder}
    $noMarginBottom={noMarginBottom}
    children={children}
  />
);

interface ToggleableFormFieldProps {
  readonly enabled: boolean;
  readonly disabledLabel: string | React.ReactNode;
}

export const ToggleableFormField: FC<
  ToggleableFormFieldProps & FormFieldProps
> = ({
  enabled,
  disabledLabel,
  name,
  label,
  info,
  variant,
  hasOverride,
  children,
}) => {
  const [isEnabled, setIsEnabled] = useState(enabled);

  if (!isEnabled) {
    return (
      <div>
        <StyledFormLink onClick={() => setIsEnabled(true)}>
          {disabledLabel}
        </StyledFormLink>
      </div>
    );
  }

  return (
    <FormField
      name={name}
      label={label}
      info={info}
      variant={variant}
      hasOverride={hasOverride}
    >
      {children}
    </FormField>
  );
};
