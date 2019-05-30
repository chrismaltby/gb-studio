import ScriptBuilder from "../../../src/lib/compiler/scriptBuilder";
import {
  commandIndex as cmd,
  ACTOR_SET_ACTIVE,
  ACTOR_MOVE_TO,
  ACTOR_SET_DIRECTION,
  ACTOR_SET_FRAME,
  ACTOR_SET_FLIP,
  ACTOR_PUSH,
  TEXT,
  TEXT_MULTI,
  SET_TRUE,
  SET_FALSE,
  SWITCH_SCENE,
  WAIT,
  END
} from "../../../src/lib/events/scriptCommands";
import { dirDec } from "../../../src/lib/compiler/helpers";

test("Should be able to set active actor to player", () => {
  const output = [];
  const sb = new ScriptBuilder(output, {
    scene: {
      actors: []
    }
  });
  sb.setActiveActor("player");
  expect(output).toEqual([cmd(ACTOR_SET_ACTIVE), 0]);
});

test("Should be able to move active actor to position", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.actorMoveTo(5, 6);
  expect(output).toEqual([cmd(ACTOR_MOVE_TO), 5, 6]);
});

test("Should default move active actor to position to origin", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.actorMoveTo();
  expect(output).toEqual([cmd(ACTOR_MOVE_TO), 0, 0]);
});

test("Should be able to set active actor direction", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.actorSetDirection("right");
  expect(output).toEqual([cmd(ACTOR_SET_DIRECTION), dirDec("right")]);
});

test("Should default set active actor direction to 'down'", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.actorSetDirection();
  expect(output).toEqual([cmd(ACTOR_SET_DIRECTION), dirDec("down")]);
});

test("Should be able to set frame of active actor", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.actorSetFrame(7);
  expect(output).toEqual([cmd(ACTOR_SET_FRAME), 7]);
});

test("Should be able to set flip state of active actor", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.actorSetFlip(true);
  expect(output).toEqual([cmd(ACTOR_SET_FLIP), 1]);
});

test("Should be able to unset flip state of active actor", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.actorSetFlip(false);
  expect(output).toEqual([cmd(ACTOR_SET_FLIP), 0]);
});

test("Should be able to push active actor", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.actorPush(false);
  expect(output).toEqual([cmd(ACTOR_PUSH), 0]);
});

test("Should be able to push active actor continuing until collision", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.actorPush(true);
  expect(output).toEqual([cmd(ACTOR_PUSH), 1]);
});

test("Should default push active actor to not continue", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.actorPush();
  expect(output).toEqual([cmd(ACTOR_PUSH), 0]);
});

test("Should be able to display text", () => {
  const output = [];
  const strings = ["First Text"];
  const sb = new ScriptBuilder(output, { strings });
  sb.displayText("First Text");
  expect(output).toEqual([cmd(TEXT), 0, 0]);
  expect(strings).toEqual(["First Text"]);
});

test("Should be able to add additional display text", () => {
  const output = [];
  const strings = ["First Text", "Unused Text"];
  const sb = new ScriptBuilder(output, { strings });
  sb.displayText("First Text");
  sb.displayText("Second Text");
  expect(output).toEqual([cmd(TEXT), 0, 0, cmd(TEXT), 0, 2]);
  expect(strings).toEqual(["First Text", "Unused Text", "Second Text"]);
});

test("Should default to empty display text", () => {
  const output = [];
  const strings = [];
  const sb = new ScriptBuilder(output, { strings });
  sb.displayText();
  expect(output).toEqual([cmd(TEXT), 0, 0]);
  expect(strings).toEqual([" "]);
});

test("Should be able to set text box to open instantly", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.textSetOpenInstant();
  expect(output).toEqual([cmd(TEXT_MULTI), 1]);
});

test("Should be able to restore text box open speed", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.textRestoreOpenSpeed();
  expect(output).toEqual([cmd(TEXT_MULTI), 3]);
});

test("Should be able to set text box to close instantly", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.textSetCloseInstant();
  expect(output).toEqual([cmd(TEXT_MULTI), 0]);
});

test("Should be able to restore text box close speed", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.textRestoreCloseSpeed();
  expect(output).toEqual([cmd(TEXT_MULTI), 2]);
});

test("Should be able to set variable to true", () => {
  const output = [];
  const sb = new ScriptBuilder(output, { variables: ["0"] });
  sb.setTrue("0");
  expect(output).toEqual([cmd(SET_TRUE), 0, 0]);
});

test("Should be able to set variable to false", () => {
  const output = [];
  const sb = new ScriptBuilder(output, { variables: ["0", "1"] });
  sb.setFalse("1");
  expect(output).toEqual([cmd(SET_FALSE), 0, 1]);
});

test("Should be able to switch scene", () => {
  const output = [];
  const sb = new ScriptBuilder(output, {
    scenes: [
      {
        id: "abc"
      }
    ]
  });
  sb.switchScene("abc", 5, 9, "up", 2);
  expect(output).toEqual([cmd(SWITCH_SCENE), 0, 0, 5, 9, dirDec("up"), 2]);
});

test("Should skip switching scene if not found", () => {
  const output = [];
  const sb = new ScriptBuilder(output, {
    scenes: [
      {
        id: "abc"
      }
    ]
  });
  sb.switchScene("def", 5, 9, "up", 2);
  expect(output).toEqual([]);
});

test("Should default scene switch to facing downwards at origin with default fade", () => {
  const output = [];
  const sb = new ScriptBuilder(output, {
    scenes: [
      {
        id: "abc"
      }
    ]
  });
  sb.switchScene("abc");
  expect(output).toEqual([cmd(SWITCH_SCENE), 0, 0, 0, 0, dirDec("down"), 2]);
});

test("Should be able to wait for a number of frames", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.wait(5);
  expect(output).toEqual([cmd(WAIT), 5]);
});

test("Should be able to end the script", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.endScript();
  expect(output).toEqual([cmd(END)]);
});
