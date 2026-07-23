/** @jest-environment jsdom */

import React, { memo, useEffect } from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { Select } from "ui/form/Select";
import { SelectWindowed } from "ui/form/SelectWindowed";
import ThemeProvider from "ui/theme/ThemeProvider";

const mockScrollToRow = jest.fn();

jest.mock("react-window", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  interface MockListApi {
    readonly element: HTMLDivElement | null;
    scrollToRow: typeof mockScrollToRow;
  }

  interface MockRowProps {
    ariaAttributes: {
      "aria-posinset": number;
      "aria-setsize": number;
      role: "listitem";
    };
    index: number;
    style: React.CSSProperties;
    [key: string]: unknown;
  }

  interface MockListProps {
    listRef: (api: MockListApi | null) => void;
    onMouseMoveCapture?: React.MouseEventHandler<HTMLDivElement>;
    rowComponent: React.ComponentType<MockRowProps>;
    rowCount: number;
    rowHeight: (index: number, props: Record<string, unknown>) => number;
    rowProps: Record<string, unknown>;
    style: React.CSSProperties;
  }

  const List = ({
    listRef,
    onMouseMoveCapture,
    rowComponent: Row,
    rowCount,
    rowHeight,
    rowProps,
    style,
  }: MockListProps) => {
    const elementRef = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(() => {
      const api: MockListApi = {
        get element() {
          return elementRef.current;
        },
        scrollToRow: mockScrollToRow,
      };
      listRef(api);
      return () => listRef(null);
    }, [listRef]);

    return (
      <div
        ref={elementRef}
        data-testid="windowed-list"
        onMouseMoveCapture={onMouseMoveCapture}
        style={style}
      >
        {Array.from({ length: rowCount }, (_, index) => (
          <Row
            {...rowProps}
            key={index}
            ariaAttributes={{
              "aria-posinset": index + 1,
              "aria-setsize": rowCount,
              role: "listitem",
            }}
            index={index}
            style={{ height: rowHeight(index, rowProps) }}
          />
        ))}
      </div>
    );
  };

  return {
    List,
    useListCallbackRef: () => React.useState<MockListApi | null>(null),
  };
});

interface TestOption {
  label: string;
  value: string;
}

const options: TestOption[] = [
  { value: "one", label: "One" },
  { value: "two", label: "Two" },
  { value: "three", label: "Three" },
];

const originalRequestAnimationFrame = window.requestAnimationFrame;
const originalCancelAnimationFrame = window.cancelAnimationFrame;

beforeAll(() => {
  window.requestAnimationFrame = (callback) => {
    callback(0);
    return 1;
  };
  window.cancelAnimationFrame = () => {};
});

afterAll(() => {
  window.requestAnimationFrame = originalRequestAnimationFrame;
  window.cancelAnimationFrame = originalCancelAnimationFrame;
});

beforeEach(() => {
  mockScrollToRow.mockClear();
});

test("centres the selected option initially and uses automatic alignment afterwards", async () => {
  render(
    <SelectWindowed
      menuIsOpen
      options={options}
      value={options[1]}
      windowThreshold={0}
    />,
  );

  await waitFor(() =>
    expect(mockScrollToRow).toHaveBeenCalledWith({
      align: "center",
      index: 1,
    }),
  );

  fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });

  await waitFor(() =>
    expect(mockScrollToRow).toHaveBeenLastCalledWith({
      align: "auto",
      index: 2,
    }),
  );
});

test("only rerenders affected rows when hover focus changes", async () => {
  const mounts: Record<string, number> = {};
  const renders: Record<string, number> = {};

  const Preview = ({ value }: { value: string }) => {
    renders[value] = (renders[value] ?? 0) + 1;
    useEffect(() => {
      mounts[value] = (mounts[value] ?? 0) + 1;
    }, [value]);
    return <span>{value}</span>;
  };

  render(
    <SelectWindowed
      classNamePrefix="TestSelect"
      formatOptionLabel={(option, meta) =>
        meta.context === "menu" ? (
          <Preview value={option.value} />
        ) : (
          option.label
        )
      }
      menuIsOpen
      options={options}
      value={options[1]}
      windowThreshold={0}
    />,
  );

  await waitFor(() => expect(mounts).toEqual({ one: 1, two: 1, three: 1 }));
  await waitFor(() => expect(mockScrollToRow).toHaveBeenCalled());
  mockScrollToRow.mockClear();
  const rendersBeforeNavigation = { ...renders };

  fireEvent.mouseMove(screen.getByRole("option", { name: "three" }));

  await waitFor(() =>
    expect(
      document.querySelector(".TestSelect__option--is-focused"),
    ).toHaveTextContent("three"),
  );
  expect(mounts).toEqual({ one: 1, two: 1, three: 1 });
  expect(renders.one).toBe(rendersBeforeNavigation.one);
  expect(renders.two).toBeGreaterThan(rendersBeforeNavigation.two);
  expect(renders.three).toBeGreaterThan(rendersBeforeNavigation.three);
  expect(mockScrollToRow).not.toHaveBeenCalled();

  fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowUp" });
  await waitFor(() =>
    expect(mockScrollToRow).toHaveBeenCalledWith({
      align: "auto",
      index: 1,
    }),
  );
});

test("keeps memoized previews mounted during keyboard navigation", async () => {
  const mounts: Record<string, number> = {};
  const Preview = memo(({ value }: { value: string }) => {
    useEffect(() => {
      mounts[value] = (mounts[value] ?? 0) + 1;
    }, [value]);
    return <span>{value}</span>;
  });

  render(
    <SelectWindowed
      formatOptionLabel={(option, meta) =>
        meta.context === "menu" ? (
          <Preview value={option.value} />
        ) : (
          option.label
        )
      }
      menuIsOpen
      options={options}
      value={options[1]}
      windowThreshold={0}
    />,
  );

  await waitFor(() => expect(mounts).toEqual({ one: 1, two: 1, three: 1 }));
  fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
  await waitFor(() =>
    expect(mockScrollToRow).toHaveBeenLastCalledWith({
      align: "auto",
      index: 2,
    }),
  );

  expect(mounts).toEqual({ one: 1, two: 1, three: 1 });
});

test("rerenders option labels when the search input changes", async () => {
  render(
    <SelectWindowed
      formatOptionLabel={(option, meta) => (
        <span>{`${option.label}:${meta.inputValue}`}</span>
      )}
      menuIsOpen
      options={options}
      windowThreshold={0}
    />,
  );

  fireEvent.change(screen.getByRole("combobox"), { target: { value: "o" } });

  const menuList = screen.getByTestId("windowed-list");
  expect(await within(menuList).findByText("One:o")).toBeInTheDocument();
  expect(within(menuList).getByText("Two:o")).toBeInTheDocument();
});

test("omits empty group headings", () => {
  const { container } = render(
    <SelectWindowed
      classNamePrefix="TestSelect"
      menuIsOpen
      options={[
        { label: "", options: [options[0]] },
        { label: "Plugin", options: [options[1]] },
      ]}
      windowThreshold={0}
    />,
  );

  const groupHeadings = container.querySelectorAll(
    ".TestSelect__group-heading",
  );
  expect(groupHeadings).toHaveLength(1);
  expect(groupHeadings[0]).toHaveTextContent("Plugin");
});

test("flattens mixed options and groups into separate rows", () => {
  render(
    <SelectWindowed
      menuIsOpen
      options={[options[0], { label: "Plugin", options: [options[1]] }]}
      windowThreshold={0}
    />,
  );

  expect(screen.getByTestId("windowed-list").children).toHaveLength(3);
  expect(screen.getByRole("option", { name: "One" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Two" })).toBeInTheDocument();
  expect(
    within(screen.getByTestId("windowed-list")).getByText("Plugin"),
  ).toBeInTheDocument();
});

test("uses the value returned by onInputChange", () => {
  const onInputChange = jest.fn((value: string) => value.toUpperCase());
  render(
    <SelectWindowed
      menuIsOpen
      onInputChange={onInputChange}
      options={options}
      windowThreshold={0}
    />,
  );

  fireEvent.change(screen.getByRole("combobox"), { target: { value: "o" } });

  expect(onInputChange).toHaveBeenCalledWith(
    "o",
    expect.objectContaining({ action: "input-change" }),
  );
  expect(screen.getByRole("combobox")).toHaveValue("O");
});

test("only enables windowing once the threshold is reached", () => {
  const { rerender } = render(
    <SelectWindowed
      menuIsOpen
      options={options}
      windowThreshold={options.length + 1}
    />,
  );
  expect(screen.queryByTestId("windowed-list")).not.toBeInTheDocument();

  rerender(
    <SelectWindowed
      menuIsOpen
      options={options}
      windowThreshold={options.length}
    />,
  );
  expect(screen.getByTestId("windowed-list")).toBeInTheDocument();
});

test("allows the app Select to set its maximum menu height", () => {
  render(
    <ThemeProvider>
      <Select
        maxMenuHeight={70}
        menuIsOpen
        menuPortalTarget={null}
        options={options}
      />
    </ThemeProvider>,
  );

  expect(screen.getByTestId("windowed-list")).toHaveStyle({ height: "70px" });
});

test("renders only the longest plain label for intrinsic menu width sizing", () => {
  const { container } = render(
    <SelectWindowed
      formatOptionLabel={(option) => (
        <span>
          <span>Preview</span>
          {option.label}
          <button type="button">Edit</button>
        </span>
      )}
      menuIsOpen
      options={[
        ...options,
        { value: "long", label: "A much longer option label" },
      ]}
      windowThreshold={0}
    />,
  );

  const widthSizer = container.querySelector("[inert]");
  expect(widthSizer).toHaveTextContent("A much longer option label");
  expect(widthSizer).not.toHaveTextContent("Preview");
  expect(widthSizer).not.toHaveTextContent("Edit");
  expect(widthSizer?.querySelector("button")).toBeNull();
});
