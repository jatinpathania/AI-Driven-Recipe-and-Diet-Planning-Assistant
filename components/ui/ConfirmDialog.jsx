"use client"

import React from 'react'

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Yes', cancelText = 'No', isDangerous = false }) => {
    if (!isOpen) return null

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onCancel} />
            <div className="fixed inset-0 flex items-center justify-center z-[101]">
                <div className="bg-white dark:bg-[#0f1419] rounded-2xl shadow-2xl p-6 max-w-sm mx-4 border border-black/[0.06] dark:border-white/[0.06]">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/[0.08] text-gray-900 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-white/[0.12] transition-colors cursor-pointer"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                                isDangerous
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ConfirmDialog
