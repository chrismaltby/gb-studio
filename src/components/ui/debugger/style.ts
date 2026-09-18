import styled from "styled-components";

export const StyledDebuggerUsageCardHeader = styled.div`
  display: flex;
  align-items: center;
  height: 26px;
  margin-bottom: 10px;
`;

export const StyledDebuggerUsageCardTitle = styled.h3`
  margin: 0;
  font-size: 13px;
`;

export const StyledRegionUsageTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  th,
  td {
    padding: 5px 8px;
    border-bottom: 1px solid ${(props) => props.theme.colors.card.divider};
    text-align: right;
    text-overflow: ellipsis;
    overflow: hidden;
    vertical-align: middle;
  }

  th:first-child,
  td:first-child {
    width: 50%;
    text-align: left;
  }

  tbody tr:hover {
    background: ${(props) => props.theme.colors.list.activeBackground};
  }
`;

export const StyledBankOverflowLabel = styled.span`
  background: #f00;
  color: #fff;
  border-radius: 4px;
  outline: 2px solid #f00;
`;
