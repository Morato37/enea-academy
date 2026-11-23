import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, LogOut, Settings, Map, Info, Ticket, TreePine, Flower, Library, ChevronDown, Leaf, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSelections } from '../../contexts/SelectionsContext';
import { useAdminTicketAlerts } from '../../hooks/useAdminTicketAlerts';

export const Header: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { selections } = useSelections();
  const location = useLocation();
  const [plantsMenuOpen, setPlantsMenuOpen] = useState(false);
  const [mobilePlantsOpen, setMobilePlantsOpen] = useState(false);
  const plantsMenuRef = useRef<HTMLDivElement>(null);
  const mobilePlantsMenuRef = useRef<HTMLDivElement>(null);

  const selectionCount = selections.length;
  const { openCount, newTickets, dismiss } = useAdminTicketAlerts(user?.id, isAdmin);

  // Opening the support page counts as "seen": close the new-ticket alerts.
  useEffect(() => {
    if (location.pathname === '/tickets') dismiss();
  }, [location.pathname, dismiss]);

  const openBadge = isAdmin && openCount > 0 ? (
    <span
      className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold leading-5 text-white"
      title={`${openCount} offene${openCount === 1 ? 's' : ''} Ticket${openCount === 1 ? '' : 's'}`}
    >
      {openCount}
    </span>
  ) : null;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideDesktopMenu = plantsMenuRef.current?.contains(target);
      const insideMobileMenu = mobilePlantsMenuRef.current?.contains(target);
      if (!insideDesktopMenu && !insideMobileMenu) {
        setPlantsMenuOpen(false);
        setMobilePlantsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const isPlantsActive =
    location.pathname === '/plants' ||
    location.pathname.startsWith('/plant/') ||
    location.pathname === '/bluehkalender' ||
    location.pathname.startsWith('/bluehkalender') ||
    location.pathname === '/tree-benefits';

  const navLinkClass = (isActive: boolean) =>
    `text-sm font-medium transition-colors flex items-center ${
      isActive ? 'text-cyan-600' : 'text-gray-600 hover:text-cyan-600'
    }`;

  const mobileLinkClass = (isActive: boolean) =>
    `text-gray-600 hover:text-cyan-600 font-medium transition-colors ${
      isActive ? 'text-cyan-600' : ''
    }`;

  return (
    <header className="relative z-[1100] bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <img src="/enea-logo.png" alt="Enea Logo" className="h-8" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-700 leading-none">
                Enea Academy
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-7">
            <Link
              to="/zone-map"
              className={navLinkClass(location.pathname === '/zone-map')}
            >
              <Map className="w-4 h-4 mr-1.5" />
              Zone Map
            </Link>

            {/* Plants group with dropdown */}
            <div ref={plantsMenuRef} className="relative">
              <button
                className={navLinkClass(isPlantsActive)}
                onClick={() => setPlantsMenuOpen(!plantsMenuOpen)}
              >
                <Leaf className="w-4 h-4 mr-1.5" />
                Plants
                <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform ${plantsMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {plantsMenuOpen && (
                <div className="absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-3">
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                    <Link
                      to="/plants"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
                      onClick={() => setPlantsMenuOpen(false)}
                    >
                      <Leaf className="w-4 h-4 mr-3 text-gray-400" />
                      Plant Catalog
                    </Link>
                    {user && (
                      <Link
                        to="/bluehkalender"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
                        onClick={() => setPlantsMenuOpen(false)}
                      >
                        <Flower className="w-4 h-4 mr-3 text-gray-400" />
                        Bloom Calendar
                      </Link>
                    )}
                    <Link
                      to="/tree-benefits"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
                      onClick={() => setPlantsMenuOpen(false)}
                    >
                      <TreePine className="w-4 h-4 mr-3 text-gray-400" />
                      Tree Benefits
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/stones"
              className={navLinkClass(location.pathname === '/stones' || location.pathname.startsWith('/stone/'))}
            >
              Stones
            </Link>

            {user && (
              <Link
                to="/library"
                className={navLinkClass(location.pathname === '/library')}
              >
                <Library className="w-4 h-4 mr-1.5" />
                Library
              </Link>
            )}

            <Link
              to="/additional-information"
              className={navLinkClass(location.pathname === '/additional-information')}
            >
              <Info className="w-4 h-4 mr-1.5" />
              Info
            </Link>

            <Link
              to="/tickets"
              className={navLinkClass(location.pathname === '/tickets')}
            >
              <Ticket className="w-4 h-4 mr-1.5" />
              Support
              {openBadge}
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className={navLinkClass(location.pathname === '/admin')}
              >
                <Settings className="w-4 h-4 mr-1.5" />
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

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center space-x-5 pb-3 overflow-x-auto">
          <Link
            to="/zone-map"
            className={mobileLinkClass(location.pathname === '/zone-map')}
          >
            Map
          </Link>

          {/* Plants group - expandable on mobile */}
          <div ref={mobilePlantsMenuRef} className="relative shrink-0">
            <button
              onClick={() => setMobilePlantsOpen(!mobilePlantsOpen)}
              className={mobileLinkClass(isPlantsActive)}
            >
              Plants
              <ChevronDown className={`ml-1 inline h-3.5 w-3.5 transition-transform ${mobilePlantsOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobilePlantsOpen && (
              <div className="absolute left-0 top-full z-50 w-52 pt-3">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                  <Link
                    to="/plants"
                    onClick={() => setMobilePlantsOpen(false)}
                    className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-cyan-50 hover:text-cyan-700"
                  >
                    <Leaf className="mr-3 h-4 w-4 text-gray-400" />
                    Plant Catalog
                  </Link>
                  {user && (
                    <Link
                      to="/bluehkalender"
                      onClick={() => setMobilePlantsOpen(false)}
                      className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-cyan-50 hover:text-cyan-700"
                    >
                      <Flower className="mr-3 h-4 w-4 text-gray-400" />
                      Bloom Calendar
                    </Link>
                  )}
                  <Link
                    to="/tree-benefits"
                    onClick={() => setMobilePlantsOpen(false)}
                    className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-cyan-50 hover:text-cyan-700"
                  >
                    <TreePine className="mr-3 h-4 w-4 text-gray-400" />
                    Tree Benefits
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            to="/stones"
            className={mobileLinkClass(location.pathname === '/stones' || location.pathname.startsWith('/stone/'))}
          >
            Stones
          </Link>
          {user && (
            <Link
              to="/library"
              className={mobileLinkClass(location.pathname === '/library')}
            >
              Library
            </Link>
          )}
          <Link
            to="/additional-information"
            className={mobileLinkClass(location.pathname === '/additional-information')}
          >
            Info
          </Link>
          <Link
            to="/tickets"
            className={mobileLinkClass(location.pathname === '/tickets')}
          >
            Support
            {openBadge}
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className={mobileLinkClass(location.pathname === '/admin')}
            >
              Admin
            </Link>
          )}
        </nav>
      </div>

      {newTickets.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[1300] w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-xl" role="status">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Ticket className="h-4 w-4 text-red-500" />
              {newTickets.length === 1 ? 'Neues Support-Ticket' : `${newTickets.length} neue Support-Tickets`}
            </div>
            <button type="button" onClick={() => dismiss()} className="text-gray-400 hover:text-gray-600" aria-label="Schliessen">
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            {newTickets.slice(0, 3).map(ticket => (
              <li key={ticket.id} className="truncate">{ticket.title}</li>
            ))}
            {newTickets.length > 3 && <li className="text-gray-400">… und {newTickets.length - 3} weitere</li>}
          </ul>
          <Link to="/tickets" className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-900">
            Tickets ansehen →
          </Link>
        </div>
      )}
    </header>
  );
};
