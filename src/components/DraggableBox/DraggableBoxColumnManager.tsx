import React, { useState, useCallback, memo } from "react";
import { Settings, Eye, EyeOff, GripVertical } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

export interface DraggableBoxColumn {
  id: string;
  label: string;
  visible: boolean;
  width?: string;
}

interface DraggableBoxColumnManagerProps {
  columns: DraggableBoxColumn[];
  onColumnsChange: (columns: DraggableBoxColumn[]) => void;
}

const DraggableBoxColumnManager: React.FC<DraggableBoxColumnManagerProps> = ({
  columns,
  onColumnsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const items = Array.from(columns);
      const [moved] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, moved);
      onColumnsChange(items);
    },
    [columns, onColumnsChange]
  );

  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      const updated = columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      );
      onColumnsChange(updated);
    },
    [columns, onColumnsChange]
  );

  const showAll = useCallback(() => {
    onColumnsChange(columns.map((col) => ({ ...col, visible: true })));
  }, [columns, onColumnsChange]);

  const hideAll = useCallback(() => {
    onColumnsChange(columns.map((col) => ({ ...col, visible: false })));
  }, [columns, onColumnsChange]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center space-x-1 px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
        title="Manage Columns"
      >
        <Settings size={14} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 flex flex-col">
            <div className="p-3 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-white">
                Manage Columns
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-3 max-h-48">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="draggable-column-list">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {columns.map((col, index) => (
                        <Draggable
                          key={col.id}
                          draggableId={col.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center justify-between p-2 mb-1 bg-gray-700 rounded transition-all select-none ${
                                snapshot.isDragging
                                  ? "opacity-75 shadow-lg transform rotate-1 scale-105 z-50"
                                  : "hover:bg-gray-600"
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white transition-colors"
                                >
                                  <GripVertical size={14} />
                                </div>
                                <span className="text-white text-xs">
                                  {col.label}
                                </span>
                              </div>
                              <button
                                onClick={() => toggleColumnVisibility(col.id)}
                                className={`p-1 rounded transition-colors ${
                                  col.visible
                                    ? "text-green-400 hover:text-green-300"
                                    : "text-gray-400 hover:text-gray-300"
                                }`}
                              >
                                {col.visible ? (
                                  <Eye size={14} />
                                ) : (
                                  <EyeOff size={14} />
                                )}
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            <div className="p-3 border-t border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">
                  {columns.filter((c) => c.visible).length} of {columns.length}{" "}
                  visible
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={showAll}
                    className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                  >
                    Show All
                  </button>
                  <button
                    onClick={hideAll}
                    className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                  >
                    Hide All
                  </button>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default memo(DraggableBoxColumnManager);