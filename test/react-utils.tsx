import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { AnyAction, Store } from "@reduxjs/toolkit";
import { RootState } from "../src/store/configureStore";
import ThemeProvider from "../src/components/ui/theme/ThemeProvider";

type RenderParameters = Parameters<typeof render>;

const customRender = (
  ui: RenderParameters[0],
  store?: Store<RootState, AnyAction>,
  options?: RenderParameters[1]
) => {
  return render(ui, {
    wrapper: store
      ? ({ children }) => (
          <Provider store={store}>
            <ThemeProvider>{children}</ThemeProvider>
          </Provider>
        )
      : ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    ...options,
  });
};

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };
