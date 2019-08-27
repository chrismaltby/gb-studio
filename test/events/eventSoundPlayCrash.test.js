import { compile } from "../../src/lib/events/eventSoundPlayCrash";

test("Should be able to play crash", () => {
  const mockSoundPlayCrash = jest.fn();

  compile(
    {},
    {
      soundPlayCrash: mockSoundPlayCrash
    }
  );
  expect(mockSoundPlayCrash).toBeCalledWith();
});
