/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import "@testing-library/jest-dom";
import APIMock from "./__mocks__/apiMock";

const mockGlobal = global as any;

mockGlobal.__non_webpack_require__ = (a: any) => require(a);
mockGlobal.API = APIMock;

mockGlobal.SPLASH_WINDOW_PRELOAD_WEBPACK_ENTRY =
  "SPLASH_WINDOW_PRELOAD_WEBPACK_ENTRY";
mockGlobal.SPLASH_WINDOW_WEBPACK_ENTRY = "SPLASH_WINDOW_WEBPACK_ENTRY";
