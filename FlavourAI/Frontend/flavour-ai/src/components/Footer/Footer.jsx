import React from 'react'
import Loader from '../Loader/Loader'

const Footer = ({ loading = false }) => {
  return (
    <>
      {loading && <Loader />}
      <div>
        <footer>
          <div className="bg-white/20 backdrop-blur-xl py-6 mt-10">
            <div className="container mx-auto text-center text-gray-600">
              <p>&copy; {new Date().getFullYear()} Flavour AI. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

export default Footer
