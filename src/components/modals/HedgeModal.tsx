import React, { useEffect, useRef, useState } from "react";
import { X, GripHorizontal, Shield } from "lucide-react";

interface HedgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HedgeSettings {
  hedgeType: "ATM" | "OTM" | "ITM";
  strikeDistance: number;
  hedgeRatio: number;
  autoHedge: boolean;
  hedgeTrigger: number;
}

const HedgeModal: React.FC<HedgeModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<HedgeSettings>({
    hedgeType: "ATM",
    strikeDistance: 0,
    hedgeRatio: 1,
    autoHedge: false,
    hedgeTrigger: 0,
  });

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle hedge settings submission
    console.log("Hedge settings:", formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className={`bg-gray-800 border border-gray-400 rounded-lg p-6 w-full max-w-md cursor-move select-none ${
          isDragging ? "opacity-90" : ""
        }`}
        style={{
          position: "absolute",
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <div
            className="flex items-center space-x-2 cursor-move"
            onMouseDown={handleMouseDown}
          >
            <GripHorizontal size={16} className="text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Hedge Settings</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Hedge Type
            </label>
            <select
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.hedgeType}
              onChange={(e) =>
                setFormData({ ...formData, hedgeType: e.target.value as "ATM" | "OTM" | "ITM" })
              }
            >
              <option value="ATM">At The Money (ATM)</option>
              <option value="OTM">Out of The Money (OTM)</option>
              <option value="ITM">In The Money (ITM)</option>
            </select>
          </div>

          {formData.hedgeType !== "ATM" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Strike Distance
              </label>
              <input
                type="number"
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.strikeDistance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    strikeDistance: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="Enter strike distance"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Hedge Ratio
            </label>
            <input
              type="number"
              step="0.1"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.hedgeRatio}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hedgeRatio: parseFloat(e.target.value) || 1,
                })
              }
              placeholder="Enter hedge ratio (e.g., 0.5 for 50%)"
            />
          </div>

          <div className="flex items-center space-x-3">
            <Shield className="text-orange-400" size={20} />
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.autoHedge}
                onChange={(e) =>
                  setFormData({ ...formData, autoHedge: e.target.checked })
                }
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
              <span className="ms-3 text-sm font-medium text-white">
                Enable Auto Hedge
              </span>
            </label>
          </div>

          {formData.autoHedge && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Auto Hedge Trigger (MTM Loss)
              </label>
              <input
                type="number"
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.hedgeTrigger}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hedgeTrigger: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Enter trigger amount"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
            >
              Apply Hedge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HedgeModal;