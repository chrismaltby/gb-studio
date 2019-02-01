import compile, {
  precompileFlags
} from "../../../src/lib/data/compiler/compileData";

test("should compile simple project into files object", () => {
  const project = {
    startSceneId: "1",
    startX: 5,
    startY: 6,
    startDirection: "down",
    scenes: [
      {
        id: "1",
        name: "first_scene",
        imageId: "2"
      }
    ],
    images: [
      {
        id: "2",
        name: "test_img",
        width: 20,
        height: 18,
        filename: "test_img.png"
      }
    ]
  };

  const compiled = compile(project);
  expect(compiled).toBeInstanceOf(Object);
});

test("should walk all scene events to build list of used flags", () => {
  const scenes = [
    {
      id: "1",
      actors: [
        {
          id: "2",
          events: [
            {
              id: "3",
              command: "IF_FLAG",
              args: { flag: "9" },
              true: [
                {
                  id: "4",
                  command: "TEXT",
                  args: { text: "LINE 2" }
                },
                {
                  id: "5",
                  command: "END"
                }
              ],
              false: [
                {
                  id: "6",
                  command: "SET_FLAG",
                  args: { flag: "9" }
                },
                {
                  id: "7",
                  command: "TEXT",
                  args: { text: "LINE 1" }
                },
                {
                  id: "8",
                  command: "END"
                }
              ]
            },
            {
              id: "9",
              command: "END"
            }
          ]
        }
      ],
      triggers: [
        {
          id: "10",
          events: [
            {
              id: "11",
              command: "SET_FLAG",
              args: { flag: "10" }
            },
            {
              id: "12",
              command: "SET_FLAG",
              args: { flag: "9" }
            },
            {
              id: "13",
              command: "END"
            }
          ]
        }
      ]
    }
  ];
  const precompiledFlags = precompileFlags(scenes);
  expect(precompiledFlags).toEqual(["9", "10"]);
});
