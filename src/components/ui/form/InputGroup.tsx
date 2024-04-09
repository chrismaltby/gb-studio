import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import { Input } from "./Input";
import { Select } from "ui/form/Select";

export const InputGroup = styled.div`
  display: flex;
  width: 100%;

  & > div:not(:first-child) ${Input} {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  & > div:not(:first-child) ${Select} .CustomSelect__control {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  & > div:not(:first-child) .MentionsInput__control textarea {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  & > div:not(:last-child) ${Input} {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  & > div:not(:last-child) ${Select} .CustomSelect__control {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  & > div:not(:last-child) .MentionsInput__control textarea {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
`;

export const InputGroupPrepend = styled.div`
  ${Button} {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right: 0;
    height: 28px;
  }
`;

export const InputGroupAppend = styled.div`
  ${Button} {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: 0;
    height: 28px;
  }
`;
