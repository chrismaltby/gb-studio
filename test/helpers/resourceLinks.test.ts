import {
  createLinkToResource,
  parseLinkedText,
} from "../../src/shared/lib/helpers/resourceLinks";

describe("createLinkToResource", () => {
  it("should create a link for a scene without sceneId", () => {
    const result = createLinkToResource("Main Scene", "scene1", "scene");
    expect(result).toBe("|@@|Main Scene|@|scene1|@|scene|@||@@|");
  });

  it("should create a link for a scene with sceneId", () => {
    const result = createLinkToResource(
      "Main Scene",
      "scene1",
      "scene",
      "parentScene",
    );
    expect(result).toBe("|@@|Main Scene|@|scene1|@|scene|@|parentScene|@@|");
  });

  it("should create a link for an actor", () => {
    const result = createLinkToResource("Player", "actor1", "actor", "scene1");
    expect(result).toBe("|@@|Player|@|actor1|@|actor|@|scene1|@@|");
  });

  it("should create a link for a trigger", () => {
    const result = createLinkToResource(
      "Door Trigger",
      "trigger1",
      "trigger",
      "scene1",
    );
    expect(result).toBe("|@@|Door Trigger|@|trigger1|@|trigger|@|scene1|@@|");
  });

  it("should create a link for a custom event", () => {
    const result = createLinkToResource(
      "Custom Event",
      "event1",
      "customEvent",
    );
    expect(result).toBe("|@@|Custom Event|@|event1|@|customEvent|@||@@|");
  });

  it("should create a link for a sprite", () => {
    const result = createLinkToResource("Player Sprite", "sprite1", "sprite");
    expect(result).toBe("|@@|Player Sprite|@|sprite1|@|sprite|@||@@|");
  });

  it("should handle special characters in label", () => {
    const result = createLinkToResource(
      "Special!@#$%^&*()_+ Scene",
      "scene1",
      "scene",
    );
    expect(result).toBe(
      "|@@|Special!@@@#$%^&*()_+ Scene|@|scene1|@|scene|@||@@|",
    );
  });
});

describe("parseLinkedText", () => {
  it("should parse text with no links", () => {
    const result = parseLinkedText("This is just plain text");
    expect(result).toEqual([
      { type: "text", value: "This is just plain text" },
    ]);
  });

  it("should parse text with a single scene link", () => {
    const result = parseLinkedText(
      "Go to |@@|Main Scene|@|scene1|@|scene|@||@@| now",
    );
    expect(result).toEqual([
      { type: "text", value: "Go to " },
      {
        type: "link",
        linkText: "Main Scene",
        entityId: "scene1",
        entityType: "scene",
      },
      { type: "text", value: " now" },
    ]);
  });

  it("should parse text with multiple links", () => {
    const result = parseLinkedText(
      "Visit |@@|Scene A|@|sceneA|@|scene|@||@@| and talk to |@@|Player|@|actor1|@|actor|@||@@|",
    );
    expect(result).toEqual([
      { type: "text", value: "Visit " },
      {
        type: "link",
        linkText: "Scene A",
        entityId: "sceneA",
        entityType: "scene",
      },
      { type: "text", value: " and talk to " },
      {
        type: "link",
        linkText: "Player",
        entityId: "actor1",
        entityType: "actor",
      },
    ]);
  });

  it("should parse different entity types", () => {
    const result = parseLinkedText(
      "|@@|Scene|@|s1|@|scene|@||@@| |@@|Actor|@|a1|@|actor|@||@@| |@@|Trigger|@|t1|@|trigger|@||@@| |@@|Event|@|e1|@|customEvent|@||@@| |@@|Sprite|@|sp1|@|sprite|@||@@|",
    );
    expect(result).toHaveLength(9); // 5 links + 4 spaces
    expect(result[0]).toEqual({
      type: "link",
      linkText: "Scene",
      entityId: "s1",
      entityType: "scene",
    });
    expect(result[2]).toEqual({
      type: "link",
      linkText: "Actor",
      entityId: "a1",
      entityType: "actor",
    });
    expect(result[4]).toEqual({
      type: "link",
      linkText: "Trigger",
      entityId: "t1",
      entityType: "trigger",
    });
    expect(result[6]).toEqual({
      type: "link",
      linkText: "Event",
      entityId: "e1",
      entityType: "customEvent",
    });
    expect(result[8]).toEqual({
      type: "link",
      linkText: "Sprite",
      entityId: "sp1",
      entityType: "sprite",
    });
  });

  it("should handle consecutive links", () => {
    const result = parseLinkedText(
      "|@@|Link1|@|id1|@|scene|@||@@||@@|Link2|@|id2|@|actor|@||@@|",
    );
    expect(result).toEqual([
      { type: "link", linkText: "Link1", entityId: "id1", entityType: "scene" },
      { type: "link", linkText: "Link2", entityId: "id2", entityType: "actor" },
    ]);
  });

  it("should handle text at beginning and end", () => {
    const result = parseLinkedText("Start |@@|Middle|@|id1|@|scene|@||@@| End");
    expect(result).toEqual([
      { type: "text", value: "Start " },
      {
        type: "link",
        linkText: "Middle",
        entityId: "id1",
        entityType: "scene",
      },
      { type: "text", value: " End" },
    ]);
  });

  it("should handle empty text", () => {
    const result = parseLinkedText("");
    expect(result).toEqual([]);
  });

  it("should handle malformed links (no closing delimiter)", () => {
    const result = parseLinkedText("Start |@@|Incomplete link");
    expect(result).toEqual([
      { type: "text", value: "Start |@@|Incomplete link" },
    ]);
  });

  it("should handle special characters in link text", () => {
    const result = parseLinkedText(
      "|@@|Special!@#$%^&*()_+ Scene|@|scene1|@|scene|@||@@|",
    );
    expect(result).toEqual([
      {
        type: "link",
        linkText: "Special!@#$%^&*()_+ Scene",
        entityId: "scene1",
        entityType: "scene",
      },
    ]);
  });

  it("should handle escape codes in link text", () => {
    const result = parseLinkedText(
      createLinkToResource("FOO|@|BAR", "entity1", "sprite"),
    );
    expect(result).toEqual([
      {
        type: "link",
        linkText: "FOO|@|BAR",
        entityId: "entity1",
        entityType: "sprite",
      },
    ]);
  });

  it("should handle link at the very beginning", () => {
    const result = parseLinkedText(
      "|@@|Start Link|@|id1|@|scene|@||@@| followed by text",
    );
    expect(result).toEqual([
      {
        type: "link",
        linkText: "Start Link",
        entityId: "id1",
        entityType: "scene",
      },
      { type: "text", value: " followed by text" },
    ]);
  });

  it("should handle link at the very end", () => {
    const result = parseLinkedText(
      "Text before |@@|End Link|@|id1|@|scene|@||@@|",
    );
    expect(result).toEqual([
      { type: "text", value: "Text before " },
      {
        type: "link",
        linkText: "End Link",
        entityId: "id1",
        entityType: "scene",
      },
    ]);
  });

  it("should parse actors with scenes included", () => {
    const result = parseLinkedText(
      "|@@|Gardner|@|871ea302-1cc1-463c-b9d7-530aac38fe81|@|actor|@|f8f027ef-b818-4038-9eda-0ac477facb41|@@|",
    );
    expect(result).toEqual([
      {
        type: "link",
        linkText: "Gardner",
        entityId: "871ea302-1cc1-463c-b9d7-530aac38fe81",
        entityType: "actor",
        sceneId: "f8f027ef-b818-4038-9eda-0ac477facb41",
      },
    ]);
  });
});
