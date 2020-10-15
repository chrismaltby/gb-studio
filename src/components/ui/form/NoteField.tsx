import styled from "styled-components";

export const NoteField = styled.textarea`
  background-color: #bef0f3;
  border: 1px solid #61bae4;
  border-radius: 0;
  width: 100%;
  box-sizing: border-box;
  box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.2);
  padding: 10px;
  margin-bottom: 10px;
  font-family: "Courier New", Courier, monospace;
  resize: vertical;

  :focus {
    box-shadow: 0 0 0px 2px #2686b3 !important;
  }
`;
