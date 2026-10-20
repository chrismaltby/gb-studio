/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, fireEvent, render, screen } from "../../../react-utils";
import { InstrumentNavigatorPane } from "../../../../src/components/music/navigator/InstrumentNavigatorPane";
import trackerActions from "../../../../src/store/features/tracker/trackerActions";
import { NOTE_C5 } from "../../../../src/consts";

const mockDispatch = jest.fn();
const mockPlayPreview = jest.fn();
let mockSelectedChannel: 0 | 1 | 2 | 3 = 3;
let mockSyncInstruments = true;

jest.mock("../../../../src/store/hooks", () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: jest.fn((selector) =>
    selector({
      tracker: {
        selectedChannel: mockSelectedChannel,
        selectedInstrument: { type: "duty", id: "group" },
      },
      trackerDocument: {
        present: {
          song: {
            dutyInstruments: [{ index: 0, name: "Duty 01" }],
            waveInstruments: [{ index: 0, name: "Wave 01" }],
            noiseInstruments: [{ index: 0, name: "Noise 01" }],
          },
        },
      },
    }),
  ),
}));

jest.mock("../../../../src/components/music/hooks/useMusicNotePreview", () => ({
  useMusicNotePreview: () => mockPlayPreview,
}));

jest.mock("renderer/lib/api", () => ({
  theme: { onChange: jest.fn() },
  settings: {
    get: () => Promise.resolve(mockSyncInstruments),
    set: jest.fn(),
  },
}));

type Item = { id: string; name: string; isGroup: boolean };

jest.mock("../../../../src/components/ui/lists/FlatList", () => ({
  FlatList: ({
    items,
    setSelectedId,
    children,
  }: {
    items: Item[];
    setSelectedId: (id: string, item: Item) => void;
    children: (args: { item: Item }) => React.ReactNode;
  }) => (
    <div>
      {items.map((item) =>
        item.isGroup ? (
          <div key={item.id}>{children({ item })}</div>
        ) : (
          <button key={item.id} onClick={() => setSelectedId(item.id, item)}>
            {item.name}
          </button>
        ),
      )}
    </div>
  ),
}));

jest.mock("../../../../src/components/ui/lists/EntityListItem", () => ({
  EntityListItem: ({
    item,
    onToggleCollapse,
  }: {
    item: Item;
    onToggleCollapse: () => void;
  }) => <button onClick={onToggleCollapse}>{item.id}</button>,
}));

describe("InstrumentNavigatorPane previews", () => {
  beforeEach(() => {
    mockDispatch.mockReset();
    mockPlayPreview.mockReset();
  });

  describe.each([true, false])("instrument syncing = %s", (sync) => {
    test.each([
      ["Duty 01", 3, 0, "duty"],
      ["Duty 01", 2, 0, "duty"],
      ["Duty 01", 1, 1, "duty"],
      ["Wave 01", 3, 2, "wave"],
      ["Noise 01", 0, 3, "noise"],
    ] as const)(
      "clicking %s from channel %s previews on channel %s",
      async (name, selectedChannel, previewChannel, type) => {
        mockSelectedChannel = selectedChannel;
        mockSyncInstruments = sync;
        await act(async () => {
          render(<InstrumentNavigatorPane height={400} />);
        });

        if (type !== "duty") {
          fireEvent.click(screen.getByText(`${type}_group`));
        }
        expect(mockPlayPreview).not.toHaveBeenCalled();
        fireEvent.click(screen.getByText(name));

        expect(mockPlayPreview).toHaveBeenCalledWith({
          channelId: previewChannel,
          note: NOTE_C5,
          instrumentId: 0,
        });

        const channelAction = trackerActions.setSelectedChannel(previewChannel);
        const instrumentAction = trackerActions.setSelectedInstrumentId(0);
        if (sync) {
          expect(mockDispatch).toHaveBeenCalledWith(channelAction);
          expect(mockDispatch).toHaveBeenCalledWith(instrumentAction);
        } else {
          expect(mockDispatch).not.toHaveBeenCalledWith(channelAction);
          expect(mockDispatch).not.toHaveBeenCalledWith(instrumentAction);
        }
      },
    );
  });
});
