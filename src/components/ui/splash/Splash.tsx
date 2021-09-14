import React, { useLayoutEffect, useRef, useState, FC } from "react";
import styled, { css, keyframes } from "styled-components";
import { Button } from "../buttons/Button";
import projectIcon from "../icons/gbsproj.png";

declare const VERSION: string;
declare const COMMITHASH: string;

export interface SplashWrapperProps {
  focus: boolean;
}

export const SplashWrapper = styled.div<SplashWrapperProps>`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  ${(props) =>
    props.focus === false
      ? css`
          opacity: 0.75;
          -webkit-filter: grayscale(100%);
        `
      : ""}
`;

export const SplashSidebar = styled.div`
  display: flex;
  flex-direction: column;
  background: ${(props) => props.theme.colors.sidebar.background};
  width: 200px;
  height: 100%;
  flex-shrink: 0;
  -webkit-app-region: drag;
`;

export const SplashContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: ${(props) => props.theme.colors.document.background};
  color: ${(props) => props.theme.colors.text};
  padding: 20px;
  flex-grow: 1;
  -webkit-app-region: drag;
  input,
  select,
  button {
    -webkit-app-region: no-drag;
  }
`;

export const SplashForm = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

export const SplashLogo = styled.div`
  position: relative;
  margin: 35px 20px 0;
  transition: transform 0.2s ease-in-out;

  img {
    width: 100%;
  }

  :hover {
    transform: scale(1.05);
  }
`;

export const SplashEasterEggButton = styled.button`
  position: absolute;
  left: 18px;
  top: 52px;
  width: 20px;
  height: 20px;
  border-radius: 20px;
  background-color: transparent;
  border: 0;
  -webkit-app-region: no-drag;
  cursor: pointer;

  :hover {
    background: radial-gradient(
      circle,
      rgba(251, 63, 139, 0.2) 0%,
      rgba(252, 70, 107, 0) 100%
    );
  }

  :active {
    background: radial-gradient(
      circle,
      rgba(251, 63, 139, 0.6) 0%,
      rgba(252, 70, 107, 0) 100%
    );
  }
`;

export const SplashAppTitleWrapper = styled.div`
  color: ${(props) => props.theme.colors.secondaryText};
  font-size: 11px;
  text-align: center;
  margin-bottom: 20px;
  div {
    user-select: text;
  }
`;

export const SplashAppTitle = () => {
  const [showCommit, setShowCommit] = useState(false);
  const displayCommit = () => setShowCommit(true);
  return (
    <SplashAppTitleWrapper onClick={displayCommit}>
      {showCommit ? (
        <div>
          {VERSION} ({COMMITHASH})
        </div>
      ) : (
        `GB Studio ${VERSION}`
      )}
    </SplashAppTitleWrapper>
  );
};

interface SplashTabProps {
  selected?: boolean;
}

export const SplashTab = styled.button<SplashTabProps>`
  font-size: 13px;
  padding: 8px 20px;
  text-align: left;
  color: ${(props) => props.theme.colors.text};
  background: transparent;
  border: 0;
  -webkit-app-region: no-drag;

  :hover {
    background: rgba(128, 128, 128, 0.3);
  }

  :active {
    background: rgba(128, 128, 128, 0.4);
  }

  ${(props) => (props.selected ? SplashTabSelectedStyles : "")}
`;

const SplashTabSelectedStyles = css`
  background: ${(props) => props.theme.colors.highlight};
  color: #fff;

  :hover {
    background: ${(props) => props.theme.colors.highlight};
    color: #fff;
  }
  :active {
    background: ${(props) => props.theme.colors.highlight};
    color: #fff;
  }
`;

export const SplashOpenButton = styled(Button).attrs(() => ({
  variant: "transparent",
}))`
  color: ${(props) => props.theme.colors.text};
  justify-content: flex-start;
  padding: 5px;
  margin: 15px;
  -webkit-app-region: no-drag;
`;

export interface Template {
  id: string;
  name: string;
  preview: string;
  videoPreview: boolean;
  description: string;
}

export interface SplashTemplateSelectProps {
  templates: Template[];
  name: string;
  value: string;
  onChange: (newValue: string) => void;
}

export const SplashTemplateSelectWrapper = styled.div`
  width: 100%;
`;

export const SplashTemplateSelectOptions = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-bottom: 5px;

  & > * {
    margin-right: 10px;
  }
`;

export const SplashTemplateButtonWrapper = styled.div`
  position: relative;
`;

export const SplashTemplateButton = styled.input.attrs({
  type: "radio",
})`
  width: 80px;
  height: 80px;
  margin: 0;
  padding: 0;
  border-radius: ${(props) => props.theme.borderRadius}px;
  -webkit-appearance: none;
  :focus {
    box-shadow: 0 0 0px 4px ${(props) => props.theme.colors.highlight};
  }
`;

export const SplashTemplateLabel = styled.label`
  position: absolute;
  top: 0;
  left: 0;
  width: 80px;
  height: 80px;
  background-color: #fff;
  border: 2px solid ${(props) => props.theme.colors.input.background};
  border-radius: ${(props) => props.theme.borderRadius}px;
  -webkit-appearance: none;
  box-sizing: border-box;

  img,
  video {
    width: 100%;
    height: 100%;
  }

  ${SplashTemplateButton}:checked + & {
    border: 2px solid ${(props) => props.theme.colors.highlight};
    box-shadow: 0 0 0px 2px ${(props) => props.theme.colors.highlight};
  }
`;

export const SplashTemplateName = styled.div`
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 5px;
`;

export const SplashTemplateDescription = styled.div`
  font-size: 11px;
`;

interface SplashTemplateVideoProps {
  src: string;
  playing: boolean;
}

export const SplashTemplateVideo: FC<SplashTemplateVideoProps> = ({
  src,
  playing,
}) => {
  const ref = useRef<HTMLVideoElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      if (playing) {
        ref.current?.play();
      } else {
        ref.current?.pause();
      }
    }
  }, [playing, ref]);

  return <video ref={ref} src={src} muted loop />;
};

export const SplashTemplateSelect: FC<SplashTemplateSelectProps> = ({
  templates,
  name,
  value,
  onChange,
}) => {
  const selectedTemplate = templates.find((template) => template.id === value);
  return (
    <SplashTemplateSelectWrapper>
      <SplashTemplateSelectOptions>
        {templates.map((template) => (
          <SplashTemplateButtonWrapper key={template.id}>
            <SplashTemplateButton
              id={`${name}_${template.id}`}
              name={name}
              value={template.id}
              checked={template.id === value}
              onChange={() => onChange(template.id)}
            />
            <SplashTemplateLabel
              htmlFor={`${name}_${template.id}`}
              title={template.name}
            >
              {template.videoPreview ? (
                <SplashTemplateVideo
                  src={template.preview}
                  playing={template.id === value}
                />
              ) : (
                <img src={template.preview} alt={template.name} />
              )}
            </SplashTemplateLabel>
          </SplashTemplateButtonWrapper>
        ))}
      </SplashTemplateSelectOptions>
      {selectedTemplate && (
        <>
          <SplashTemplateName>{selectedTemplate.name}</SplashTemplateName>
          <SplashTemplateDescription>
            {selectedTemplate.description}
          </SplashTemplateDescription>
        </>
      )}
    </SplashTemplateSelectWrapper>
  );
};

export const SplashCreateButton = styled.div`
  padding: 0px 10px;
`;

const SplashCreditsFadeAnimation = keyframes`
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
`;

export const SplashCredits = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: none;
  animation: ${SplashCreditsFadeAnimation} 1s linear;
  animation-fill-mode: forwards;
  -webkit-app-region: drag;
`;

export const SplashCreditsBackground = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      const c = ref.current;
      const ctx = c.getContext("2d");
      let time = 0;

      const render = () => {
        const width = 640;
        const height = 400;
        if (ref.current && ctx) {
          // Create gradient
          const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
          bgGrad.addColorStop(0, "#221e6a");
          bgGrad.addColorStop(0.25, "#bb205a");
          bgGrad.addColorStop(0.5, "#ce1e32");
          bgGrad.addColorStop(0.75, "#bb205a");
          bgGrad.addColorStop(1, "#221e6a");

          // Fill with gradient
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, width, height);

          const lineGrad = ctx.createLinearGradient(0, 0, 0, height);
          lineGrad.addColorStop(0, "#e79c58");
          lineGrad.addColorStop(0.25, "#e5731b");
          lineGrad.addColorStop(0.4, "#ce1e32");
          lineGrad.addColorStop(0.5, "#ce1e32");
          lineGrad.addColorStop(0.6, "#ce1e32");
          lineGrad.addColorStop(0.75, "#e5731b");
          lineGrad.addColorStop(1, "#e79c58");

          ctx.strokeStyle = lineGrad;
          ctx.lineWidth = 2;

          for (let i = -8; i < 16; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 80, 0);
            ctx.lineTo(width * 0.5, height * 0.5);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(i * 80, height);
            ctx.lineTo(width * 0.5, height * 0.5);
            ctx.stroke();
          }

          for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            ctx.moveTo(0, height * 0.5 - (height * 0.5) / (-time + i * 0.5));
            ctx.lineTo(
              width,
              height * 0.5 - (height * 0.5) / (-time + i * 0.5)
            );
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, height * 0.5 + (height * 0.5) / (-time + i * 0.5));
            ctx.lineTo(
              width,
              height * 0.5 + (height * 0.5) / (-time + i * 0.5)
            );
            ctx.stroke();
          }

          if (time > 0.5) {
            time = 0;
          }

          time += 0.005;

          requestAnimationFrame(render);
        }
      };

      render();
    }
  }, [ref]);

  return <canvas ref={ref} width={640} height={400}></canvas>;
};

const SplashCreditsAnimation = keyframes`
  from {
    transform: translateY(0px);
  }

  to {
    transform: translateY(-200%);
  }
`;

export const SplashCreditsContent = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  animation: ${SplashCreditsAnimation} 150s linear infinite;
`;

export const SplashCreditsCloseButton = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;

  & > * {
    height: 100%;
  }

  ${Button} {
    padding: 0 5px;
    margin: 0;
  }

  ${Button} svg {
    fill: #fff;
    width: 16px;
    max-width: none;
  }
`;

export const SplashCreditsTitle = styled.div`
  display: block;
  color: #fff;
  font-size: 40px;
  font-weight: bold;
  text-decoration: none;
  margin-bottom: 80px;
`;

export const SplashCreditsContributorWrapper = styled.div`
  display: block;
  color: #fff;
  font-size: 20px;
  text-decoration: none;
  margin-bottom: 30px;

  :hover {
    color: #ffff00;
    cursor: pointer;
  }
`;

export interface SplashCreditsContributorProps {
  contributor: {
    login: string;
    contributions: number;
  };
  onClick: () => void;
}

export const SplashCreditsContributor: FC<SplashCreditsContributorProps> = ({
  contributor,
  onClick,
}) => (
  <SplashCreditsContributorWrapper onClick={onClick}>
    {contributor.login}
  </SplashCreditsContributorWrapper>
);

export const SplashScroll = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  background: ${(props) => props.theme.colors.document.background};
  color: ${(props) => props.theme.colors.text};
  position: relative;

  h2 {
    margin-top: 0;
  }
`;

export const SplashInfoMessage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 13px;
  box-sizing: border-box;
  padding: 30px;
  text-align: center;
`;

export const SplashProjectClearButton = styled.div`
  display: flex;
  justify-content: center;
  padding: 30px;
`;

export interface SplashProjectProps {
  project: {
    name: string;
    path: string;
  };
  onClick: () => void;
}

export const SplashProjectWrapper = styled.button`
  display: flex;
  text-align: left;
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.text};
  border: 0;
  border-bottom: 1px solid ${(props) => props.theme.colors.input.border};
  border-radius: 0px;
  padding: 15px 30px;
  width: 100%;

  img {
    width: 42px;
    margin-right: 10px;
  }

  :hover {
    background: ${(props) => props.theme.colors.input.hoverBackground};
  }

  :active {
    background: ${(props) => props.theme.colors.input.activeBackground};
  }

  :last-child {
    margin-bottom: 0;
  }
`;

export const SplashProjectDetails = styled.span`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const SplashProjectName = styled.span`
  display: block;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SplashProjectPath = styled.span`
  display: block;
  font-size: 11px;
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SplashProject: FC<SplashProjectProps> = ({ project, onClick }) => (
  <SplashProjectWrapper onClick={onClick}>
    <img src={projectIcon} alt="" />
    <SplashProjectDetails>
      <SplashProjectName>{project.name}</SplashProjectName>
      <SplashProjectPath>{project.path}</SplashProjectPath>
    </SplashProjectDetails>
  </SplashProjectWrapper>
);
