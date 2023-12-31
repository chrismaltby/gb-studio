import React, {Component} from "react";
import {connect} from "react-redux";
import Button from "../library/Button";
import l10n from "lib/helpers/l10n";
import {assetFilename, zoomForSection} from "lib/helpers/gbstudio";
import BackgroundWarnings from "../world/BackgroundWarnings";
import editorActions from "store/features/editor/editorActions";
import electronActions from "store/features/electron/electronActions";
import {RootState} from "store/configureStore";
import {ZoomSection} from "store/features/editor/editorState";

interface StateProps {
  file: {
    id: string;
    filename: string;
    _v: number;
  };
  folder: string;
  section: ZoomSection;
  zoom: number;
  sidebarWidth: number;
  projectRoot: string;
}

interface ActionProps {
  zoomIn: (args: { section: ZoomSection; delta: number }) => void;
  zoomOut: (args: { section: ZoomSection; delta: number }) => void;
  openFile: (args: { filename: string; type: 'image' | 'music' }) => void;
}

type Props = StateProps & ActionProps;

class ImageViewer extends Component<Props> {
  componentDidMount() {
    window.addEventListener("mousewheel", this.onMouseWheel);
  }

  componentWillUnmount() {
    window.removeEventListener("mousewheel", this.onMouseWheel);
  }

  onMouseWheel = (e: Event) => {
    const event = e as WheelEvent;
    const {zoomIn, zoomOut, section} = this.props;
    if (event.ctrlKey) {
      e.preventDefault();
      if (event.deltaY > 0) {
        zoomIn({section, delta: event.deltaY * 0.5});
      } else {
        zoomOut({section, delta: event.deltaY * 0.5});
      }
    }
  };

  onOpen = () => {
    const {projectRoot, file, folder, openFile} = this.props;
    openFile({
      filename: `${projectRoot}/assets/${folder}/${file.filename}`,
      type: "image",
    });
  };

  render() {
    const {projectRoot, file, folder, zoom, sidebarWidth} = this.props;
    return (
      <div className="ImageViewer" style={{right: sidebarWidth}}>
        <div className="ImageViewer__Content">
          {file && (
            <div
              className="ImageViewer__Image"
              style={{transform: `scale(${zoom})`}}
            >
              <img
                alt=""
                src={`file://${assetFilename(projectRoot, folder, file)}?_v=${
                  file._v || 0
                }`}
              />
            </div>
          )}
        </div>
        {file && (
          <div
            className="ImageViewer__Edit"
            style={{right: sidebarWidth + 10}}
          >
            <Button onClick={this.onOpen}>{l10n("ASSET_EDIT")}</Button>
          </div>
        )}
        {file && folder === "backgrounds" && (
          <div
            className="ImageViewer__Warning"
            style={{right: sidebarWidth + 10}}
          >
            <BackgroundWarnings id={file.id}/>
          </div>
        )}
      </div>
    );
  }
}

function mapStateToProps(state: RootState): StateProps {
  const {section} = state.navigation;
  const folder = section;
  const zoom = zoomForSection(section, state.editor);
  const {filesSidebarWidth: sidebarWidth} = state.editor;
  return {
    projectRoot: state.document && state.document.root,
    folder,
    section: section as ZoomSection,
    zoom: (zoom || 100) / 100,
    sidebarWidth,
    file: {} as any,
  };
}

const mapDispatchToProps: ActionProps = {
  openFile: ({filename, type}) => electronActions.openFile({filename, type}),
  zoomIn: ({section, delta}) => editorActions.zoomIn({section, delta}),
  zoomOut: ({section, delta}) => editorActions.zoomOut({section, delta}),
};

export default connect(mapStateToProps, mapDispatchToProps)(ImageViewer);
