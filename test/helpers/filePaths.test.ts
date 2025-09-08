import {
  getROMFileStem,
  getROMFilename,
  kebabCase,
} from "shared/lib/helpers/filePaths";

describe("getROMFileStem", () => {
  test("Should use override where available ignoring file extension", () => {
    expect(getROMFileStem("override.gb", "project")).toBe("override");
  });

  test("Should use override with .gbc extension", () => {
    expect(getROMFileStem("my-game.gbc", "project")).toBe("my-game");
  });

  test("Should use override with .pocket extension", () => {
    expect(getROMFileStem("awesome-game.pocket", "project")).toBe(
      "awesome-game",
    );
  });

  test("Should use override with mixed case extensions", () => {
    expect(getROMFileStem("game.GB", "project")).toBe("game");
    expect(getROMFileStem("game.GBC", "project")).toBe("game");
    expect(getROMFileStem("game.POCKET", "project")).toBe("game");
  });

  test("Should fall back to project name when override is empty", () => {
    expect(getROMFileStem("", "My Project")).toBe("my-project");
  });

  test("Should fall back to project name when override is only whitespace", () => {
    expect(getROMFileStem("   ", "My Project")).toBe("my-project");
  });

  test("Should fall back to project name when override has only invalid characters", () => {
    expect(getROMFileStem("***", "My Project")).toBe("my-project");
  });

  test("Should return 'game' when both override and project name result in empty string", () => {
    expect(getROMFileStem("", "")).toBe("game");
    expect(getROMFileStem("***", "***")).toBe("game");
    expect(getROMFileStem("   ", "   ")).toBe("game");
  });

  test("Should return 'game' when result is only dashes after processing", () => {
    expect(getROMFileStem("---", "")).toBe("game");
    expect(getROMFileStem("", "---")).toBe("game");
    expect(getROMFileStem("-", "-")).toBe("game");
  });

  test("Should handle invalid filename characters in override", () => {
    expect(getROMFileStem("my:game*file", "project")).toBe("mygamefile");
  });

  test("Should handle invalid filename characters in project name when used as fallback", () => {
    expect(getROMFileStem("", "my:project*name")).toBe("myprojectname");
  });

  test("Should convert fallback project name to kebab case", () => {
    expect(getROMFileStem("", "My Amazing Game")).toBe("my-amazing-game");
  });

  test("Should NOT convert override name to kebab case", () => {
    expect(getROMFileStem("My Amazing Game", "project")).toBe(
      "My Amazing Game",
    );
  });

  test("Should handle multiple spaces in override (not converted to kebab case)", () => {
    expect(getROMFileStem("My    Amazing    Game", "project")).toBe(
      "My    Amazing    Game",
    );
  });

  test("Should handle whitespace properly (override preserves spaces, fallback uses kebab-case)", () => {
    expect(getROMFileStem("  My Game  ", "project")).toBe("My Game");
    expect(getROMFileStem("", "  My Game  ")).toBe("my-game");
  });

  test("Should only remove extensions at end of string (regex $ anchor)", () => {
    expect(getROMFileStem("My Game.gb   ", "project")).toBe("My Game.gb");
    expect(getROMFileStem("My Game.gb", "project")).toBe("My Game");
  });

  test("Should handle complex scenarios", () => {
    expect(getROMFileStem("My: Amazing* Game.GB", "project")).toBe(
      "My Amazing Game",
    );
  });

  test("Should handle edge case: only extension", () => {
    expect(getROMFileStem(".gb", "project")).toBe("game");
    expect(getROMFileStem(".gbc", "project")).toBe("game");
  });

  test("Should handle extension in middle of filename", () => {
    expect(getROMFileStem("my.gb.game", "project")).toBe("my.gb.game");
  });

  test("Should preserve periods not at end as extensions", () => {
    expect(getROMFileStem("game.v1.0", "project")).toBe("game.v1.0");
  });

  test("Should handle case sensitivity properly", () => {
    expect(getROMFileStem("MyGame", "project")).toBe("MyGame");
    expect(getROMFileStem("", "MyProject")).toBe("myproject");
  });

  test("Should handle numeric characters", () => {
    expect(getROMFileStem("Game2", "project")).toBe("Game2");
    expect(getROMFileStem("", "Game 2")).toBe("game-2");
  });

  test("Should handle mixed scenarios: override vs fallback behavior", () => {
    // Override preserves original case and spaces (after invalid char removal)
    expect(getROMFileStem("My Special Game", "fallback")).toBe(
      "My Special Game",
    );

    // Fallback uses kebab case
    expect(getROMFileStem("", "My Special Game")).toBe("my-special-game");

    // Override with invalid chars removed but spaces preserved
    expect(getROMFileStem("My*Special:Game", "fallback")).toBe("MySpecialGame");

    // Fallback with invalid chars removed AND kebab case applied
    expect(getROMFileStem("", "My*Special:Game")).toBe("myspecialgame");
  });
});

describe("getROMFilename", () => {
  test("Should return .gb extension for non-color ROM build", () => {
    expect(getROMFilename("my-game", "project", false, "rom")).toBe(
      "my-game.gb",
    );
  });

  test("Should return .gbc extension for color-only ROM build", () => {
    expect(getROMFilename("my-game", "project", true, "rom")).toBe(
      "my-game.gbc",
    );
  });

  test("Should return .pocket extension for pocket build regardless of color setting", () => {
    expect(getROMFilename("my-game", "project", false, "pocket")).toBe(
      "my-game.pocket",
    );
    expect(getROMFilename("my-game", "project", true, "pocket")).toBe(
      "my-game.pocket",
    );
  });

  test("Should return .gbc extension for web build when color is true", () => {
    expect(getROMFilename("my-game", "project", false, "web")).toBe(
      "my-game.gb",
    );
    expect(getROMFilename("my-game", "project", true, "web")).toBe(
      "my-game.gbc",
    );
  });

  test("Should use processed file stem from getROMFileStem", () => {
    expect(getROMFilename("My Amazing Game.gb", "project", false, "rom")).toBe(
      "My Amazing Game.gb",
    );
  });

  test("Should fall back to project name when override is empty", () => {
    expect(getROMFilename("", "My Project", false, "rom")).toBe(
      "my-project.gb",
    );
  });

  test("Should return game.gb when both names are empty", () => {
    expect(getROMFilename("", "", false, "rom")).toBe("game.gb");
  });

  test("Should handle invalid characters in override name", () => {
    expect(getROMFilename("my:game*file", "project", false, "rom")).toBe(
      "mygamefile.gb",
    );
  });

  test("Should handle all build types with complex names", () => {
    const complexName = "My: Amazing* Game.GB";
    expect(getROMFilename(complexName, "project", false, "rom")).toBe(
      "My Amazing Game.gb",
    );
    expect(getROMFilename(complexName, "project", true, "rom")).toBe(
      "My Amazing Game.gbc",
    );
    expect(getROMFilename(complexName, "project", false, "pocket")).toBe(
      "My Amazing Game.pocket",
    );
    expect(getROMFilename(complexName, "project", false, "web")).toBe(
      "My Amazing Game.gb",
    );
  });

  test("Should demonstrate override vs fallback filename behavior", () => {
    // Override preserves case and spaces (invalid chars removed)
    expect(
      getROMFilename("My Game Name", "Fallback Project", false, "rom"),
    ).toBe("My Game Name.gb");

    // Fallback uses kebab case
    expect(getROMFilename("", "Fallback Project", false, "rom")).toBe(
      "fallback-project.gb",
    );

    // Override with extension removed
    expect(getROMFilename("My Game.gb", "Fallback Project", false, "rom")).toBe(
      "My Game.gb",
    );

    // Test all extensions work correctly with override behavior
    expect(getROMFilename("Test Game.gbc", "project", true, "rom")).toBe(
      "Test Game.gbc",
    );
    expect(getROMFilename("Test Game.pocket", "project", false, "pocket")).toBe(
      "Test Game.pocket",
    );
  });
});

describe("kebabCase", () => {
  test("Should convert simple string to lowercase", () => {
    expect(kebabCase("Hello")).toBe("hello");
  });

  test("Should replace single space with dash", () => {
    expect(kebabCase("Hello World")).toBe("hello-world");
  });

  test("Should replace multiple consecutive spaces with single dash", () => {
    expect(kebabCase("Hello    World")).toBe("hello-world");
    expect(kebabCase("Hello       World")).toBe("hello-world");
  });

  test("Should handle multiple words with various spacing", () => {
    expect(kebabCase("My Amazing Game")).toBe("my-amazing-game");
    expect(kebabCase("My  Amazing   Game")).toBe("my-amazing-game");
  });

  test("Should handle empty string", () => {
    expect(kebabCase("")).toBe("");
  });

  test("Should handle string with only spaces", () => {
    expect(kebabCase("   ")).toBe("-");
    expect(kebabCase("     ")).toBe("-");
  });

  test("Should handle mixed case with spaces", () => {
    expect(kebabCase("CamelCase Words")).toBe("camelcase-words");
    expect(kebabCase("UPPERCASE WORDS")).toBe("uppercase-words");
  });

  test("Should handle special characters (only converts spaces)", () => {
    expect(kebabCase("Hello-World_Test")).toBe("hello-world_test");
    expect(kebabCase("Test@Email.com")).toBe("test@email.com");
  });

  test("Should handle leading and trailing spaces", () => {
    expect(kebabCase(" Hello World ")).toBe("-hello-world-");
  });

  test("Should handle numbers and letters", () => {
    expect(kebabCase("Game 2 Player")).toBe("game-2-player");
  });

  test("Should preserve non-space special characters", () => {
    expect(kebabCase("My-Game_v2.0")).toBe("my-game_v2.0");
  });
});
