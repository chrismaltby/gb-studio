/**
 * @jest-environment jsdom
 */

import React from "react";
import { SearchableCard } from "../../../../src/components/ui/cards/SearchableCard";
import { render, screen } from "../../../react-utils";

test("Should show card if search term matches term from list", () => {
  render(
    <SearchableCard searchTerm="Test" searchMatches={["Test"]}>
      Visible
    </SearchableCard>
  );
  expect(screen.getByText("Visible")).toBeInTheDocument();
});

test("Should not show card if search term doesn't match term from list", () => {
  render(
    <SearchableCard searchTerm="Test" searchMatches={["Not Matching"]}>
      Visible
    </SearchableCard>
  );
  expect(screen.queryByText("Visible")).toBeNull();
});

test("Should use case insentivie match to determine if card should display", () => {
  render(
    <SearchableCard searchTerm="test" searchMatches={["Test"]}>
      Visible
    </SearchableCard>
  );
  expect(screen.getByText("Visible")).toBeInTheDocument();
});

test("Should only require a single match to be visible", () => {
  render(
    <SearchableCard
      searchTerm="TestB"
      searchMatches={["TestA", "TestB", "TestC"]}
    >
      Visible
    </SearchableCard>
  );
  expect(screen.getByText("Visible")).toBeInTheDocument();
});

test("Should allow partial matches", () => {
  render(
    <SearchableCard searchTerm="Test" searchMatches={["TestB"]}>
      Visible
    </SearchableCard>
  );
  expect(screen.getByText("Visible")).toBeInTheDocument();
});

test("Should display if no searchterm provided", () => {
  render(<SearchableCard searchMatches={["TestB"]}>Visible</SearchableCard>);
  expect(screen.getByText("Visible")).toBeInTheDocument();
});

test("Should display if empty searchterm provided", () => {
  render(
    <SearchableCard searchTerm="" searchMatches={["TestB"]}>
      Visible
    </SearchableCard>
  );
  expect(screen.getByText("Visible")).toBeInTheDocument();
});

test("Should display if no search matches provided", () => {
  render(<SearchableCard searchTerm="Anything">Visible</SearchableCard>);
  expect(screen.getByText("Visible")).toBeInTheDocument();
});
