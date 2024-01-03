import React, { useState } from "react";
import VideoPlayer from "./components/VideoPlayer";
import Canvas from "./components/CanvasWrap";
import { v4 as uuid } from "uuid";
import PropTypes from "prop-types";

function VideoSubtitleAnnotate({ url, onSubmit }) {
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [rectangles, setRectangles] = useState([]);
  const [selectedId, selectShape] = useState(null);

  const handleAddRect = () => {
    const newRectId = uuid();
    const newRect = {
      id: newRectId,
      x: videoSize.width / 3,
      y: videoSize.height / 3,
      width: Math.min(200, videoSize.width / 3),
      height: Math.min(50, videoSize.height / 3),
      stroke: "lime",
      fill: "rgba(0,0,0,0.2)",
    };

    setRectangles([...rectangles, newRect]);
    selectShape(newRectId);
  };

  const handleDelete = () => {
    if (selectedId) {
      const updatedRects = rectangles.filter((rect) => rect.id !== selectedId);
      setRectangles(updatedRects);
      selectShape(null);
    }
  };

  const checkDeselect = (e) => {
    // deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  const exportRects = () => {
    onSubmit(rectangles);
  };

  return (
    <div style={{ "text-align": "center" }}>
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "calc(10px + 2vmin)",
        }}
      >
        <div style={{ position: "relative" }}>
          <VideoPlayer url={url} onVideoSizeChange={setVideoSize} />
          <div style={{ position: "absolute", top: 0, left: 0 }}>
            <Canvas
              width={videoSize.width}
              height={videoSize.height}
              rectangles={rectangles}
              setRectangles={setRectangles}
              selectedId={selectedId}
              selectShape={selectShape}
              checkDeselect={checkDeselect}
            />
          </div>
        </div>
        <div>
          <button onClick={handleAddRect}>添加字幕选区</button>
          <button onClick={handleDelete}>删除选中选区</button>
        </div>
        <div>
          <button onClick={exportRects}>完成标注</button>
        </div>
      </header>
    </div>
  );
}

VideoSubtitleAnnotate.propTypes = {
  url: PropTypes.string,
  onSubmit: PropTypes.func,
};

VideoSubtitleAnnotate.defaultProps = {
  url: "",
  onSubmit: () => {},
};

export default VideoSubtitleAnnotate;
