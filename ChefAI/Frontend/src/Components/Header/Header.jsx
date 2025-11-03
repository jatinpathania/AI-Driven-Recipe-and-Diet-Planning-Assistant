import React from "react";

const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 shadow-xl shadow-gray-900/50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        {/* Logo */}
        <div className="shrink-0 flex items-center">
          <IconChefHat className="h-8 w-8 text-amber-500 mr-2" />
          <span className="text-2xl font-extrabold text-white tracking-tight">
            Chef<span className="text-green-400">AI</span>
          </span>
        </div>
        
        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex space-x-8">
          {['Generate', 'Plans', 'Insights', 'Account'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-gray-300 hover:text-amber-400 px-3 py-2 text-sm font-medium transition duration-150 rounded-md">
              {item}
            </a>
          ))}
        </nav>

        {/* Action Button */}
        <div className="hidden md:block">
          <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900">
            My Dashboard
          </button>
        </div>

        {/* Mobile Menu Button - Placeholder */}
        <div className="md:hidden">
            <button className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
        </div>
      </div>
    </div>
  </header>
);
export default Header;