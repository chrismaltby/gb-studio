import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import { Input } from "./Input";

export const InputGroup = styled.div`
  display: flex;
  width: 100%;
  ${Input} {
    &:not(:first-child) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
    &:not(:last-child) {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
`;

export const InputGroupPrepend = styled.div`
  ${Button} {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right: 0;
  }
`;

export const InputGroupAppend = styled.div`
  ${Button} {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: 0;
  }
`;
