import React from "react";
import l10n from "shared/lib/lang/l10n";
import styled from "styled-components";

const WorldHelpArrow = styled.div`
  position: absolute;
  top: 65px;
  left: 53px;
  transform: scaleY(-1);
`;

const WorldHelpLabel = styled.div`
  position: absolute;
  top: 100px;
  left: 110px;
  width: 150px;
  font-size: 150%;
  color: #808080;
`;

const WorldHelp = () => (
  <div>
    <WorldHelpArrow>
      <svg width="51px" height="40px" viewBox="0 0 51 35">
        <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
          <g
            transform="translate(-119.000000, -101.000000)"
            fill="#808080"
            fillRule="nonzero"
          >
            <path d="M132.412744,130.5362 C150.219646,125.610353 158.777797,119.18968 167.887402,104.473658 L169.587949,105.526342 C160.196023,120.698435 151.208452,127.423763 132.860131,132.487487 L134.210284,138.376199 L119,134.681981 L131.081545,124.730284 L132.412728,130.536205 Z" />
          </g>
        </g>
      </svg>
    </WorldHelpArrow>
    <WorldHelpLabel>{l10n("FIELD_START_BY_ADDING_SCENE")}</WorldHelpLabel>
  </div>
);

export default WorldHelp;
