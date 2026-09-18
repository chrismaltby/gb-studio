import reducer, {
  actions,
  initialState,
} from "../../../../src/store/features/trackerDocument/trackerDocumentState";
import { createPattern, createSong } from "../../../../src/shared/lib/uge/song";

test.each(["before", "after"] as const)(
  "Should clone a sequence pattern %s the original without sharing cells",
  (position) => {
    const song = createSong();
    song.patterns = Array.from({ length: 4 }, () => createPattern());
    song.patterns[0][0] = {
      note: 24,
      instrument: 1,
      effectCode: 2,
      effectParam: 3,
    };
    song.sequence = [{ splitPattern: false, channels: [0, 1, 2, 3] }];
    const state = reducer({ ...initialState, song }, { type: "@@init" });

    const newState = reducer(
      state,
      actions.cloneSequencePattern({ sequenceIndex: 0, position }),
    );

    const cloneIndex = position === "before" ? 0 : 1;
    expect(newState.song?.sequence[cloneIndex]).toEqual({
      splitPattern: false,
      channels: [4, 5, 6, 7],
    });
    expect(newState.song?.sequence[1 - cloneIndex]).toEqual(song.sequence[0]);
    expect(newState.song?.patterns).toHaveLength(8);
    for (let channel = 0; channel < 4; channel++) {
      const original = newState.song?.patterns[channel];
      const clone = newState.song?.patterns[channel + 4];
      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone?.[0]).not.toBe(original?.[0]);
    }
    expect(state.song?.patterns).toHaveLength(4);
    expect(state.song?.sequence).toHaveLength(1);

    const editedState = reducer(
      newState,
      actions.editPatternCell({
        patternId: 4,
        rowId: 0,
        changes: { note: 36 },
      }),
    );
    expect(editedState.song?.patterns[4][0].note).toBe(36);
    expect(editedState.song?.patterns[0][0].note).toBe(24);
  },
);

test("Should realign channel 0 to a pattern block when disabling split pattern", () => {
  const song = createSong();
  song.patterns = Array.from({ length: 8 }, () => createPattern());
  song.sequence = [
    {
      splitPattern: true,
      channels: [5, 10, 11, 12],
    },
  ];

  const newState = reducer(
    {
      ...initialState,
      song,
    },
    actions.setSequenceSplitPattern({
      sequenceIndex: 0,
      splitPattern: false,
    }),
  );

  expect(newState.song?.sequence[0]).toEqual({
    splitPattern: false,
    channels: [4, 5, 6, 7],
  });
});
