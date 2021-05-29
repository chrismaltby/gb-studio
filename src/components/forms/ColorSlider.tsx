import React, { Component } from "react";

type ColorSliderProps = {
  value: number;
  steps: number;
  handleColor: string;
  colorAtValue: (value: number) => string;
  onChange: (value: number) => void;
};

class ColorSlider extends Component<ColorSliderProps> {
  target: HTMLElement | undefined;

  onMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { onChange } = this.props;
    if (!(e.currentTarget instanceof HTMLElement)) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const value = x / rect.width;
    onChange(value);
    this.target = e.currentTarget;
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onMouseUp);
  };

  onMouseMove = (e: MouseEvent) => {
    if (this.target) {
      const { onChange } = this.props;
      const rect = this.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const value = x / rect.width;
      onChange(value);
    }
  };

  onMouseUp = (_e: MouseEvent) => {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
  };

  render() {
    const { steps = 11, value, colorAtValue, handleColor } = this.props;
    const stepValues = Array.from(Array(steps).keys());

    return (
      <div className="ColorSlider" onMouseDown={this.onMouseDown}>
        {stepValues.map((stepIndex) => {
          const normalisedValue = stepIndex / (stepValues.length - 1);
          const color = colorAtValue(normalisedValue);
          return (
            <div
              key={stepIndex}
              className="ColorSlider__Color"
              style={{
                backgroundColor: color,
              }}
            />
          );
        })}
        <div
          className="ColorSlider__Handle"
          style={{
            left: `${value * 100}%`,
            backgroundColor: handleColor,
          }}
        />
      </div>
    );
  }
}

export default ColorSlider;
