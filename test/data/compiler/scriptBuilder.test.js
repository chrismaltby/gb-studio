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
  END,
  SET_VALUE,
  LOAD_VECTORS,
  COPY_VALUE,
  SET_RANDOM_VALUE,
  MATH_ADD_VALUE,
  MATH_SUB_VALUE,
  MATH_MUL_VALUE,
  MATH_DIV_VALUE,
  MATH_MOD_VALUE,
  MUSIC_PLAY,
  MUSIC_STOP,
  CAMERA_MOVE_TO,
  CAMERA_LOCK,
  CAMERA_SHAKE
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

test("Should set missing or empty of frame to 0", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.actorSetFrame();
  sb.actorSetFrame("");
  expect(output).toEqual([cmd(ACTOR_SET_FRAME), 0, cmd(ACTOR_SET_FRAME), 0]);
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
  sb.setVariableToTrue("0");
  expect(output).toEqual([cmd(SET_TRUE), 0, 0]);
});

test("Should be able to set variable to false", () => {
  const output = [];
  const sb = new ScriptBuilder(output, { variables: ["0", "1"] });
  sb.setVariableToFalse("1");
  expect(output).toEqual([cmd(SET_FALSE), 0, 1]);
});

test("Should be able to set variable to value", () => {
  const output = [];
  const sb = new ScriptBuilder(output, { variables: ["0"] });
  sb.setVariableToValue("0", 5);
  expect(output).toEqual([cmd(SET_VALUE), 0, 0, 5]);
});

test("Should be able to copy one variable to another", () => {
  const output = [];
  const sb = new ScriptBuilder(output, { variables: ["0", "1"] });
  sb.copyVariable("0", "1");
  expect(output).toEqual([cmd(LOAD_VECTORS), 0, 0, 0, 1, cmd(COPY_VALUE)]);
});

test("Should be able to set variable to random number", () => {
  const output = [];
  const sb = new ScriptBuilder(output, { variables: ["0"] });
  sb.setVariableToRandom("0", 10, 50);
  expect(output).toEqual([cmd(SET_RANDOM_VALUE), 0, 0, 10, 50]);
});

test("Should be able to add variables", () => {
  const output = [];
  const sb = new ScriptBuilder(output, { variables: ["0", "1"] });
  sb.variablesAdd("0", "1");
  expect(output).toEqual([cmd(LOAD_VECTORS), 0, 0, 0, 1, cmd(MATH_ADD_VALUE)]);
});

test("Should be able to subtract variables", () => {
  const output = [];
  const sb = new ScriptBuilder(output, { variables: ["0", "1"] });
  sb.variablesSub("1", "0");
  expect(output).toEqual([cmd(LOAD_VECTORS), 0, 1, 0, 0, cmd(MATH_SUB_VALUE)]);
});

test("Should be able to multiply variables", () => {
  const output = [];
  const sb = new ScriptBuilder(output, { variables: ["0", "1"] });
  sb.variablesMul("1", "0");
  expect(output).toEqual([cmd(LOAD_VECTORS), 0, 1, 0, 0, cmd(MATH_MUL_VALUE)]);
});

test("Should be able to divide variables", () => {
  const output = [];
  const sb = new ScriptBuilder(output, { variables: ["0", "1", "2"] });
  sb.variablesDiv("2", "1");
  expect(output).toEqual([cmd(LOAD_VECTORS), 0, 2, 0, 1, cmd(MATH_DIV_VALUE)]);
});

test("Should be able to modulus variables", () => {
  const output = [];
  const sb = new ScriptBuilder(output, { variables: ["0", "1"] });
  sb.variablesMod("0", "1");
  expect(output).toEqual([cmd(LOAD_VECTORS), 0, 0, 0, 1, cmd(MATH_MOD_VALUE)]);
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

test("Should be able to move camera to position", () => {
  const output = [];
  const sb = new ScriptBuilder(output, {
    scene: {
      width: 32,
      height: 28
    }
  });
  sb.cameraMoveTo(5, 6, 0);
  expect(output).toEqual([cmd(CAMERA_MOVE_TO), 5, 6, 0]);
});

test("Should limit camera position to screen bounds", () => {
  const output = [];
  const sb = new ScriptBuilder(output, {
    scene: {
      width: 32,
      height: 28
    }
  });
  sb.cameraMoveTo(40, 20, 0);
  expect(output).toEqual([cmd(CAMERA_MOVE_TO), 12, 10, 0]);
});

test("Should set camera move speed flag", () => {
  const output = [];
  const sb = new ScriptBuilder(output, {
    scene: {
      width: 32,
      height: 28
    }
  });
  sb.cameraMoveTo(5, 6, 2);
  expect(output).toEqual([cmd(CAMERA_MOVE_TO), 5, 6, 35]);
});

test("Should be able to lock camera to player position", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.cameraLock(0);
  expect(output).toEqual([cmd(CAMERA_LOCK), 0]);
});

test("Should be able to lock camera with speed flag", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.cameraLock(3);
  expect(output).toEqual([cmd(CAMERA_LOCK), 39]);
});

test("Should be able to shake camera for a number of frames", () => {
  const output = [];
  const sb = new ScriptBuilder(output);
  sb.cameraShake(3);
  expect(output).toEqual([cmd(CAMERA_SHAKE), 3]);
});

test("Should be able to play music", () => {
  const output = [];
  const sb = new ScriptBuilder(output, {
    music: [
      {
        id: "1"
      }
    ]
  });
  sb.playMusic("1", false);
  expect(output).toEqual([cmd(MUSIC_PLAY), 0, 0]);
});

test("Should be able to loop music", () => {
  const output = [];
  const sb = new ScriptBuilder(output, {
    music: [
      {
        id: "1"
      }
    ]
  });
  sb.playMusic("1", true);
  expect(output).toEqual([cmd(MUSIC_PLAY), 0, 1]);
});

test("Should skip missing music", () => {
  const output = [];
  const sb = new ScriptBuilder(output, {
    music: [
      {
        id: "1"
      }
    ]
  });
  sb.playMusic("2", true);
  expect(output).toEqual([]);
});

test("Should be able to stop music", () => {
  const output = [];
  const sb = new ScriptBuilder(output, {
    music: [
      {
        id: "1"
      }
    ]
  });
  sb.stopMusic();
  expect(output).toEqual([cmd(MUSIC_STOP)]);
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
