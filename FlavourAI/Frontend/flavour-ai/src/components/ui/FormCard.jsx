import React from 'react'

export default function FormCard({ children, className = '' }) {
  return (
    <div
      className={`relative w-full max-w-md mx-auto p-8 sm:p-10 bg-white/50 bg-gradient-to-b from-white/80 to-white/20 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/25 ring-1 ring-white/10 ${className}`}
    >
      {children}
    </div>
  )
}
