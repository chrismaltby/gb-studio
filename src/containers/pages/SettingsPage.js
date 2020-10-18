import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  FormField,
  ToggleableCheckBoxField,
} from "../../components/library/Forms";
import l10n from "../../lib/helpers/l10n";
import PageHeader from "../../components/library/PageHeader";
import PageContent from "../../components/library/PageContent";
import castEventValue from "../../lib/helpers/castEventValue";
import CustomControlsPicker from "../../components/forms/CustomControlsPicker";
import CartPicker from "../../components/forms/CartPicker";
import PaletteSelect from "../../components/forms/PaletteSelect";
import Button from "../../components/library/Button";
import {
  SettingsShape,
  SceneShape,
} from "../../store/stateShape";
import { getSettings } from "../../store/features/settings/settingsState";
import settingsActions from "../../store/features/settings/settingsActions";
import { sceneSelectors } from "../../store/features/entities/entitiesState";
import { getMetadata } from "../../store/features/metadata/metadataState";
import navigationActions from "../../store/features/navigation/navigationActions";
import FadeStyleSelect from "../../components/forms/FadeStyleSelect";
import EnginePropsEditor from "../../components/settings/EnginePropsEditor";

class SettingsPage extends Component {
  onEditSetting = (key) => (e) => {
    const { editProjectSettings } = this.props;
    editProjectSettings({
      [key]: castEventValue(e),
    });
  };

  onEditPaletteId = (index) => (e) => {
    const { settings } = this.props;
    const { defaultBackgroundPaletteIds } = settings;

    const paletteIds = defaultBackgroundPaletteIds
      ? [...defaultBackgroundPaletteIds]
      : [];
    paletteIds[index] = castEventValue(e);
    // console.log("NEW PALETTE IDS", paletteIds)
    this.onEditSetting("defaultBackgroundPaletteIds")(paletteIds);
  };

  onResetFadeSettings = () => {
    const { editProjectSettings } = this.props;
    editProjectSettings({
      defaultFadeStyle: "white",
    });
  }

  render() {
    const { scenes, settings, scenesLookup, setSection } = this.props;

    const {
      customColorsEnabled,
      customHead,
      defaultUIPaletteId,
      defaultSpritePaletteId,
      defaultBackgroundPaletteIds,
      defaultFadeStyle
    } = settings;

    const scenesLength = scenes.length;
    const actorsLength = scenes.reduce((memo, scene) => {
      return memo + scene.actors.length;
    }, 0);

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          transform: "translate3d(0,0,0)",
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
          <EnginePropsEditor />
          
          <section>
            <h2>{l10n("SETTINGS_GBC")}</h2>

            <ToggleableCheckBoxField
              label={l10n("FIELD_EXPORT_IN_COLOR")}
              open={customColorsEnabled}
              onToggle={this.onEditSetting("customColorsEnabled")}
            >
              <br />
              <h3>Default Background Palettes</h3>

              {[0, 1, 2, 3, 4, 5].map((index) => (
                <FormField halfWidth key={index}>
                  <PaletteSelect
                    id="scenePalette"
                    prefix={`${index + 1}: `}
                    value={
                      (defaultBackgroundPaletteIds &&
                        defaultBackgroundPaletteIds[index]) ||
                      ""
                    }
                    onChange={this.onEditPaletteId(index)}
                  />
                </FormField>
              ))}

              <FormField halfWidth>
                <h3>Default Sprite Palette</h3>

                <PaletteSelect
                  id="scenePalette"
                  value={defaultSpritePaletteId || ""}
                  onChange={this.onEditSetting("defaultSpritePaletteId")}
                />
              </FormField>

              <FormField halfWidth>
                <h3>Default UI Palette</h3>

                <PaletteSelect
                  id="scenePalette"
                  value={defaultUIPaletteId || ""}
                  onChange={this.onEditSetting("defaultUIPaletteId")}
                />
              </FormField>

              <div style={{ marginTop: 30 }}>
                <Button onClick={() => setSection("palettes")}>
                  {l10n("FIELD_EDIT_PALETTES")}
                </Button>
              </div>
            </ToggleableCheckBoxField>
          </section>

          <section>
            <h2>{l10n("SETTINGS_FADE")}</h2>
            <FormField quarterWidth>
              <label htmlFor="defaultFadeStyle">
                {l10n("FIELD_DEFAULT_FADE_STYLE")}
                <FadeStyleSelect value={defaultFadeStyle} onChange={this.onEditSetting("defaultFadeStyle")} />
              </label>
            </FormField>
            <div style={{ marginTop: 30 }}>
              <Button onClick={this.onResetFadeSettings}>
                {l10n("FIELD_RESTORE_DEFAULT")}
              </Button>
            </div>            
          </section>

          <section>
            <h2>{l10n("SETTINGS_CONTROLS")}</h2>
            <CustomControlsPicker />
          </section>

          <section>
            <h2>{l10n("SETTINGS_CART_TYPE")}</h2>
            <CartPicker />
          </section>

          <section>
            <h2>{l10n("SETTINGS_CUSTOM_HEADER")}</h2>
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

SettingsPage.propTypes = {
  scenes: PropTypes.arrayOf(SceneShape).isRequired,
  settings: SettingsShape.isRequired,
  scenesLookup: PropTypes.objectOf(SceneShape).isRequired,
  editProjectSettings: PropTypes.func.isRequired,
  setSection: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  const metadata = getMetadata(state);
  const settings = getSettings(state);
  const scenes = sceneSelectors.selectAll(state);
  const scenesLookup = sceneSelectors.selectEntities(state);

  return {
    metadata,
    settings,
    scenes,
    scenesLookup,
  };
}

const mapDispatchToProps = {
  editProjectSettings: settingsActions.editSettings,
  setSection: navigationActions.setSection,
};

export default connect(mapStateToProps, mapDispatchToProps)(SettingsPage);
