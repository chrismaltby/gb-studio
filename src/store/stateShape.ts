import PropTypes from "prop-types";

export const EventShape = PropTypes.shape({
  id: PropTypes.string,
  command: PropTypes.string.isRequired,
  args: PropTypes.shape({
    text: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string),
    ]),
  }),
});

export const ActorShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
});

export const TriggerShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
});

export const SceneShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  actors: PropTypes.arrayOf(PropTypes.string).isRequired,
  triggers: PropTypes.arrayOf(PropTypes.string).isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
});

export const SpriteShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  filename: PropTypes.string.isRequired,
  numFrames: PropTypes.number,
});

export const SettingsShape = PropTypes.shape({
  startSceneId: PropTypes.string,
  startX: PropTypes.number,
  startY: PropTypes.number,
});

export const VariableShape = PropTypes.shape({
  id: PropTypes.string,
  name: PropTypes.string,
});

export const MusicShape = PropTypes.shape({
  id: PropTypes.string,
  name: PropTypes.string,
});

export const BackgroundShape = PropTypes.shape({
  id: PropTypes.string,
  name: PropTypes.string,
});

export const CustomEventShape = PropTypes.shape({
  id: PropTypes.string,
  name: PropTypes.string,
});

export const PaletteShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  colors: PropTypes.arrayOf(PropTypes.string).isRequired,
});

export const ProjectShape = PropTypes.shape({
  name: PropTypes.string,
  author: PropTypes.string,
  settings: SettingsShape,
  scenes: PropTypes.arrayOf(PropTypes.string),
  variables: PropTypes.arrayOf(PropTypes.string),
  backgrounds: PropTypes.arrayOf(PropTypes.string),
  customEvents: PropTypes.arrayOf(PropTypes.string),
  palettes: PropTypes.arrayOf(PropTypes.string),
});

export const ProjectMetadataShape = PropTypes.shape({
  name: PropTypes.string,
  author: PropTypes.string,
  notes: PropTypes.string,
});

export const ErrorShape = PropTypes.shape({
  visible: PropTypes.bool,
  message: PropTypes.string,
  filename: PropTypes.string,
  stackTrace: PropTypes.string,
  line: PropTypes.number,
  col: PropTypes.number,
});

export const EventValueShape = PropTypes.oneOfType([
  PropTypes.number,
  PropTypes.string,
  PropTypes.bool,
  PropTypes.arrayOf(PropTypes.number),
  PropTypes.arrayOf(PropTypes.string),
  PropTypes.arrayOf(PropTypes.bool),
  PropTypes.shape({
    type: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
      PropTypes.bool,
    ]),
  }),
]);

export const EventDefaultValueShape = PropTypes.oneOfType([
  PropTypes.number,
  PropTypes.string,
  PropTypes.bool,
  PropTypes.arrayOf(PropTypes.number),
  PropTypes.arrayOf(PropTypes.string),
  PropTypes.arrayOf(PropTypes.bool),
  PropTypes.shape({
    number: PropTypes.number,
    variable: PropTypes.string,
    property: PropTypes.string,
    direction: PropTypes.string,
  }),
]);

export const EngineFieldShape = PropTypes.shape({
  key: PropTypes.string,
  label: PropTypes.string,
});
