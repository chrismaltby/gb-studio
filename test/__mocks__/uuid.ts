import { randomUUID } from "crypto";

export const v4 = jest.fn(() => randomUUID());
