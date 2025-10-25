import { compile } from "../../src/lib/events/eventTextCloseNonModal";

test("Should set close the dialogue", () => {
  const mockTextCloseNonModal = jest.fn();

  compile(
    {
      speed: 2,
    },
    {
      textCloseNonModal: mockTextCloseNonModal,
    },
  );
  expect(mockTextCloseNonModal).toBeCalledWith(1);
});

test("Should set close the dialogue with instant speed", () => {
  const mockTextCloseNonModal = jest.fn();

  compile(
    {
      speed: 0,
    },
    {
      textCloseNonModal: mockTextCloseNonModal,
    },
  );
  expect(mockTextCloseNonModal).toBeCalledWith(-3);
});
