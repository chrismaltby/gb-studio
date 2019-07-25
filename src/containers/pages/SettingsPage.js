import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  FormField,
  ToggleableFormField,
  ToggleableCheckBoxField
} from "../../components/library/Forms";
import l10n from "../../lib/helpers/l10n";
import PageHeader from "../../components/library/PageHeader";
import PageContent from "../../components/library/PageContent";
import castEventValue from "../../lib/helpers/castEventValue";
import * as actions from "../../actions";
import CustomPalettePicker from "../../components/forms/CustomPalettePicker";
import { getScenesLookup } from "../../reducers/entitiesReducer";
import CustomControlsPicker from "../../components/forms/CustomControlsPicker";

class SettingsPage extends Component {
  onEditSetting = key => e => {
    const { editProjectSettings } = this.props;
    editProjectSettings({
      [key]: castEventValue(e)
    });
  };

  onEditProject = key => e => {
    const { editProject } = this.props;
    editProject({
      [key]: castEventValue(e)
    });
  };

  render() {
    const { project, settings, scenesLookup } = this.props;

    if (!project || !project.scenes) {
      return <div />;
    }

    const { name, author, notes, scenes } = project;
    const {
      customColorsEnabled,
      customHead,
      startSceneId,
      playerSpriteSheetId,
      startDirection,
      startAnimSpeed,
      startMoveSpeed,
      startX,
      startY
    } = settings;

    const scenesLength = scenes.length;
    const actorsLength = scenes.reduce((memo, sceneId) => {
      const scene = scenesLookup[sceneId];
      console.log(scene);
      return memo + scene.actors.length;
    }, 0);

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "auto"
        }}
      >
        <PageHeader>
          <h1>{l10n("SETTINGS")}</h1>
          <p>
            {scenesLength}{" "}
            {scenesLength === 1
              ? l10n("SETTINGS_SCENE")
              : l10n("SETTINGS_SCENES")}
          </p>
          <p>
            {actorsLength}{" "}
            {actorsLength === 1
              ? l10n("SETTINGS_ACTOR")
              : l10n("SETTINGS_ACTORS")}
          </p>
        </PageHeader>
        <PageContent>
          <section>
            <h2>Project</h2>
            <FormField>
              <label htmlFor="projectName">
                {l10n("FIELD_NAME")}
                <input
                  id="projectName"
                  value={name || ""}
                  placeholder="Project Name"
                  onChange={this.onEditProject("name")}
                />
              </label>
            </FormField>
            <FormField>
              <label htmlFor="projectAuthor">
                {l10n("FIELD_AUTHOR")}
                <input
                  id="projectAuthor"
                  value={author || ""}
                  placeholder="Author"
                  onChange={this.onEditProject("author")}
                />
              </label>
            </FormField>
            <ToggleableFormField
              htmlFor="projectNotes"
              closedLabel={l10n("FIELD_ADD_NOTES")}
              label={l10n("FIELD_NOTES")}
              open={!!notes}
            >
              <textarea
                id="projectNotes"
                value={notes || ""}
                placeholder={l10n("FIELD_NOTES")}
                onChange={this.onEditProject("notes")}
                rows={3}
              />
            </ToggleableFormField>
          </section>
          <section>
            <h2>Colors</h2>

            <ToggleableCheckBoxField
              label={l10n("FIELD_EXPORT_CUSTOM_COLORS")}
              open={customColorsEnabled}
              onToggle={this.onEditSetting("customColorsEnabled")}
            >
              <CustomPalettePicker />
            </ToggleableCheckBoxField>
          </section>

          <section>
            <h2>{l10n("SETTINGS_CART_TYPE")}</h2>
          </section>

          <section>
            <h2>Controls</h2>
            <CustomControlsPicker />
          </section>

          <section>
            <h2>Custom Header (Web Build)</h2>

            <FormField>
              <label htmlFor="customHead">
                {l10n("FIELD_CUSTOM_HEAD")}

                <pre>
                  &lt;!DOCTYPE html&gt;{"\n"}
                  &lt;html&gt;{"\n  "}
                  &lt;head&gt;{"\n  "}
                  ...
                </pre>
                <textarea
                  id="customHead"
                  value={customHead || ""}
                  placeholder={
                    'e.g. <style type"text/css">\nbody {\n  background-color: darkgreen;\n}\n</style>'
                  }
                  onChange={this.onEditSetting("customHead")}
                  rows={15}
                  style={{ fontFamily: "monospace" }}
                />
                <pre>
                  {"  "}&lt;/head&gt;{"\n  "}
                  &lt;body&gt;{"\n  "}
                  ...{"\n  "}
                  &lt;body&gt;{"\n"}
                  &lt;html&gt;
                </pre>
              </label>
            </FormField>
          </section>
        </PageContent>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const project = state.entities.present.result;
  const settings = project ? project.settings : {};
  const scenesLookup = getScenesLookup(state);

  return {
    project,
    settings,
    scenesLookup
  };
}

const mapDispatchToProps = {
  editProject: actions.editProject,
  editProjectSettings: actions.editProjectSettings
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SettingsPage);
