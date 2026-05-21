"use client"

import React, { useRef, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { triggerGuestLoginPopup } from '@/components/ui/SessionExpiredBanner'
import { useGuestUser } from '@/context/GuestUserContext'

const ChatInput = ({ input, setInput, onSend, quickPrompts, onQuickPrompt }) => {
    const textareaRef = useRef(null)
    const { isGuest, guestId } = useGuestUser()

    // Reset guest prompt count when guest session starts
    useEffect(() => {
        if (isGuest === true) {
            const storedGuestId = localStorage.getItem('guestId')
            const currentSessionGuestId = localStorage.getItem('currentSessionGuestId')
            
            // If it's a new guest session, reset the prompt count
            if (storedGuestId && storedGuestId !== currentSessionGuestId) {
                localStorage.setItem('guestPromptCount', '0')
                localStorage.setItem('currentSessionGuestId', storedGuestId)
            } else if (!currentSessionGuestId && storedGuestId) {
                localStorage.setItem('guestPromptCount', '0')
                localStorage.setItem('currentSessionGuestId', storedGuestId)
            }
        }
    }, [isGuest, guestId])

    useEffect(() => {
        if (!textareaRef.current) return
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }, [input])

    const incrementGuestPromptCount = () => {
        // Only apply prompt counting for guests (isGuest must be explicitly true)
        if (isGuest !== true) return false
        
        const count = parseInt(localStorage.getItem('guestPromptCount') || '0', 10) + 1
        localStorage.setItem('guestPromptCount', count)
        if (count > 5) {
            triggerGuestLoginPopup()
            return true
        }
        return false
    }

    const handleSend = (input) => {
        if (incrementGuestPromptCount()) return
        onSend(input)
    }

    const handleQuickPrompt = (prompt) => {
        if (incrementGuestPromptCount()) return
        onQuickPrompt(prompt)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend(input)
        }
    }

    return (
        <div className="flex flex-col gap-2">
            {quickPrompts?.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {quickPrompts.map((p, i) => (
                        <button key={i} onClick={() => handleQuickPrompt(p.replace(/^[^\s]+\s/, ''))}
                            className="text-[11px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap bg-white/60 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] text-gray-500 dark:text-gray-400 hover:border-emerald-400/30 hover:text-emerald-600 dark:hover:text-emerald-400 backdrop-blur-sm transition-all">
                            {p}
                        </button>
                    ))}
                </div>
            )}
            <div className="relative bg-white/70 dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.06] rounded-2xl backdrop-blur-xl shadow-sm dark:shadow-none transition-all focus-within:border-emerald-400/40 focus-within:shadow-emerald-500/5 focus-within:shadow-lg">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything about cooking..."
                    rows={1}
                    className="w-full resize-none bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 px-4 py-3 pr-12 outline-none"
                />
                <button
                    onClick={() => handleSend(input)}
                    disabled={!input.trim()}
                    className="absolute right-2.5 bottom-2.5 w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-600 transition-all"
                >
                    <ArrowUp className="w-3.5 h-3.5" />
                </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 dark:text-gray-600">Press Enter to send</p>
        </div>
    )
}

export default ChatInput
