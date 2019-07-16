import migrateProject from "../../src/lib/project/migrateProject";

test("should migrate conditional events from 1.0.0 to 1.2.0", () => {
  const oldProject = {
    _version: "1",
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            command: "EVENT_IF_TRUE",
            true: [
              {
                command: "EVENT_TEXT",
                args: {
                  text: "Hello"
                }
              }
            ],
            false: [
              {
                command: "EVENT_TEXT",
                args: {
                  text: "World"
                }
              }
            ]
          }
        ]
      }
    ],
    backgrounds: []
  };
  const newProject = JSON.parse(JSON.stringify(migrateProject(oldProject)));
  expect(newProject).toEqual({
    _version: "1.2.0",
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            command: "EVENT_IF_TRUE",
            children: {
              true: [
                {
                  command: "EVENT_TEXT",
                  args: {
                    text: "Hello"
                  }
                }
              ],
              false: [
                {
                  command: "EVENT_TEXT",
                  args: {
                    text: "World"
                  }
                }
              ]
            }
          }
        ]
      }
    ],
    backgrounds: []
  });
});
