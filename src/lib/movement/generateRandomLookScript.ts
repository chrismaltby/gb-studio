import uuid from "uuid/v4";

const generateRandomLookScript = () => {
  return [
    {
      id: uuid(),
      command: "EVENT_WAIT",
      args: {
        time: 1,
      },
    },
    {
      id: uuid(),
      command: "EVENT_VARIABLE_MATH",
      args: {
        vectorX: "T0",
        operation: "set",
        other: "rnd",
        vectorY: "T0",
        value: "1",
        minValue: "0",
        maxValue: 5,
      },
    },
    {
      id: uuid(),
      command: "EVENT_SWITCH",
      args: {
        variable: "T0",
        choices: 4,
        __collapseCase0: false,
        value0: 1,
        __collapseCase1: false,
        value1: 2,
        __collapseCase2: false,
        value2: 3,
        __collapseCase3: false,
        value3: 4,
        __collapseCase4: false,
        value4: 5,
        __collapseCase5: false,
        value5: 6,
        __collapseCase6: false,
        value6: 7,
        __collapseCase7: false,
        value7: 8,
        __collapseCase8: false,
        value8: 9,
        __collapseCase9: false,
        value9: 10,
        __collapseCase10: false,
        value10: 11,
        __collapseCase11: false,
        value11: 12,
        __collapseCase12: false,
        value12: 13,
        __collapseCase13: false,
        value13: 14,
        __collapseCase14: false,
        value14: 15,
        __collapseCase15: false,
        value15: 16,
        __collapseElse: false,
      },
      children: {
        true0: [
          {
            id: uuid(),
            command: "EVENT_ACTOR_SET_DIRECTION",
            args: {
              actorId: "$self$",
              direction: {
                type: "direction",
                value: "left",
              },
            },
          },
          {
            id: uuid(),
            command: "EVENT_END",
          },
        ],
        true1: [
          {
            id: uuid(),
            command: "EVENT_ACTOR_SET_DIRECTION",
            args: {
              actorId: "$self$",
              direction: {
                type: "direction",
                value: "up",
              },
            },
          },
          {
            id: uuid(),
            command: "EVENT_END",
          },
        ],
        true2: [
          {
            id: uuid(),
            command: "EVENT_ACTOR_SET_DIRECTION",
            args: {
              actorId: "$self$",
              direction: {
                type: "direction",
                value: "down",
              },
            },
          },
          {
            id: uuid(),
            command: "EVENT_END",
          },
        ],
        true3: [
          {
            id: uuid(),
            command: "EVENT_ACTOR_SET_DIRECTION",
            args: {
              actorId: "$self$",
              direction: {
                type: "direction",
                value: "right",
              },
            },
          },
          {
            id: uuid(),
            command: "EVENT_END",
          },
        ],
        true4: [
          {
            id: uuid(),
            command: "EVENT_END",
          },
        ],
        true5: [
          {
            id: uuid(),
            command: "EVENT_END",
          },
        ],
        true6: [
          {
            id: uuid(),
            command: "EVENT_END",
          },
        ],
        true7: [
          {
            id: uuid(),
            command: "EVENT_END",
          },
        ],
        true8: [
          {
            id: uuid(),
            command: "EVENT_END",
          },
        ],
        true9: [
          {
            id: uuid(),
            command: "EVENT_END",
          },
        ],
        true10: [
          {
            id: uuid(),
            command: "EVENT_END",
          },
        ],
        true11: [
          {
            id: uuid(),
            command: "EVENT_END",
          },
        ],
        true12: [
          {
            id: uuid(),
            command: "EVENT_END",
          },
        ],
        true13: [
          {
            id: uuid(),
            command: "EVENT_END",
          },
        ],
        true14: [
          {
            id: uuid(),
            command: "EVENT_END",
          },
        ],
        true15: [
          {
            id: uuid(),
            command: "EVENT_END",
          },
        ],
        false: [
          {
            id: uuid(),
            command: "EVENT_WAIT",
            args: {
              time: 0.5,
            },
          },
          {
            id: uuid(),
            command: "EVENT_END",
          },
        ],
      },
    },
    {
      id: uuid(),
      command: "EVENT_END",
    },
  ];
};

export default generateRandomLookScript;
