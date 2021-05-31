/**
 * @jest-environment jsdom
 */

import {
  resizeAbsPaneBy,
  toSplitAbs,
  toSplitRel,
} from "../../../../src/components/ui/hooks/use-split-pane";

test("Should calculate resized split pane", () => {
  const absoluteSizes = [100, 200, 300, 400];
  const minSizes = [30, 30, 30, 30];
  const maxTotal = 500;

  expect(resizeAbsPaneBy(2, -50, absoluteSizes, minSizes, maxTotal)).toEqual([
    100, 200, 250, 400,
  ]);
});

test("Should push previous split pane if moved passed minimum size", () => {
  const absoluteSizes = [100, 200, 300, 400];
  const minSizes = [30, 30, 30, 30];
  const maxTotal = 500;

  expect(resizeAbsPaneBy(2, -100, absoluteSizes, minSizes, maxTotal)).toEqual([
    100, 170, 200, 400,
  ]);
});

test("Should push all previous split panes to start if resize cannot fit", () => {
  const absoluteSizes = [100, 200, 300, 400];
  const minSizes = [30, 30, 30, 30];
  const maxTotal = 500;

  expect(resizeAbsPaneBy(2, -500, absoluteSizes, minSizes, maxTotal)).toEqual([
    30, 60, 90, 400,
  ]);
});

test("Should push next split pane if moved passed start of next split", () => {
  const absoluteSizes = [100, 200, 300, 400];
  const minSizes = [30, 30, 30, 30];
  const maxTotal = 500;

  expect(resizeAbsPaneBy(1, 105, absoluteSizes, minSizes, maxTotal)).toEqual([
    100, 305, 335, 400,
  ]);
});

test("Should not push next split pane if not moved passed start of next split", () => {
  const absoluteSizes = [100, 200, 300, 400];
  const minSizes = [30, 30, 30, 30];
  const maxTotal = 500;

  expect(resizeAbsPaneBy(1, 50, absoluteSizes, minSizes, maxTotal)).toEqual([
    100, 250, 300, 400,
  ]);
});

test("Should push all subsequent split panes to end if resize cannot fit", () => {
  const absoluteSizes = [100, 200, 300, 400];
  const minSizes = [30, 30, 30, 30];
  const maxTotal = 500;

  expect(resizeAbsPaneBy(1, 500, absoluteSizes, minSizes, maxTotal)).toEqual([
    100, 440, 470, 500,
  ]);
});

test("Should convert split pane in relative coordinates to absolute coordinates", () => {
  expect(toSplitAbs([50, 50, 50])).toEqual([50, 100, 150]);
});

test("Should convert split pane in absolute coordinates to relative coordinates", () => {
  expect(toSplitRel([25, 300, 500])).toEqual([25, 275, 200]);
});
