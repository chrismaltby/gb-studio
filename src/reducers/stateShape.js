import PropTypes from "prop-types";

export const EventShape = PropTypes.shape({
  id: PropTypes.string,
  command: PropTypes.string.isRequired,
  args: PropTypes.shape({
    text: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ])
  })
});

export const ActorShape = PropTypes.shape({
  id: PropTypes.string.isRequired
});

export const TriggerShape = PropTypes.shape({
  id: PropTypes.string.isRequired
});

export const SceneShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  actors: PropTypes.arrayOf(ActorShape).isRequired,
  triggers: PropTypes.arrayOf(TriggerShape).isRequired
});

export const SpriteShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  filename: PropTypes.string.isRequired,
  numFrames: PropTypes.number
});

export const SettingsShape = PropTypes.shape({
  startSceneId: PropTypes.string,
  startX: PropTypes.number,
  startY: PropTypes.number
});

export const VariableShape = PropTypes.shape({
  id: PropTypes.string,
  name: PropTypes.string
});

export const MusicShape = PropTypes.shape({
  id: PropTypes.string,
  name: PropTypes.string
});

export const BackgroundShape = PropTypes.shape({
  id: PropTypes.string,
  name: PropTypes.string
});

export const ProjectShape = PropTypes.shape({
  name: PropTypes.string,
  author: PropTypes.string,
  settings: SettingsShape,
  scenes: PropTypes.arrayOf(SceneShape),
  variables: PropTypes.arrayOf(VariableShape),
  backgrounds: PropTypes.arrayOf(BackgroundShape)
});
