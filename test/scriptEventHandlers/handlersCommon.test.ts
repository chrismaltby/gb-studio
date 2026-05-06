import {
  stripFieldsMarkdown,
  stripMarkdown,
} from "lib/scriptEventsHandlers/handlerCommon";

describe("stripMarkdown", () => {
  it("should return undefined if input is undefined", () => {
    expect(stripMarkdown(undefined)).toBeUndefined();
  });

  it("should strip Markdown links from text", () => {
    expect(stripMarkdown("This is a [link](https://example.com)")).toBe(
      "This is a link",
    );
  });
});

describe("stripFieldsMarkdown", () => {
  it("should return an empty array if input is undefined", () => {
    expect(stripFieldsMarkdown(undefined)).toEqual([]);
  });

  it("should strip Markdown from field descriptions", () => {
    const fields = [
      {
        name: "field1",
        type: "text",
        description: "This is a [link](https://example.com)",
      },
    ];
    expect(stripFieldsMarkdown(fields)).toEqual([
      {
        name: "field1",
        type: "text",
        description: "This is a link",
      },
    ]);
  });

  it("should preserve nested group fields", () => {
    const fields = [
      {
        name: "group1",
        type: "group",
        fields: [
          {
            name: "field1",
            type: "text",
            description: "This is a [link](https://example.com)",
          },
        ],
      },
    ];
    expect(stripFieldsMarkdown(fields)).toEqual([
      {
        name: "group1",
        type: "group",
        fields: [
          {
            name: "field1",
            type: "text",
            description: "This is a link",
          },
        ],
      },
    ]);
  });
});
