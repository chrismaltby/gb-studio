/* eslint-disable import/export */
import { render, RenderOptions } from "@testing-library/react";
import type { Store, UnknownAction } from "@reduxjs/toolkit";
import React, { ReactNode, ReactElement } from "react";
import ThemeProvider from "../src/components/ui/theme/ThemeProvider";
import type { RootState } from "../src/store/storeTypes";
import { Provider } from "react-redux";

interface ProvidersProps {
  children: ReactNode;
  store?: Store<RootState, UnknownAction>;
}

const AllTheProviders = ({ children, store }: ProvidersProps) => {
  return store ? (
    <Provider store={store}>
      <ThemeProvider>{children}</ThemeProvider>
    </Provider>
  ) : (
    <ThemeProvider>{children}</ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  store?: Store<RootState, UnknownAction>,
  options?: Omit<RenderOptions, "wrapper">,
) =>
  render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders store={store}>{children}</AllTheProviders>
    ),
    ...options,
  });

// re-export everything
export * from "@testing-library/react";

export { customRender as render };
