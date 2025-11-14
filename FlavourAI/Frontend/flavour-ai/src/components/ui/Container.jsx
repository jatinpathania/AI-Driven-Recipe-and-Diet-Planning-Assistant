import React from 'react'

export default function Container({ children, className = '' }) {
  return (
    <div className={`mx-auto px-4 sm:px-6 md:px-8 w-full ${className}`}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </div>
  )
}
