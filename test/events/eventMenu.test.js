import { compile } from "../../src/lib/events/eventMenu";

test("Should be able to display a text menu that cancel on last option", () => {
  const mockTextMenu = jest.fn();
  compile(
    {
      variable: "5",
      cancelOnLastOption: true,
      items: 2,
      option1: "Item1",
      option2: "Item2",
      cancelOnB: false,
      layout: "menu"
    },
    {
      textMenu: mockTextMenu
    }
  );
  expect(mockTextMenu).toBeCalledWith(
    "5", 
    ["Item1", "Item2"],
    "menu",
    true,
    false
  );
});

test("Should be able to display a text menu that cancel on b", () => {
  const mockTextMenu = jest.fn();
  compile(
    {
      variable: "5",
      cancelOnLastOption: false,
      items: 2,
      option1: "Item1",
      option2: "Item2",
      cancelOnB: true,
      layout: "menu"
    },
    {
      textMenu: mockTextMenu
    }
  );
  expect(mockTextMenu).toBeCalledWith(
    "5", 
    ["Item1", "Item2"],
    "menu",
    false,
    true
  );
});

test("Should be able to display a text menu with dialogue layout that cancel on last option", () => {
  const mockTextMenu = jest.fn();
  compile(
    {
      variable: "5",
      cancelOnLastOption: true,
      items: 2,
      option1: "Item1",
      option2: "Item2",
      cancelOnB: false,
      layout: "dialogue"
    },
    {
      textMenu: mockTextMenu
    }
  );
  expect(mockTextMenu).toBeCalledWith(
    "5", 
    ["Item1", "Item2"],
    "dialogue",
    true,
    false
  );
});

test("Should be able to display a text menu with dialogue layout that cancel on b", () => {
  const mockTextMenu = jest.fn();
  compile(
    {
      variable: "5",
      cancelOnLastOption: false,
      items: 2,
      option1: "Item1",
      option2: "Item2",
      cancelOnB: true,
      layout: "dialogue"
    },
    {
      textMenu: mockTextMenu
    }
  );
  expect(mockTextMenu).toBeCalledWith(
    "5", 
    ["Item1", "Item2"],
    "dialogue",
    false,
    true
  );
});
