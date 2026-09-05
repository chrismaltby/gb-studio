/** @jest-environment jsdom */
import React from "react";
import DebuggerDataUsage, {
  usageBarColor,
  usageBarPercent,
} from "components/debugger/DebuggerDataUsage";
import { fireEvent, render, screen } from "../../react-utils";
import { clearL10NData, setL10NData } from "shared/lib/lang/l10n";
import type {
  BuildUsageSource,
  BuildUsageScript,
} from "lib/compiler/buildUsage";

const defaultState = {
  dataUsageSearchTerm: "",
  dataUsageFilter: "all",
  dataUsageSortKey: "size",
  dataUsageSortAsc: false,
};
let mockState = defaultState;
const dispatch = jest.fn();
jest.mock("store/hooks", () => ({
  useAppDispatch: () => dispatch,
  useAppSelector: (selector: (state: { debug: unknown }) => unknown) =>
    selector({ debug: mockState }),
}));
jest.mock("store/features/entities/entitiesSelectors", () => ({
  actorSelectors: { selectAll: () => [], selectById: jest.fn() },
  triggerSelectors: { selectAll: () => [] },
  sceneSelectors: { selectAll: () => [] },
  customEventSelectors: {
    selectAll: () => [
      { id: "event-a", name: "Alpha" },
      { id: "event-b", name: "Bravo" },
      { id: "event-c", name: "Charlie" },
    ],
  },
  spriteSheetSelectors: { selectAll: () => [] },
  backgroundSelectors: { selectAll: () => [] },
  musicSelectors: {
    selectAll: () => [{ id: "song-1", name: "Song One", symbol: "song_1" }],
  },
  soundSelectors: { selectAll: () => [] },
}));
jest.mock("ui/tooltips/Tooltip", () => ({
  TooltipWrapper: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const scripts: BuildUsageScript[] = [
  {
    symbol: "script_shared",
    size: 100,
    sources: ["event-a", "event-b", "event-c"].map((entityId) => ({
      sceneId: "",
      entityId,
      entityType: "customEvent" as const,
      scriptKey: "script",
    })),
  },
];
const sources: BuildUsageSource[] = [
  {
    sourceFile: "src/data/music/song_1_Data.c",
    usage: { bank0: 0, wram: 20, bankedRom: 2048 },
  },
];

describe("DebuggerDataUsage", () => {
  beforeEach(() => {
    mockState = defaultState;
    dispatch.mockClear();
    setL10NData({
      FIELD_SCRIPT: "Script",
      FIELD_MUSIC: "Music",
      FIELD_FILENAME: "Filename",
      FIELD_N_MORE: "+{n} more",
      FIELD_SCRIPT_SHARED_BY: "Script shared by: {sources}",
    });
  });
  afterEach(() => clearL10NData());
  test("shows scripts and assets with generated filenames", () => {
    render(<DebuggerDataUsage scripts={scripts} sources={sources} />);
    expect(screen.getByText("Alpha (Script)")).toBeInTheDocument();
    expect(screen.getByText("script_shared.s")).toBeInTheDocument();
    expect(screen.getByText("Song One")).toBeInTheDocument();
    expect(screen.getByText("song_1_Data.c")).toBeInTheDocument();
  });
  test("expands all sources of a shared script", () => {
    render(<DebuggerDataUsage scripts={scripts} sources={[]} />);
    expect(screen.queryByText("Bravo (Script)")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("+2 more"));
    expect(screen.getByText("Bravo (Script)")).toBeInTheDocument();
    expect(screen.getByText("Charlie (Script)")).toBeInTheDocument();
  });
  test("dispatches search and type filter changes", () => {
    render(<DebuggerDataUsage scripts={scripts} sources={sources} />);
    fireEvent.change(screen.getByPlaceholderText("TOOLBAR_SEARCH"), {
      target: { value: "song" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Music" }));
    expect(dispatch).toHaveBeenCalledWith({
      type: "debug/setDataUsageSearchTerm",
      payload: "song",
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: "debug/setDataUsageFilter",
      payload: "music",
    });
  });
});
describe("usage bar", () => {
  test("is proportional and capped at one bank", () => {
    expect(usageBarPercent(4096)).toBeCloseTo(25);
    expect(usageBarPercent(19802)).toBe(100);
  });
  test("uses warning colors as a source approaches one bank", () => {
    expect(usageBarColor(4096)).toBe("#3dad3d");
    expect(usageBarColor(10 * 1024)).toBe("orange");
    expect(usageBarColor(16 * 1024)).toBe("#e20e2b");
  });
});
