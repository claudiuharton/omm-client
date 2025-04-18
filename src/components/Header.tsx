import { useState, useEffect, useRef, useCallback } from "react";
import { RiMenu2Line, RiCloseLine, RiHome2Line, RiLogoutBoxLine, RiAdminLine, RiCarLine, RiMapPinLine } from "react-icons/ri";
import { Link, useLocation } from "react-router-dom";
import { useWindowSize } from "../hooks";
import { useAuth } from "../hooks/useAuth";

/**
 * Navigation item props
 */
interface NavItemProps {
  to?: string;
  onClick?: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Navigation item component - used for both links and buttons
 */
const NavItem = ({ to, onClick, children, icon, className = "" }: NavItemProps) => {
  const baseClasses = "flex items-center gap-2 py-2 px-4 rounded-lg transition-colors w-full md:w-auto text-center";
  const navClasses = `${baseClasses} ${className || "hover:bg-indigo-700"}`;

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={navClasses}>
        {icon && <span className="text-xl">{icon}</span>}
        <span>{children}</span>
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={navClasses}>
      {icon && <span className="text-xl">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

/**
 * Header component
 * - Provides navigation for authenticated users
 * - Implements responsive mobile menu
 * - Handles user logout
 */
export const Header = () => {
  const [showMenu, setShowMenu] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const { isMobile } = useWindowSize();

  const { logoutUser, user } = useAuth();

  /**
   * Close mobile menu
   */
  const closeMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  /**
   * Handle user logout
   */
  const handleLogout = useCallback(() => {
    logoutUser();
    closeMenu();
  }, [logoutUser, closeMenu]);

  /**
   * Handle clicks outside the menu to close it
   */
  useEffect(() => {
    // Close menu when location changes (route navigation)
    closeMenu();
  }, [location, closeMenu]);

  /**
   * Set up event listeners for clicks outside the menu
   */
  useEffect(() => {
    // Only add listener when menu is open
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isNavClick = navRef.current?.contains(target);
      const isButtonClick = buttonRef.current?.contains(target);

      if (!isNavClick && !isButtonClick) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Prevent scrolling when menu is open on mobile
    if (isMobile) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [showMenu, isMobile]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-20 bg-indigo-600 shadow-lg">
        <div className="container mx-auto h-full px-4 lg:px-6 flex items-center justify-between">
          <Link
            to="/"
            className="font-extrabold uppercase text-2xl md:text-3xl text-white hover:text-indigo-100 transition-colors"
          >
            Our Mobile Mechanic
          </Link>

          {/* Mobile overlay when menu is open */}
          {showMenu && (
            <div
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={closeMenu}
              aria-hidden="true"
            />
          )}

          {/* Navigation menu */}
          <nav
            ref={navRef}
            onClick={closeMenu}
            className={`
              flex items-center gap-5 uppercase font-medium text-white
              fixed md:static inset-y-0 right-0 z-50
              flex-col md:flex-row justify-center md:justify-end
              bg-indigo-600 md:bg-transparent
              w-64 md:w-auto p-8 md:p-0
              shadow-lg md:shadow-none
              transform ${showMenu ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0
              transition-transform duration-300 ease-in-out
            `}
            aria-label="Main navigation"
          >
            {/* Close button for mobile menu */}
            <button
              className="absolute top-4 right-4 md:hidden text-white text-2xl hover:text-indigo-200"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <RiCloseLine />
            </button>

            {/* Common navigation items for all users */}
            <NavItem
              to="/"
              onClick={closeMenu}
              icon={<RiHome2Line />}
            >
              Home
            </NavItem>

            {/* User has cars can add/manage them */}
            {user?.role === 'client' && (
              <NavItem
                to="/new-car"
                onClick={closeMenu}
                icon={<RiCarLine />}
              >
                Add Car
              </NavItem>
            )}
            {/* Admin-specific navigation */}
            {user?.role === 'admin' && (
              <NavItem
                to="/admin"
                onClick={closeMenu}
                icon={<RiAdminLine />}
              >
                Admin Dashboard
              </NavItem>
            )}

            {/* Address settings if needed */}
            {!user?.zipCode && (
              <NavItem
                to="/add-address"
                onClick={closeMenu}
                icon={<RiMapPinLine />}
              >
                Add Address
              </NavItem>
            )}

            {/* Logout button - always last */}
            <NavItem
              onClick={handleLogout}
              className="uppercase bg-red-500 hover:bg-red-600"
              icon={<RiLogoutBoxLine />}
            >
              Log Out
            </NavItem>
          </nav>
        </div>
      </header>

      {/* Toggle menu button */}
      <button
        ref={buttonRef}
        onClick={() => setShowMenu(!showMenu)}
        className="md:hidden fixed right-5 bottom-5 z-50 bg-indigo-600 hover:bg-indigo-700 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
        aria-label="Toggle menu"
        aria-expanded={showMenu}
        aria-controls="main-navigation"
      >
        <RiMenu2Line size={24} />
      </button>

      {/* Spacer to prevent content from being hidden under the fixed header */}
      <div className="pt-20" />
    </>
  );
};
