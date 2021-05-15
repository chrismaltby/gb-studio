import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import FilesSidebar from "../../components/assets/FilesSidebar";
import ImageViewer from "../../components/assets/ImageViewer";
import { backgroundSelectors } from "../../store/features/entities/entitiesState";
import electronActions from "../../store/features/electron/electronActions";
import { RootState } from "../../store/configureStore";

const ImagesPage = () => {
  const dispatch = useDispatch();

  const [query, setQuery] = useState("");

  const files = useSelector((state: RootState) =>
    backgroundSelectors.selectAll(state)
  );
  const id = useSelector((state: RootState) => state.navigation.id);

  const openHelp = useCallback(
    (path) => {
      dispatch(electronActions.openHelp(path));
    },
    [dispatch]
  );

  const filesList = query
    ? files.filter((f) => {
        return f.name.toUpperCase().indexOf(query.toUpperCase()) > -1;
      })
    : files;

  const file = filesList.find((f) => f.id === id) || filesList[0];

  return (
    <div>
      {file && <ImageViewer file={file} />}
      <FilesSidebar
        files={filesList}
        selectedFile={file}
        query={query}
        onSearch={setQuery}
        onAdd={() => {
          openHelp("backgrounds");
        }}
      />
    </div>
  );
};

ImagesPage.propTypes = {
  id: PropTypes.string,
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  openHelp: PropTypes.func.isRequired,
};

ImagesPage.defaultProps = {
  id: "",
};

export default ImagesPage;
