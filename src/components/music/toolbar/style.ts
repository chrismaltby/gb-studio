import styled from "styled-components";
import { StyledMenu } from "ui/menu/style";

export const StyledExportPanel = styled(StyledMenu)`
  min-width: 220px;
  padding: 10px 0 0 0;
  & > *:last-child {
    margin-top: 10px;
  }
`;
