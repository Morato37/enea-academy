import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mountain, ShoppingCart, Map, FolderSearch, TreePine, Library } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const HomePage: React.FC = () => {
  const { isAdmin } = useAuth();
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <img src="/enea-logo.png" alt="Enea Logo" className="h-16" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Enea Academy
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Your comprehensive resource for landscape architecture. Browse our extensive
            collection of plants and stones to create the perfect outdoor space.
          </p>
        </div>

        <Link
          to="/zone-map"
          className="block bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl border-2 border-cyan-400 hover:border-cyan-300 transition-all p-8 mb-8 group shadow-lg hover:shadow-cyan-500/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full group-hover:bg-white/20 transition-colors">
                <Map className="w-10 h-10 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-3xl font-bold text-white mb-2">Hardiness Zone Explorer</h2>
                <p className="text-cyan-50 text-lg">
                  Find the perfect plants and stones for your region with our interactive map
                </p>
              </div>
            </div>
            <div className="text-white opacity-50 group-hover:opacity-100 transition-opacity">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
          <Link
            to="/plants"
            className="bg-white rounded-lg border border-gray-300 hover:border-cyan-500 transition-all p-8 text-center group shadow-sm"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4 group-hover:bg-cyan-500/20 transition-colors">
              <Leaf className="w-10 h-10 text-cyan-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Plants</h2>
            <p className="text-gray-700">
              Explore our comprehensive plant catalog with detailed information on climate
              zones, growing conditions, and characteristics.
            </p>
          </Link>

          <Link
            to="/stones"
            className="bg-white rounded-lg border border-gray-300 hover:border-cyan-600 transition-all p-8 text-center group shadow-sm"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4 group-hover:bg-cyan-600/20 transition-colors">
              <Mountain className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Stones</h2>
            <p className="text-gray-700">
              Browse our stone and hardscape materials collection with specifications,
              applications, and availability information.
            </p>
          </Link>

          <Link
            to="/selections"
            className="bg-white rounded-lg border border-gray-300 hover:border-orange-500 transition-all p-8 text-center group shadow-sm"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4 group-hover:bg-orange-500/20 transition-colors">
              <ShoppingCart className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">My Selections</h2>
            <p className="text-gray-700">
              View and manage your selected plants and stones. Export your selections as a
              professional PDF document.
            </p>
          </Link>

          {isAdmin && (
            <Link
              to="/library"
              className="bg-white rounded-lg border border-gray-300 hover:border-sky-500 transition-all p-8 text-center group shadow-sm"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4 group-hover:bg-sky-500/20 transition-colors">
                <Library className="w-10 h-10 text-sky-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Library</h2>
              <p className="text-gray-700">
                Browse and reserve books from the Enea collection. See which books are available and who has them.
              </p>
            </Link>
          )}

          <Link
            to="/tree-benefits"
            className="bg-white rounded-lg border border-gray-300 hover:border-green-600 transition-all p-8 text-center group shadow-sm"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4 group-hover:bg-green-500/20 transition-colors">
              <TreePine className="w-10 h-10 text-green-700" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Tree Benefits</h2>
            <p className="text-gray-700">
              Calculate ecosystem services of trees, including carbon storage, air quality, oxygen and runoff.
            </p>
          </Link>

          <a
            href="https://image-enea.bolt.host/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-lg border border-gray-300 hover:border-cyan-500 transition-all p-8 text-center group shadow-sm flex flex-col items-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4 group-hover:bg-cyan-500/20 transition-colors">
              <FolderSearch className="w-10 h-10 text-cyan-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Image Search</h2>
            <p className="text-gray-700 mb-3">
              Browse our project database for plants, materials, and moods.
            </p>
            <p className="text-xs text-red-500 font-medium">
              Login with the same credentials as the Academy.
            </p>
          </a>

        </div>

      </div>
    </div>
  );
};
