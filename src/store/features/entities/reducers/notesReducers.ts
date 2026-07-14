import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import {
  defaultLocalisedNoteName,
  applyReparentEntityToCollection,
} from "shared/lib/entities/entitiesHelpers";
import { Note } from "shared/lib/resources/types";
import { notesAdapter } from "store/features/entities/adapters";
import { localNoteSelectTotal } from "store/features/entities/helpers";
import { MIN_WORLD_ENTITY_X, MIN_WORLD_ENTITY_Y } from "consts";

const MIN_NOTE_WIDTH = 20;
const MIN_NOTE_HEIGHT = 3;
const DEFAULT_NOTE_WIDTH = 20;
const DEFAULT_NOTE_HEIGHT = 15;

const addNote: CaseReducer<
  EntitiesState,
  PayloadAction<{
    noteId: string;
    x: number;
    y: number;
  }>
> = (state, action) => {
  const notesTotal = localNoteSelectTotal(state);

  const newNote: Note = {
    name: defaultLocalisedNoteName(notesTotal),
    id: action.payload.noteId,
    x: Math.max(MIN_WORLD_ENTITY_X, action.payload.x),
    y: Math.max(MIN_WORLD_ENTITY_Y, action.payload.y),
    width: DEFAULT_NOTE_WIDTH,
    height: DEFAULT_NOTE_HEIGHT,
    content: "",
  };

  notesAdapter.addOne(state.notes, newNote);
};

const editNote: CaseReducer<
  EntitiesState,
  PayloadAction<{ noteId: string; changes: Partial<Note> }>
> = (state, action) => {
  const note = state.notes.entities[action.payload.noteId];
  const patch = { ...action.payload.changes };

  if (!note) {
    return;
  }

  if (patch.width !== undefined) {
    patch.width = Math.max(MIN_NOTE_WIDTH, patch.width);
  }

  if (patch.height !== undefined) {
    patch.height = Math.max(MIN_NOTE_HEIGHT, patch.height);
  }

  notesAdapter.updateOne(state.notes, {
    id: action.payload.noteId,
    changes: patch,
  });
};

const removeNote: CaseReducer<
  EntitiesState,
  PayloadAction<{
    noteId: string;
  }>
> = (state, action) => {
  notesAdapter.removeOne(state.notes, action.payload.noteId);
};

const removeNotes: CaseReducer<
  EntitiesState,
  PayloadAction<{
    noteIds: string[];
  }>
> = (state, action) => {
  notesAdapter.removeMany(state.notes, action.payload.noteIds);
};

const reparentNote: CaseReducer<
  EntitiesState,
  PayloadAction<{
    noteId: string;
    toPath: string;
  }>
> = (state, action) => {
  applyReparentEntityToCollection(
    state.notes.entities,
    action.payload.noteId,
    action.payload.toPath,
  );
};

const notesReducers = {
  addNote: {
    reducer: addNote,
    prepare: (payload: { x: number; y: number }) => {
      return {
        payload: {
          ...payload,
          noteId: uuid(),
        },
      };
    },
  },

  editNote,
  removeNote,
  removeNotes,
  reparentNote,
} satisfies SliceCaseReducers<EntitiesState>;

export default notesReducers;
