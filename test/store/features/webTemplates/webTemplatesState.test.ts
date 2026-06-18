import reducer, {
  actions,
  initialState,
} from "store/features/webTemplates/webTemplatesState";

describe("webTemplatesState", () => {
  it("replaces the discovered web template list", () => {
    const templates = [
      { id: "local", name: "Local Template" },
      { id: "plugins/example/plugin", name: "Plugin Template" },
    ];

    const state = reducer(initialState, actions.setWebTemplates(templates));

    expect(state.templates).toEqual(templates);
  });
});
