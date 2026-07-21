/**
 * @jest-environment jsdom
 */

import React from "react";
import { fireEvent, render, screen } from "../../../react-utils";
import { FlatList } from "../../../../src/components/ui/lists/FlatList";

class ResizeObserverMock implements ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}

  observe = jest.fn((target: Element) => {
    Object.defineProperties(target, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 500 },
    });
    this.callback(
      [
        {
          contentRect: { height: 100, width: 100 },
          target,
        } as ResizeObserverEntry,
      ],
      this,
    );
  });
  unobserve = jest.fn();
  disconnect = jest.fn();
}

beforeAll(() => {
  global.ResizeObserver = ResizeObserverMock;
  HTMLElement.prototype.scrollTo = function scrollTo(
    options?: ScrollToOptions | number,
    y?: number,
  ) {
    if (typeof options === "number") {
      this.scrollLeft = options;
      this.scrollTop = y ?? 0;
    } else {
      this.scrollLeft = options?.left ?? this.scrollLeft;
      this.scrollTop = options?.top ?? this.scrollTop;
    }
  };
});

const items = Array.from({ length: 20 }, (_, index) => ({
  id: String(index),
  name: `Item ${index}`,
}));

const TestList = ({
  cacheKey,
  listItems = items,
  selectedId,
}: {
  cacheKey?: string;
  listItems?: typeof items;
  selectedId?: string;
}) => (
  <FlatList
    cacheKey={cacheKey}
    height={100}
    items={listItems}
    selectedId={selectedId}
  >
    {({ item }) => item.name}
  </FlatList>
);

test("restores its cached scroll position when remounted", () => {
  const firstRender = render(<TestList cacheKey="flat-list-remount-test" />);
  const firstScroller = screen.getByRole("list");

  firstScroller.scrollTop = 80;
  fireEvent.scroll(firstScroller);
  firstRender.unmount();

  const secondRender = render(<TestList cacheKey="flat-list-remount-test" />);

  secondRender.rerender(
    <TestList cacheKey="flat-list-remount-test" listItems={[...items]} />,
  );

  expect(screen.getByRole("list").scrollTop).toBe(80);
});

test("centers selection without a cached position and uses automatic alignment afterwards", () => {
  const list = render(
    <TestList cacheKey="flat-list-selection-test" selectedId="10" />,
  );
  const scroller = screen.getByRole("list");

  expect(scroller.scrollTop).toBe(212.5);

  list.rerender(
    <TestList cacheKey="flat-list-selection-test" selectedId="11" />,
  );
  expect(scroller.scrollTop).toBe(212.5);

  list.rerender(
    <TestList cacheKey="flat-list-selection-test" selectedId="19" />,
  );
  expect(scroller.scrollTop).toBe(400);
});

test("restores cached scroll when the selection is within its viewport", () => {
  const firstRender = render(
    <TestList cacheKey="flat-list-visible-selection-test" />,
  );
  const firstScroller = screen.getByRole("list");

  firstScroller.scrollTop = 80;
  fireEvent.scroll(firstScroller);
  firstRender.unmount();

  render(
    <TestList cacheKey="flat-list-visible-selection-test" selectedId="4" />,
  );

  expect(screen.getByRole("list").scrollTop).toBe(80);
});

test("centers selection when it is outside the cached viewport", () => {
  const firstRender = render(
    <TestList cacheKey="flat-list-hidden-selection-test" />,
  );
  const firstScroller = screen.getByRole("list");

  firstScroller.scrollTop = 80;
  fireEvent.scroll(firstScroller);
  firstRender.unmount();

  render(
    <TestList cacheKey="flat-list-hidden-selection-test" selectedId="15" />,
  );

  expect(screen.getByRole("list").scrollTop).toBe(337.5);
});

test("uses automatic alignment on mount without a cache key", () => {
  render(<TestList selectedId="10" />);

  expect(screen.getByRole("list").scrollTop).toBe(175);
});

test("keeps separate FlatList cache keys independent", () => {
  const firstRender = render(
    <>
      <TestList cacheKey="flat-list-first-test" />
      <TestList cacheKey="flat-list-second-test" />
    </>,
  );
  const firstScrollers = screen.getAllByRole("list");

  firstScrollers[0].scrollTop = 40;
  fireEvent.scroll(firstScrollers[0]);
  firstScrollers[1].scrollTop = 90;
  fireEvent.scroll(firstScrollers[1]);
  firstRender.unmount();

  render(
    <>
      <TestList cacheKey="flat-list-first-test" />
      <TestList cacheKey="flat-list-second-test" />
    </>,
  );
  const secondScrollers = screen.getAllByRole("list");

  expect(secondScrollers[0].scrollTop).toBe(40);
  expect(secondScrollers[1].scrollTop).toBe(90);
});
