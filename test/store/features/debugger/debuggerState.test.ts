import reducer, {
  initialState,
  DebuggerState,
  actions,
} from "../../../../src/store/features/debugger/debuggerState";

test("Should open the build log on any console errors", () => {
  const state: DebuggerState = {
    ...initialState,
    activePane: "debugger",
  };
  const action = actions.setActivePane("buildLog");

  const newState = reducer(state, action);
  expect(newState.activePane).toBe("buildLog");
});

test("stores project data usage table controls", () => {
  const withSearch = reducer(
    initialState,
    actions.setDataUsageSearchTerm("song"),
  );
  const withFilter = reducer(withSearch, actions.setDataUsageFilter("music"));
  const withSort = reducer(withFilter, actions.setDataUsageSortKey("name"));
  const state = reducer(withSort, actions.setDataUsageSortAsc(true));

  expect(state.dataUsageSearchTerm).toBe("song");
  expect(state.dataUsageFilter).toBe("music");
  expect(state.dataUsageSortKey).toBe("name");
  expect(state.dataUsageSortAsc).toBe(true);
});
