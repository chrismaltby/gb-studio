import React, { ReactNode } from "react";
import { useLayoutEffect } from "react";
import { AutoFocusInside } from "react-focus-lock";
import { Button } from "ui/buttons/Button";
import useResizeObserver from "ui/hooks/use-resize-observer";
import { CloseIcon } from "ui/icons/Icons";
import {
  StyledCredits,
  StyledCreditsCloseButton,
  StyledCreditsContent,
  StyledCreditsGrid,
  StyledCreditsPerson,
  StyledCreditsSubHeading,
  StyledCreditsTitle,
} from "ui/splash/credits/style";

interface CreditsProps {
  onClose?: () => void;
  duration?: number;
  children?: ReactNode;
}

export const Credits = ({ onClose, duration = 60, children }: CreditsProps) => {
  return (
    <StyledCredits>
      <CreditsBackground />
      <StyledCreditsContent $duration={duration}>
        {children}
      </StyledCreditsContent>
      {onClose && (
        <StyledCreditsCloseButton>
          <AutoFocusInside>
            <Button variant="transparent" onClick={onClose}>
              <CloseIcon />
            </Button>
          </AutoFocusInside>
        </StyledCreditsCloseButton>
      )}
    </StyledCredits>
  );
};

interface CreditsTitleProps {
  children?: ReactNode;
}

export const CreditsTitle = ({ children }: CreditsTitleProps) => {
  return <StyledCreditsTitle children={children} />;
};

interface CreditsSubHeadingProps {
  children?: ReactNode;
}

export const CreditsSubHeading = ({ children }: CreditsSubHeadingProps) => {
  return <StyledCreditsSubHeading children={children} />;
};

export interface CreditsPersonProps {
  children?: ReactNode;
  gold?: boolean;
  onClick?: () => void;
}

export const CreditsPerson = ({
  children,
  gold,
  onClick,
}: CreditsPersonProps) => (
  <StyledCreditsPerson $gold={gold} onClick={onClick}>
    <span>{children}</span>
  </StyledCreditsPerson>
);

export interface CreditsGridProps {
  children?: ReactNode;
}

export const CreditsGrid = ({ children }: CreditsGridProps) => {
  return <StyledCreditsGrid children={children} />;
};

const CreditsBackground = () => {
  const [ref, size] = useResizeObserver<HTMLCanvasElement>();

  useLayoutEffect(() => {
    if (ref.current) {
      const c = ref.current;
      const ctx = c.getContext("2d");
      let time = 0;

      const render = () => {
        const width = c.width;
        const height = c.height;
        const numVerticalLines = Math.ceil(width / 30);

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

          // Vertical lines to horizon
          for (let i = -(numVerticalLines * 0.5); i < numVerticalLines; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 80, 0);
            ctx.lineTo(width * 0.5, height * 0.5);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(i * 80, height);
            ctx.lineTo(width * 0.5, height * 0.5);
            ctx.stroke();
          }

          // Horizontal lines
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

  return (
    <canvas
      ref={ref}
      width={size.width}
      height={size.height}
      style={{ width: "100%", height: "100%" }}
    ></canvas>
  );
};
