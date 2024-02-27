/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import "@testing-library/jest-dom";
import APIMock from "./__mocks__/apiMock";

(global as any).__non_webpack_require__ = (a: any) => require(a);
(global as any).API = APIMock;
