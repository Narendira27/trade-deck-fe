import { Minus, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface DraggableBoxData {
  id: string;
  index: string;
  ltpRange: string;
  expiry: string;
  isHidden: boolean;
}

interface DraggableBoxProps {
  data: DraggableBoxData;
  removeBox: () => void;
  hideBox: () => void;
}

const DraggableBox = ({ data, removeBox, hideBox }: DraggableBoxProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);

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

  return data.isHidden === false ? (
    <div
      ref={boxRef}
      className={`absolute bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 cursor-move select-none
        ${isDragging ? "opacity-90" : ""}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "250px",
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        onClick={hideBox}
        className="space-x-2 flex w-full h-full flex-row justify-end items-center cursor-pointer "
      >
        <button className="text-gray-400 hover:text-white ">
          <Minus size={20} />
        </button>
        <button onClick={removeBox} className="text-gray-400 hover:text-white ">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-gray-400">Index:</span>
          <span className="ml-2 text-white font-medium">{data.index}</span>
        </div>
        <div>
          <span className="text-gray-400">Expiry:</span>
          <span className="ml-2 text-white font-medium">{data.expiry}</span>
        </div>
        <div>
          <span className="text-gray-400">LTP Range:</span>
          <span className="ml-2 text-white font-medium">{data.ltpRange}</span>
        </div>
        <div>
          <span className="text-gray-400">Lowest Value:</span>
          <span className="ml-2 text-white font-medium"></span>
        </div>
      </div>
    </div>
  ) : null;
};

export default DraggableBox;
