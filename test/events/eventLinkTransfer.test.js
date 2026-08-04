import { compile, fields } from "../../src/lib/events/eventLinkTransfer";

test("Should use scalar variables for single-word transfers", () => {
  const mockLinkTransfer = jest.fn();

  compile(
    {
      sendVariable: "send",
      receiveVariable: "receive",
      sendVariableArray: { type: "variable", value: "sendArray" },
      receiveVariableArray: { type: "variable", value: "receiveArray" },
      size: 1,
    },
    { linkTransfer: mockLinkTransfer },
  );

  expect(mockLinkTransfer).toHaveBeenCalledWith("send", "receive", 1);
});

test("Should use array references for multiword transfers", () => {
  const mockLinkTransfer = jest.fn();
  const sendVariableArray = { type: "variable", value: "sendArray" };
  const receiveVariableArray = { type: "variable", value: "receiveArray" };

  compile(
    {
      sendVariable: "send",
      receiveVariable: "receive",
      sendVariableArray,
      receiveVariableArray,
      size: 2,
    },
    { linkTransfer: mockLinkTransfer },
  );

  expect(mockLinkTransfer).toHaveBeenCalledWith(
    sendVariableArray,
    receiveVariableArray,
    2,
  );
});

test("Should require array references for multiword transfers", () => {
  expect(fields).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        key: "sendVariableArray",
        variableType: "arrayReference",
        conditions: [{ key: "size", gt: 1 }],
      }),
      expect.objectContaining({
        key: "receiveVariableArray",
        variableType: "arrayReference",
        conditions: [{ key: "size", gt: 1 }],
      }),
      expect.objectContaining({ key: "size", min: 1 }),
    ]),
  );
});
