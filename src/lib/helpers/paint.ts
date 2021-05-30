import { floodFill } from "ts-flood-fill";

type GetValueFn = (x: number, y: number) => void;
type SetValueFn<T> = (x: number, y: number, value: T) => void;
type InBoundsFn = (x: number, y: number) => boolean;
type EqualityFn<T> = (a: T, b: T) => boolean;

const paint = <T>(x: number, y: number, size: number, value: T, setValue: SetValueFn<T>, isInBounds: InBoundsFn) => {
  for (let xi = x; xi < x + size; xi++) {
    for (let yi = y; yi < y + size; yi++) {
      if (isInBounds(xi, yi)) {
        setValue(xi, yi, value);
      }
    }
  }
}

const paintLine = <T>(startX: number, startY: number, endX: number, endY: number, size: number, value: T, setValue: SetValueFn<T>, isInBounds: InBoundsFn) => {

  let x1 = startX;
  let y1 = startY;
  let x2 = endX;
  let y2 = endY;

  let dx = Math.abs(x2 - x1);
  let dy = Math.abs(y2 - y1);
  let sx = (x1 < x2) ? 1 : -1;
  let sy = (y1 < y2) ? 1 : -1;
  let err = dx - dy;

  paint(x1, y1, size, value, setValue, isInBounds);

  while (!((x1 == x2) && (y1 == y2))) {
    let e2 = err << 1;
    if (e2 > -dy) {
      err -= dy;
      x1 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y1 += sy;
    }
    paint(x1, y1, size, value, setValue, isInBounds);
  }
}

export {
  paint,
  paintLine,
  floodFill
}