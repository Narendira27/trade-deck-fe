import { useState, useRef, useEffect } from "react";
import { Minus, Trash2 } from "lucide-react";
import useStore from "../store/store";

// interface DraggableBoxData {
//   id: string;
//   index: string;
//   ltpRange: string;
//   expiry: string;
//   isHidden: boolean;
// }

const DraggableBox = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);

  const { showDraggable, setShowDraggable } = useStore();

  const handleMouseDown = (e: React.MouseEvent) => {
    if (boxRef.current) {
      const rect = boxRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return showDraggable === true ? (
    <div
      ref={boxRef}
      className={`absolute z-50 bg-gray-900  p-4 rounded-lg shadow-lg border border-gray-700 cursor-move select-none
        ${isDragging ? "opacity-90" : ""}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "auto",
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="space-x-2 flex w-full h-full flex-row justify-end items-center cursor-pointer ">
        <button
          onClick={setShowDraggable}
          className="text-gray-400 mb-1 hover:text-white "
        >
          <Minus size={20} />
        </button>
      </div>
      <ExcelLikeBox />
    </div>
  ) : null;
};

export default DraggableBox;

const ExcelLikeBox = () => {
  const { draggableData, updateDraggableData, removeDraggableData } =
    useStore();

  const onChangeValue = (
    id: string,
    value: { myValue1?: string; myValue2?: string }
  ) => {
    updateDraggableData(id, value);
  };

  const onDelete = (id: string) => {
    removeDraggableData(id);
  };

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-600">
        <thead className="bg-gray-800">
          <tr>
            <th className="px-2 py-2 text-left text-xs font-medium text-wrap text-white  ">
              Index
            </th>
            <th className="px-2 py-2 text-left text-xs font-medium text-wrap text-white  ">
              Lowest Value
            </th>
            <th className="px-2 py-2 text-left text-xs font-medium text-wrap text-white  ">
              My Value
            </th>
            <th className="px-2 py-2 text-left text-xs font-medium text-wrap text-white  ">
              Result
            </th>
            <th className="px-2 py-2 text-left text-xs font-medium text-wrap text-white  ">
              My Value 1
            </th>
            <th className="px-2 py-2 text-left text-xs font-medium text-wrap text-white  ">
              Result
            </th>
            <th className="px-2 py-2 text-left text-xs font-medium text-wrap text-white  ">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-600">
          {draggableData.length > 0 &&
            draggableData.map((each) => (
              <tr key={each.id} className="hover:bg-gray-800">
                <td className="px-2 py-2 text-center text-wrap text-xs text-white">
                  {each.index} {" - "} {each.expiry} {" - "} {each.ltpRange}
                </td>
                <td className="px-2 py-2  text-center text-wrap text-xs text-white">
                  {each.lowestValue || 0}
                </td>
                <td className="px-2 py-2  text-center  text-wrap">
                  <input
                    value={each.myValue1}
                    onChange={(e) =>
                      onChangeValue(each.id, { myValue1: e.target.value })
                    }
                    className="w-12  px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </td>

                <td className="px-2 py-2  text-center  text-wrap text-xs">
                  {each.lowestValue} - {each.myValue1}
                </td>

                <td className="px-2 py-2  text-center  text-wrap">
                  <input
                    value={each.myValue2}
                    className="w-12 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                    onChange={(e) =>
                      onChangeValue(each.id, { myValue2: e.target.value })
                    }
                  />
                </td>
                <td className="px-2 py-2  text-center  text-wrap text-xs">
                  {each.lowestValue} - {each.myValue2}
                </td>
                <td className="px-2 py-2  text-center cursor-pointer  text-wrap text-xs">
                  <button
                    onClick={() => {
                      onDelete(each.id);
                    }}
                    className="cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
