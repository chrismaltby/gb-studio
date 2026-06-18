import { getValidPlaybackSequenceId } from "../../../../src/components/music/sequence/helpers";

test("Should not follow an out-of-range playback sequence", () => {
  expect(getValidPlaybackSequenceId(true, 3, undefined, 3)).toBeUndefined();
});

test("Should not follow an out-of-range loop sequence", () => {
  expect(getValidPlaybackSequenceId(true, 1, 3, 3)).toBeUndefined();
});

test("Should follow valid playback and loop sequences", () => {
  expect(getValidPlaybackSequenceId(true, 2, undefined, 3)).toBe(2);
  expect(getValidPlaybackSequenceId(true, 2, 1, 3)).toBe(1);
});
