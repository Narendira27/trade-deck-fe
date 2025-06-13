import React from "react";
import {
  LayoutDashboard,
  Menu,
  BarChart2,
  LogOut,
  KeyRound,
} from "lucide-react";
import cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import KeyModal from "./modals/keyModal";
import { toast } from "sonner";

const SideNav: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = React.useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-3 sm:top-2 right-4 z-50 p-2 rounded-md bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu size={20} />
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 transform transition-all duration-300 ease-in-out group
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:w-16 lg:hover:w-64
        `}
      >
        {/* Logo */}
        <div className="flex items-center lg:hidden space-x-3 p-4 border-b border-gray-800">
          <BarChart2 className="text-blue-500 flex-shrink-0" size={24} />
          <span className="text-lg font-semibold text-white whitespace-nowrap lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
            TradeDeck
          </span>
        </div>

        <div className="flex flex-col h-[calc(100%-5rem)] lg:h-full justify-between p-4">
          {/* Navigation Links */}
          <div className="flex flex-col space-y-1">
            <a
              href="#"
              className="flex items-center text-gray-400 px-3 py-2 rounded-md hover:text-white hover:bg-gray-800 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <LayoutDashboard className="flex-shrink-0" size={18} />
              <span className="ml-3 whitespace-nowrap lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                Dashboard
              </span>
            </a>
          </div>

          <div>
            <button
              className="flex items-center text-gray-400 px-3 py-2 rounded-md hover:text-white hover:bg-gray-800 transition-colors mt-auto w-full"
              onClick={() => setIsKeyModalOpen(true)}
            >
              <KeyRound className="flex-shrink-0" size={18} />
              <span className="ml-3 whitespace-nowrap lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                Update API Key
              </span>
            </button>

            <button
              className="flex items-center text-gray-400 px-3 py-2 rounded-md hover:text-white hover:bg-gray-800 transition-colors mt-auto w-full"
              onClick={() => {
                setIsOpen(false);
                cookies.remove("auth");
                navigate("/login");
                toast.info("Successfully logged out");
              }}
            >
              <LogOut className="flex-shrink-0" size={18} />
              <span className="ml-3 whitespace-nowrap lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                Logout
              </span>
            </button>
          </div>
        </div>
      </div>
      <KeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
      />
    </>
  );
};

export default SideNav;
