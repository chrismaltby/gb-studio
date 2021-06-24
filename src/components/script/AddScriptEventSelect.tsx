import React, { useCallback, useEffect, useState } from "react";
import { OptGroup, Select, selectMenuStyleProps } from "ui/form/Select";
import events, { EventHandler } from "lib/events";
import l10n from "lib/helpers/l10n";

interface AddEventMenuProps {
  onChange?: (newValue: string) => void;
  onBlur?: () => void;
}

interface EventOption {
  label: string;
  value: string;
  event: EventHandler;
}

interface EventOptGroup {
  label: string;
  options: EventOption[];
}

const eventToOption = (event: EventHandler): EventOption => {
  const localisedKey = l10n(event.id);
  const name =
    localisedKey !== event.id ? localisedKey : event.name || event.id;
  return {
    label: name,
    value: event.id,
    event,
  };
};

const defaultFavourites = [
  events["EVENT_TEXT"],
  events["EVENT_SWITCH_SCENE"],
] as EventHandler[];

const AddEventMenu = ({ onChange, onBlur }: AddEventMenuProps) => {
  const [options, setOptions] = useState<EventOptGroup[]>([]);
  console.log(events);

  useEffect(() => {
    const eventList = Object.values(events).filter((i) => i) as EventHandler[];

    setOptions([
      {
        label: "Favourites",
        options: defaultFavourites.map(eventToOption),
      },
      {
        label: "Actor",
        options: [
          {
            label: "Actor Move To",
            value: "EVENT_ACTOR_MOVE_TO",
            event: eventList[1],
          },
        ],
      },
      {
        label: "Misc",
        options: eventList.map(eventToOption),
      },
    ]);
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onBlur?.();
      }
    },
    [onBlur]
  );

  const onSelectCategory = useCallback(() => {
    const eventList = Object.values(events).filter((i) => i) as EventHandler[];

    setOptions([
      {
        label: "Actor",
        options: [
          {
            label: "Actor Move To",
            value: "EVENT_ACTOR_MOVE_TO",
            event: eventList[1],
          },
        ],
      },
    ]);
  }, []);

  return (
    <Select
      name="addEvent"
      options={options}
      onChange={onSelectCategory}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      maxMenuHeight={400}
      minMenuHeight={400}
      {...selectMenuStyleProps}
    />
  );
};

export default AddEventMenu;
