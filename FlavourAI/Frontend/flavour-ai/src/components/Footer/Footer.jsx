import React from 'react'

const Footer = () => {
  return (
    <div>
      <footer>
        <div className="bg-white/80 backdrop-blur-sm py-6 mt-10">
          <div className="container mx-auto text-center text-gray-600">
            <p>&copy; {new Date().getFullYear()} Flavour AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Footer
