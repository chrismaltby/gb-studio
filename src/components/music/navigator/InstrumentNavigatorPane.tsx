import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FlatList } from "ui/lists/FlatList";
import { EntityListItem } from "ui/lists/EntityListItem";
import l10n from "shared/lib/lang/l10n";
import {
  DutyInstrument,
  NoiseInstrument,
  WaveInstrument,
} from "shared/lib/uge/types";
import { Button } from "ui/buttons/Button";
import { ArrowLeftRightIcon } from "ui/icons/Icons";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import trackerActions from "store/features/tracker/trackerActions";
import API from "renderer/lib/api";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { MenuItem } from "ui/menu/Menu";
import { assertUnreachable } from "shared/lib/helpers/assert";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { SplitPaneChildProps } from "ui/splitpane/SplitPaneVerticalContainer";
import { SplitPane } from "ui/splitpane/SplitPane";
import { NOTE_C5 } from "consts";
import { InstrumentType } from "shared/lib/music/types";
import { useMusicNotePreview } from "components/music/hooks/useMusicNotePreview";

const COLLAPSED_SIZE = 30;

interface NavigatorItem {
  id: string;
  name: string;
}

interface InstrumentNavigatorItem {
  id: string;
  name: string;
  instrumentId: string;
  type: InstrumentType;
  isGroup: boolean;
  labelColor?: string;
}

const instrumentToNavigatorItem =
  (type: InstrumentType) =>
  (
    instrument: DutyInstrument | NoiseInstrument | WaveInstrument,
    instrumentIndex: number,
    defaultName: string,
  ): InstrumentNavigatorItem => {
    const name = instrument.name
      ? instrument.name
      : `${defaultName} ${instrumentIndex + 1}`;

    return {
      id: `${type}_${instrument.index}`,
      name,
      type,
      instrumentId: `${instrument.index}`,
      isGroup: false,
      labelColor: `instrument-${instrument.index}`,
    };
  };

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByIndex = (a: NavigatorItem, b: NavigatorItem) => {
  return collator.compare(a.id, b.id);
};

const emptyDutyInstruments: DutyInstrument[] = [];
const emptyWaveInstruments: WaveInstrument[] = [];
const emptyNoiseInstruments: NoiseInstrument[] = [];

const isInstrumentListEqual = (
  a: Array<{ name?: string }>,
  b: Array<{ name?: string }>,
): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((aItem, index) => aItem.name === b[index].name);
};

export const InstrumentNavigatorPane = ({
  height,
  onToggle,
}: SplitPaneChildProps) => {
  const dispatch = useAppDispatch();
  const playPreview = useMusicNotePreview();

  const dutyInstruments = useAppSelector<DutyInstrument[]>(
    (state) =>
      state.trackerDocument.present.song?.dutyInstruments ??
      emptyDutyInstruments,
    isInstrumentListEqual,
  );

  const waveInstruments = useAppSelector<WaveInstrument[]>(
    (state) =>
      state.trackerDocument.present.song?.waveInstruments ??
      emptyWaveInstruments,
    isInstrumentListEqual,
  );

  const noiseInstruments = useAppSelector<NoiseInstrument[]>(
    (state) =>
      state.trackerDocument.present.song?.noiseInstruments ??
      emptyNoiseInstruments,
    isInstrumentListEqual,
  );

  const selectedInstrument = useAppSelector(
    (state) => state.tracker.selectedInstrument,
  );

  const selectedChannel = useAppSelector(
    (state) => state.tracker.selectedChannel,
  );

  const [openInstrumentGroupIds, setOpenInstrumentGroupIds] = useState<
    InstrumentType[]
  >(["duty"]);

  const toggleInstrumentOpen = (id: InstrumentType) => () => {
    if (isOpen(id)) {
      closeInstrumentGroup(id);
    } else {
      openInstrumentGroup(id);
    }
  };

  const [syncInstruments, setSyncInstruments] = useState(true);
  useEffect(() => {
    (async function set() {
      const syncedInstrumentSetting =
        (await API.settings.get("trackerSidebarSyncInstruments")) ?? true;
      setSyncInstruments(syncedInstrumentSetting as boolean);
    })();
  }, []);
  const handleSyncInstruments = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();

      setSyncInstruments(!syncInstruments);
      API.settings.set("trackerSidebarSyncInstruments", !syncInstruments);
    },
    [syncInstruments],
  );

  const lastSelectedChannel = useRef(selectedChannel);
  useEffect(() => {
    if (syncInstruments && selectedChannel !== lastSelectedChannel.current) {
      lastSelectedChannel.current = selectedChannel;
      if (selectedChannel === 0 || selectedChannel === 1) {
        setOpenInstrumentGroupIds(["duty"]);
      }
      if (selectedChannel === 2) {
        setOpenInstrumentGroupIds(["wave"]);
      }
      if (selectedChannel === 3) {
        setOpenInstrumentGroupIds(["noise"]);
      }
    }
  }, [selectedChannel, syncInstruments]);

  const openInstrumentGroup = (id: InstrumentType) => {
    setOpenInstrumentGroupIds((value) =>
      ([] as InstrumentType[]).concat(value, id),
    );
  };

  const closeInstrumentGroup = (id: InstrumentType) => {
    setOpenInstrumentGroupIds((value) => value.filter((s) => s !== id));
  };

  const isOpen = useCallback(
    (id: InstrumentType) => {
      return openInstrumentGroupIds.includes(id);
    },
    [openInstrumentGroupIds],
  );

  const instrumentItems = useMemo(() => {
    const items: InstrumentNavigatorItem[] = [];
    return items.concat(
      [
        {
          name: l10n("FIELD_CHANNEL_DUTY"),
          id: "duty_group",
          instrumentId: "group",
          type: "duty",
          isGroup: true,
        },
      ],
      isOpen("duty")
        ? (dutyInstruments || [])
            .map((duty, i) =>
              instrumentToNavigatorItem("duty")(
                duty,
                i,
                l10n("FIELD_CHANNEL_DUTY"),
              ),
            )
            .sort(sortByIndex)
        : [],
      [
        {
          name: l10n("FIELD_CHANNEL_WAVE"),
          id: "wave_group",
          instrumentId: "group",
          type: "wave",
          isGroup: true,
        },
      ],
      isOpen("wave")
        ? (waveInstruments || [])
            .map((wave, i) =>
              instrumentToNavigatorItem("wave")(
                wave,
                i,
                l10n("FIELD_CHANNEL_WAVE"),
              ),
            )
            .sort(sortByIndex)
        : [],
      [
        {
          name: l10n("FIELD_CHANNEL_NOISE"),
          id: "noise_group",
          instrumentId: "group",
          type: "noise",
          isGroup: true,
        },
      ],
      isOpen("noise")
        ? (noiseInstruments || [])
            .map((noise, i) =>
              instrumentToNavigatorItem("noise")(
                noise,
                i,
                l10n("FIELD_CHANNEL_NOISE"),
              ),
            )
            .sort(sortByIndex)
        : [],
    );
  }, [dutyInstruments, waveInstruments, noiseInstruments, isOpen]);

  const setSelectedInstrument = useCallback(
    (id: string, item: InstrumentNavigatorItem) => {
      dispatch(
        trackerActions.setSelectedInstrument({
          id: item.instrumentId,
          type: item.type,
        }),
      );

      if (!item.isGroup) {
        const instrumentId = parseInt(item.instrumentId, 10);
        playPreview({
          channelId: selectedChannel,
          note: NOTE_C5,
          instrumentId,
        });
      }

      if (!item.isGroup && syncInstruments) {
        let newSelectedChannel: 0 | 1 | 2 | 3 = 0;
        switch (item.type) {
          case "duty":
            newSelectedChannel = selectedChannel === 1 ? 1 : 0;
            break;
          case "wave":
            newSelectedChannel = 2;
            break;
          case "noise":
            newSelectedChannel = 3;
            break;
        }
        dispatch(trackerActions.setSelectedChannel(newSelectedChannel));
        const newDefaultInstrument = parseInt(item.instrumentId);
        dispatch(trackerActions.setSelectedInstrumentId(newDefaultInstrument));
      }
    },
    [dispatch, playPreview, selectedChannel, syncInstruments],
  );

  const [renameId, setRenameId] = useState("");

  const onRenameInstrumentComplete = useCallback(
    (name: string, item: InstrumentNavigatorItem) => {
      if (renameId) {
        const action =
          item.type === "duty"
            ? trackerDocumentActions.editDutyInstrument
            : item.type === "wave"
              ? trackerDocumentActions.editWaveInstrument
              : item.type === "noise"
                ? trackerDocumentActions.editNoiseInstrument
                : assertUnreachable(item.type);

        const instrumentId = parseInt(item.instrumentId);

        dispatch(
          action({
            instrumentId,
            changes: {
              name,
            },
          }),
        );
      }
      setRenameId("");
    },
    [dispatch, renameId],
  );

  const onRenameCancel = useCallback(() => {
    setRenameId("");
  }, []);

  const renderInstrumentContextMenu = useCallback(
    (item: InstrumentNavigatorItem) => {
      return [
        <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
          {l10n("FIELD_RENAME")}
        </MenuItem>,
      ];
    },
    [],
  );

  const renderInstrumentLabel = useCallback((item: InstrumentNavigatorItem) => {
    return `${(parseInt(item.instrumentId) + 1).toString().padStart(2, "0")}: ${
      item.name
    }`;
  }, []);

  const selectedChannelType = useMemo(() => {
    if (selectedChannel === 2) {
      return "wave";
    } else if (selectedChannel === 3) {
      return "noise";
    }
    return "duty";
  }, [selectedChannel]);

  useEffect(() => {
    if (
      syncInstruments &&
      selectedChannelType !== selectedInstrument.type &&
      selectedInstrument.id !== "group"
    ) {
      dispatch(
        trackerActions.setSelectedInstrument({
          id: selectedInstrument.id,
          type: selectedChannelType,
        }),
      );
    }
  }, [
    dispatch,
    selectedChannelType,
    selectedInstrument.id,
    selectedInstrument.type,
    syncInstruments,
  ]);

  return (
    <SplitPane style={{ height }}>
      <SplitPaneHeader
        onToggle={onToggle}
        collapsed={Math.floor(height ?? 0) <= COLLAPSED_SIZE}
        buttons={
          <Button
            variant={syncInstruments ? "primary" : "transparent"}
            size="small"
            title={l10n("TOOL_SYNC_INSTRUMENT_NAVIGATOR")}
            onClick={handleSyncInstruments}
            style={{ minWidth: 26 }}
          >
            <ArrowLeftRightIcon />
          </Button>
        }
      >
        {l10n("FIELD_INSTRUMENTS")}
      </SplitPaneHeader>
      <FlatList
        selectedId={`${selectedInstrument.type}_${selectedInstrument.id}`}
        items={instrumentItems}
        setSelectedId={setSelectedInstrument}
        height={(height ?? 0) - 30}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === "Enter") {
            setRenameId(`${selectedInstrument.type}_${selectedInstrument.id}`);
          } else if (e.key === "ArrowRight") {
            openInstrumentGroup(selectedInstrument.type);
          } else if (e.key === "ArrowLeft") {
            closeInstrumentGroup(selectedInstrument.type);
          }
        }}
      >
        {({ item }) =>
          item.isGroup ? (
            <EntityListItem
              item={item}
              type="song"
              collapsable={true}
              collapsed={!isOpen(item.type)}
              onToggleCollapse={toggleInstrumentOpen(item.type)}
            />
          ) : (
            <EntityListItem
              item={item}
              type={item.type}
              nestLevel={1}
              rename={renameId === item.id}
              onRename={onRenameInstrumentComplete}
              onRenameCancel={onRenameCancel}
              renderContextMenu={renderInstrumentContextMenu}
              renderLabel={renderInstrumentLabel}
            />
          )
        }
      </FlatList>
    </SplitPane>
  );
};
