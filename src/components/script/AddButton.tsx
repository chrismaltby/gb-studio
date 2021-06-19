import l10n from "lib/helpers/l10n";
import React from "react";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";

const Wrapper = styled.div`
  display: flex;
  padding: 10px;
  background: #fff;

  ${Button} {
    width: 100%;
  }
`;

const AddButton = () => {
  return (
    <Wrapper>
      <Button>{l10n("SIDEBAR_ADD_EVENT")}</Button>
    </Wrapper>
  );
};

export default AddButton;
