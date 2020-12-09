import ScriptBuilder from "../../../src/lib/compiler/scriptBuilder2";
import { ScriptEvent } from "../../../src/store/features/entities/entitiesTypes";

test("Should be able to set active actor to player", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    scene: {
      id: "scene1",
      actors: [
        {
          id: "actor1",
        },
      ],
    },
    entity: {
      id: "actor1",
    },
  });
  sb.actorSetActive("player");
  expect(output).toEqual([
    "        VM_PUSH         0",
    "        VM_SET          ACTOR, .ARG0",
    "        VM_INVOKE       b_vm_actor_activate, _vm_actor_activate, 1, .ARG0",
  ]);
});

test("Should be able to set active actor to actor by id", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    scene: {
      id: "scene1",
      actors: [
        {
          id: "actor1",
        },
        {
          id: "actor2",
        },
      ],
    },
  });
  sb.actorSetActive("actor2");
  expect(output).toEqual([
    "        VM_PUSH         2",
    "        VM_SET          ACTOR, .ARG0",
    "        VM_INVOKE       b_vm_actor_activate, _vm_actor_activate, 1, .ARG0",
  ]);
});

test("Should be able to move actor to new location", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    scene: {
      id: "scene1",
      actors: [],
    },
  });
  sb.actorMoveTo(5, 6, true, "horizontal");
  expect(output).toEqual([
    "        VM_SET_CONST    ^/ACTOR + 1/, 5",
    "        VM_SET_CONST    ^/ACTOR + 2/, 6",
    "        VM_SET_CONST    ^/ACTOR + 3/, 1",
    "        VM_SET_CONST    ^/ACTOR + 4/, 0",
    "        VM_ACTOR_MOVE_TO ACTOR",
  ]);
});

test("Should be able to wait for N frames to pass", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    scene: {
      id: "scene1",
      actors: [],
    },
  });
  sb.wait(20);
  expect(output).toEqual([
    "        VM_PUSH         20",
    "        VM_INVOKE       b_wait_frames, _wait_frames, 1, .ARG0",
  ]);
});

test("Should be able to generate script string", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    scene: {
      id: "scene1",
      actors: [
        {
          id: "actor1",
        },
        {
          id: "actor2",
        },
      ],
    },
  });
  sb.actorSetActive("actor2");
  sb.actorMoveTo(5, 6, true, "horizontal");
  expect(sb.toScriptString("MY_SCRIPT")).toEqual(
    `.include "vm.inc"

.globl b_vm_actor_activate, _vm_actor_activate

.area _CODE_255

___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

MY_SCRIPT::
        VM_PUSH         2
        VM_SET          ACTOR, .ARG0
        VM_INVOKE       b_vm_actor_activate, _vm_actor_activate, 1, .ARG0
        VM_SET_CONST    ^/ACTOR + 1/, 5
        VM_SET_CONST    ^/ACTOR + 2/, 6
        VM_SET_CONST    ^/ACTOR + 3/, 1
        VM_SET_CONST    ^/ACTOR + 4/, 0
        VM_ACTOR_MOVE_TO ACTOR
`
  );
});

test("Should be able to open dialogue boxes", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    scene: {
      id: "scene1",
      actors: [],
    },
  });
  sb.textDialogue("Hello World");
  sb.scriptEnd();

  expect(sb.toScriptString("MY_SCRIPT")).toEqual(
    `.include "vm.inc"

.globl b_ui_text, _ui_text

.area _CODE_255

___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

MY_SCRIPT::
        VM_INVOKE       b_ui_text, _ui_text, 0, 0
        .asciz \"Hello World\"
        VM_STOP
`
  );
});

test("Should be able to conditionally execute if variable is true with event array paths", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    scene: {
      id: "scene1",
      actors: [],
    },
    variables: ["0", "1"],
    compileEvents: (events: ScriptEvent[]) => {
      if (events[0].id === "event1") {
        output.push("        VM_DEBUG        0");
        output.push('        .asciz "True Path"');
      } else {
        output.push("        VM_DEBUG        0");
        output.push('        .asciz "False Path"');
      }
    },
  });
  sb.ifVariableTrue(
    "1",
    [
      {
        id: "event1",
        command: "DUMMY1",
        args: {},
      },
    ],
    [
      {
        id: "event2",
        command: "DUMMY2",
        args: {},
      },
    ]
  );
  expect(sb.toScriptString("MY_SCRIPT")).toEqual(
    `.include "vm.inc"

.area _CODE_255

___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

MY_SCRIPT::
        VM_PUSH         1
        VM_IF .EQ       1, .ARG0, 1$, 1
        VM_DEBUG        0
        .asciz "False Path"
        VM_JUMP         2$
1$:
        VM_DEBUG        0
        .asciz "True Path"
2$:
`
  );
});

test("Should be able to conditionally execute if variable is true with function paths", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    scene: {
      id: "scene1",
      actors: [
        {
          id: "actor1",
        },
        {
          id: "actor2",
        },
      ],
    },
    variables: ["0", "1"],
    compileEvents: (events: ScriptEvent[]) => {
      if (events[0].id === "event1") {
        output.push("        VM_DEBUG        0");
        output.push('        .asciz "True Path"');
      } else {
        output.push("        VM_DEBUG        0");
        output.push('        .asciz "False Path"');
      }
    },
  });
  sb.ifVariableTrue(
    "0",
    () => sb.textDialogue("Hello World"),
    () => sb.textDialogue("Goodbye World")
  );
  sb.scriptEnd();

  expect(sb.toScriptString("MY_SCRIPT")).toEqual(
    `.include "vm.inc"

.globl b_ui_text, _ui_text

.area _CODE_255

___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

MY_SCRIPT::
        VM_PUSH         1
        VM_IF .EQ       0, .ARG0, 1$, 1
        VM_INVOKE       b_ui_text, _ui_text, 0, 0
        .asciz "Goodbye World"
        VM_JUMP         2$
1$:
        VM_INVOKE       b_ui_text, _ui_text, 0, 0
        .asciz "Hello World"
2$:
        VM_STOP
`
  );
});

test("Should be able to conditionally execute if variable is true with nested function paths", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    scene: {
      id: "scene1",
      actors: [
        {
          id: "actor1",
        },
        {
          id: "actor2",
        },
        {
          id: "actor3",
        },
        {
          id: "actor4",
        },
      ],
    },
    variables: ["0", "1", "2"],
  });

  sb.ifVariableTrue(
    "0",
    // 0 == True
    () =>
      sb.ifVariableTrue(
        "1",
        () => sb.textDialogue("0=TRUE 1=TRUE"), // 1 == True
        () => sb.textDialogue("0=TRUE 1=FALSE") // 1 == False
      ),
    // 0 == False
    () =>
      sb.ifVariableTrue(
        "2",
        () => sb.textDialogue("0=FALSE 2=TRUE"), // 2 == True
        () => sb.textDialogue("0=FALSE 2=FALSE") // 2 == False
      )
  );
  sb.scriptEnd();

  expect(sb.toScriptString("MY_SCRIPT")).toEqual(
    `.include "vm.inc"

.globl b_ui_text, _ui_text

.area _CODE_255

___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

MY_SCRIPT::
        VM_PUSH         1
        VM_IF .EQ       0, .ARG0, 1$, 1
        VM_PUSH         1
        VM_IF .EQ       2, .ARG0, 3$, 1
        VM_INVOKE       b_ui_text, _ui_text, 0, 0
        .asciz "0=FALSE 2=FALSE"
        VM_JUMP         4$
3$:
        VM_INVOKE       b_ui_text, _ui_text, 0, 0
        .asciz "0=FALSE 2=TRUE"
4$:
        VM_JUMP         2$
1$:
        VM_PUSH         1
        VM_IF .EQ       1, .ARG0, 5$, 1
        VM_INVOKE       b_ui_text, _ui_text, 0, 0
        .asciz "0=TRUE 1=FALSE"
        VM_JUMP         6$
5$:
        VM_INVOKE       b_ui_text, _ui_text, 0, 0
        .asciz "0=TRUE 1=TRUE"
6$:
2$:
        VM_STOP
`
  );
});

test("Should be able to define labels and jump", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    scene: {
      id: "scene1",
      actors: [],
    },
  });
  sb.labelDefine("mylabel");
  sb.labelGoto("mylabel");

  expect(sb.toScriptString("MY_SCRIPT")).toEqual(
    `.include "vm.inc"

.area _CODE_255

___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

MY_SCRIPT::
_mylabel$:
        VM_JUMP         _mylabel$
`
  );
});

test("Should be able to define labels and jump", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    scene: {
      id: "scene1",
      actors: [],
    },
  });
  sb.labelDefine("mylabel");
  sb.labelGoto("mylabel");

  expect(sb.toScriptString("MY_SCRIPT")).toEqual(
    `.include "vm.inc"

.area _CODE_255

___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

MY_SCRIPT::
_mylabel$:
        VM_JUMP         _mylabel$
`
  );
});

test("Should throw if jump to label is not stack neutral", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    scene: {
      id: "scene1",
      actors: [
        {
          id: "actor1",
        },
      ],
    },
    entity: {
      id: "actor1",
    },
  });
  sb._stackPush(5);
  sb._label("abc");
  sb._stackPop(1);
  expect(() => sb._jump("abc")).toThrow();
});
