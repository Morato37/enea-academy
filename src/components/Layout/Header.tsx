import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, LogOut, Settings, Map, Info, Ticket, TreePine } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSelections } from '../../contexts/SelectionsContext';

export const Header: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { selections } = useSelections();

  const selectionCount = selections.length;

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <img src="/enea-logo.png" alt="Enea Logo" className="h-8" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-700 leading-none">
                Enea's Academy
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/zone-map"
              className="text-gray-600 hover:text-cyan-600 font-medium transition-colors flex items-center"
            >
              <Map className="w-4 h-4 mr-1" />
              Zone Map
            </Link>
            <Link
              to="/plants"
              className="text-gray-600 hover:text-cyan-600 font-medium transition-colors"
            >
              Plants
            </Link>
            <Link
              to="/stones"
              className="text-gray-600 hover:text-cyan-600 font-medium transition-colors"
            >
              Stones
            </Link>
            <Link
              to="/tree-benefits"
              className="text-gray-600 hover:text-cyan-600 font-medium transition-colors flex items-center"
            >
              <TreePine className="w-4 h-4 mr-1" />
              Tree Benefits
            </Link>
            <Link
              to="/additional-information"
              className="text-gray-600 hover:text-cyan-600 font-medium transition-colors flex items-center"
            >
              <Info className="w-4 h-4 mr-1" />
              Info
            </Link>
            <Link
              to="/tickets"
              className="text-gray-600 hover:text-cyan-600 font-medium transition-colors flex items-center"
            >
              <Ticket className="w-4 h-4 mr-1" />
              Support
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="text-gray-600 hover:text-cyan-600 font-medium transition-colors flex items-center"
              >
                <Settings className="w-4 h-4 mr-1" />
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              to="/selections"
              className="relative flex items-center text-gray-600 hover:text-orange-500 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {selectionCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {selectionCount}
                </span>
              )}
            </Link>

            {user && (
              <button
                onClick={signOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Sign Out</span>
              </button>
            )}
          </div>
        </div>

        <nav className="md:hidden flex items-center space-x-6 pb-3">
          <Link
            to="/zone-map"
            className="text-gray-600 hover:text-cyan-600 font-medium transition-colors"
          >
            Map
          </Link>
          <Link
            to="/plants"
            className="text-gray-600 hover:text-cyan-600 font-medium transition-colors"
          >
            Plants
          </Link>
          <Link
            to="/stones"
            className="text-gray-600 hover:text-cyan-600 font-medium transition-colors"
          >
            Stones
          </Link>
          <Link
            to="/tree-benefits"
            className="text-gray-600 hover:text-cyan-600 font-medium transition-colors"
          >
            Trees
          </Link>
          <Link
            to="/additional-information"
            className="text-gray-600 hover:text-cyan-600 font-medium transition-colors"
          >
            Info
          </Link>
          <Link
            to="/tickets"
            className="text-gray-600 hover:text-cyan-600 font-medium transition-colors"
          >
            Support
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="text-gray-600 hover:text-cyan-600 font-medium transition-colors"
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
