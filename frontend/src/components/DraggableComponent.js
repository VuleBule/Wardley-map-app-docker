import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../constants';

const DraggableComponent = ({ id, x, y, name, isStrategic, onDragEnd }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.COMPONENT,
    item: { id, x, y },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult) {
        onDragEnd(id, dropResult.x, dropResult.y);
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <g
      ref={drag}
      style={{ cursor: 'move', opacity: isDragging ? 0.5 : 1 }}
    >
      <circle
        r={6}
        fill={isStrategic ? "#f44336" : "#2196f3"}
      />
      <text
        y="-10"
        textAnchor="middle"
        fontSize="12px"
        fontWeight={isStrategic ? "bold" : "normal"}
      >
        {name}
      </text>
    </g>
  );
};

export default DraggableComponent;
