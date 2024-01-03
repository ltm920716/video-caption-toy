import React from "react";
import { Stage, Layer } from "react-konva";
import PropTypes from "prop-types";
import Rectangle from "./Rectangle";

function Canvas(props) {
  const {
    width,
    height,
    rectangles,
    setRectangles,
    selectedId,
    selectShape,
    checkDeselect,
  } = props;

  return (
    <div style={{
      position: 'relative',
      border: '1px solid black'
      }}>
      <Stage
        width={width}
        height={height}
        onMouseDown={checkDeselect}
        onTouchStart={checkDeselect}
      >
        <Layer>
          {rectangles.map((rect, i) => {
            return (
              <Rectangle
                key={i}
                shapeProps={rect}
                isSelected={rect.id === selectedId}
                onSelect={() => {
                  selectShape(rect.id);
                }}
                onChange={(newAttrs) => {
                  const rects = rectangles.slice();
                  rects[i] = newAttrs;
                  setRectangles(rects);
                }}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}

Canvas.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  rectangles: PropTypes.array,
  setRectangles: PropTypes.func,
  selectedId: PropTypes.string,
  selectShape: PropTypes.func,
  checkDeselect: PropTypes.func,
};

Canvas.defaultProps = {
  width: 0,
  height: 0,
  rectangles: [],
  setRectangles: () => {},
  selectedId: null,
  selectShape: () => {},
  checkDeselect: () => {},
};

export default Canvas;
