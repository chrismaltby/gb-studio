import { msToHumanTime } from "shared/lib/helpers/time";
import { loadLanguage } from "../../src/lib/lang/initElectronL10N";

describe("msToHumanTime", () => {
  beforeAll(() => {
    loadLanguage("en");
  });
  test("should only show seconds when time under 1 min", () => {
    expect(msToHumanTime(6000)).toEqual("6s");
  });
  test("should only round to at most two decimal places when showing seconds", () => {
    expect(msToHumanTime(6005)).toEqual("6s");
    expect(msToHumanTime(6100)).toEqual("6.1s");
    expect(msToHumanTime(6232)).toEqual("6.23s");
    expect(msToHumanTime(6073)).toEqual("6.07s");
  });
  test("should only show minutes and zero seconds when time exactly on a minute", () => {
    expect(msToHumanTime(60000)).toEqual("1m 0s");
    expect(msToHumanTime(120000)).toEqual("2m 0s");
  });
  test("should only show minutes and rounded down seconds when time is over a minute", () => {
    expect(msToHumanTime(60100)).toEqual("1m 0s");
    expect(msToHumanTime(65900)).toEqual("1m 5s");
    expect(msToHumanTime(61100)).toEqual("1m 1s");
    expect(msToHumanTime(2 * 60 * 1000 - 1)).toEqual("1m 59s");
  });
});
