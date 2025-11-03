const Footer = () => (
  <footer className="bg-gray-900 border-t border-gray-700/50">
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} ChefAI by Jatin Pathania & Kumar Vaibhav.
        <div className="mt-2 space-x-4">
          <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
          <span className="text-gray-600">|</span>
          <a href="#terms" className="hover:text-white transition-colors">Terms</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer