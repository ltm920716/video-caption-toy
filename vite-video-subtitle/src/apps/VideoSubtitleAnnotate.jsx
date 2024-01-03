import React, { useState } from "react";
import VideoPlayer from "./components/VideoPlayer";
import Canvas from "./components/CanvasWrap";
import { v4 as uuid } from "uuid";
import PropTypes from "prop-types";

import { Button, Flex, Box } from "@chakra-ui/react";

function VideoSubtitleAnnotate({ url, onSubmit }) {
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [rectangles, setRectangles] = useState([]);
  const [selectedId, selectShape] = useState(null);
  const [selectedMode, setSelectedMode] = useState('slow');

  const handleModeSelection = (mode) => {
    setSelectedMode(mode);
  };

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
    onSubmit(rectangles, videoSize, selectedMode);
  };

  return (
    <div style={{ textAlign: "center" }}>
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
          <Button onClick={handleAddRect}>添加字幕选区</Button>
          <Button onClick={handleDelete}>删除选中选区</Button>
        </div>
        <div>
          <Flex mt={4}>
            <Box flex="1" mr="2">
              <Button
                width="100%"
                colorScheme={selectedMode === "fast" ? "blue" : "gray"}
                onClick={() => handleModeSelection("fast")}
              >
                低资源擦除
              </Button>
            </Box>
            <Box flex="1" ml="2">
              <Button
                width="100%"
                colorScheme={selectedMode === "slow" ? "blue" : "gray"}
                onClick={() => handleModeSelection("slow")}
              >
                高精度擦除
              </Button>
            </Box>
          </Flex>
        </div>
        <div>
          <Button
            onClick={exportRects}
            mt={4}
            border="2px solid #36A2EB"
            borderRadius="md"
            color="#36A2EB"
            backgroundColor="white"
            px={4}
            py={2}
            _hover={{ backgroundColor: "#36A2EB", color: "white" }}
          >
            开始擦除
          </Button>
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
