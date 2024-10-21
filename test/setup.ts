/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import "@testing-library/jest-dom";
import APIMock from "./__mocks__/apiMock";
import * as matchers from "jest-extended";

expect.extend(matchers);

const mockGlobal = global as any;

mockGlobal.__non_webpack_require__ = (a: any) => require(a);
mockGlobal.API = APIMock;

mockGlobal.SPLASH_WINDOW_PRELOAD_WEBPACK_ENTRY =
  "SPLASH_WINDOW_PRELOAD_WEBPACK_ENTRY";
mockGlobal.SPLASH_WINDOW_WEBPACK_ENTRY = "SPLASH_WINDOW_WEBPACK_ENTRY";

mockGlobal.PREFERENCES_WINDOW_PRELOAD_WEBPACK_ENTRY =
  "PREFERENCES_WINDOW_PRELOAD_WEBPACK_ENTRY";
mockGlobal.PREFERENCES_WINDOW_WEBPACK_ENTRY =
  "PREFERENCES_WINDOW_WEBPACK_ENTRY";
