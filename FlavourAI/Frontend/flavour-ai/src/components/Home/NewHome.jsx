'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Send, X, ArrowUp, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from "@/components/Header/Header"
import Footer from '@/components/Footer/Footer'
import Link from 'next/link'

const Home = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "👋 Hi! Tell me what ingredients you have and I'll suggest what to cook. Or just ask me anything about food!" }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatContainerRef = useRef(null)
  const [isSignupOpen, setIsSignupOpen] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)

  const HERO_RESPONSES = [
    { 
      match: ['chicken','lemon','garlic'], 
      reply: "Perfect combo! Here are 3 quick recipes:", 
      recipes: [
        {e:'🍋',t:'Lemon Garlic Chicken',m:'22 min · 380 kcal'},
        {e:'🥗',t:'Chicken Florentine',m:'28 min · 420 kcal'},
        {e:'🫕',t:'Chicken Piccata',m:'20 min · 350 kcal'}
      ] 
    },
    { 
      match: ['vegan','plant'], 
      reply: "Love the plant-based choice! How about these:", 
      recipes: [
        {e:'🍲',t:'Lentil & Spinach Curry',m:'30 min · 290 kcal'},
        {e:'🌮',t:'Black Bean Tacos',m:'15 min · 310 kcal'},
        {e:'🥗',t:'Chickpea Power Bowl',m:'10 min · 340 kcal'}
      ] 
    },
    { 
      match: ['protein','muscle','500'], 
      reply: "Fueling those gains! Here are high-protein options:", 
      recipes: [
        {e:'🥩',t:'Grilled Ribeye Steak',m:'40 min · 620 kcal'},
        {e:'🍗',t:'Herb Roasted Chicken',m:'45 min · 480 kcal'},
        {e:'🐟',t:'Salmon with Quinoa',m:'25 min · 520 kcal'}
      ] 
    },
    { 
      match: ['15','quick','fast'], 
      reply: "Got it — under 15 minutes, no problem!", 
      recipes: [
        {e:'🍳',t:'Shakshuka',m:'12 min · 280 kcal'},
        {e:'🥚',t:'Egg Fried Rice',m:'10 min · 350 kcal'},
        {e:'🫔',t:'Turkey Wraps',m:'8 min · 320 kcal'}
      ] 
    },
    { 
      match: ['italian','pasta'], 
      reply: "Bello! Italian tonight it is 🇮🇹", 
      recipes: [
        {e:'🍝',t:'Pasta Carbonara',m:'25 min · 520 kcal'},
        {e:'🍕',t:'Margherita Pizza',m:'35 min · 480 kcal'},
        {e:'🥗',t:'Panzanella Salad',m:'15 min · 280 kcal'}
      ] 
    },
    { 
      match: ['egg','spinach','feta'], 
      reply: "Classic combo! Here's what I'd make:", 
      recipes: [
        {e:'🍳',t:'Spinach & Feta Omelette',m:'10 min · 290 kcal'},
        {e:'🥧',t:'Feta & Egg Frittata',m:'20 min · 310 kcal'},
        {e:'🥗',t:'Greek Salad Bowl',m:'8 min · 220 kcal'}
      ] 
    },
  ]

  const quickSuggestions = [
    { text: '🍗 Chicken + lemon', query: 'I have chicken, garlic and lemon 🍋' },
    { text: '🌱 Quick vegan dinner', query: 'Quick vegan dinner ideas please' },
    { text: '💪 High protein', query: 'High protein meals under 500 calories' },
    { text: '⚡ 15-min meals', query: 'What can I make in 15 minutes?' },
    { text: '🍝 Italian tonight', query: 'I want something Italian tonight' }
  ]

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (isSignupOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isSignupOpen])

  const handleSend = (override) => {
    const msg = override || input.trim()
    if (!msg) return
    
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setIsTyping(true)

    setTimeout(() => {
      setIsTyping(false)
      const res = getHeroResponse(msg)
      setMessages(prev => [...prev, { role: 'ai', content: res.reply, recipes: res.recipes }])
      
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          content: "✨ Want to unlock full recipes, step-by-step timers, calorie tracking and meal planning? Sign up free — takes 30 seconds!",
          hasSignup: true
        }])
      }, 1400)
    }, 800 + Math.random()*500)
  }

  const getHeroResponse = (msg) => {
    const lower = msg.toLowerCase()
    for(const r of HERO_RESPONSES) {
      if(r.match.some(m => lower.includes(m))) return r
    }
    return { 
      reply: "Great choice! Here are some delicious ideas based on what you said:", 
      recipes: [
        {e:'🥘',t:'Chef\'s Special Stew',m:'35 min · 410 kcal'},
        {e:'🥗',t:'Fresh Garden Salad',m:'10 min · 180 kcal'},
        {e:'🍜',t:'Noodle Bowl',m:'20 min · 380 kcal'}
      ] 
    }
  }

  return (
    <div className="landing-page">
      <Header overlay />

      <section className="hero">
        <div className="hero-bg-emoji" style={{top:'12%',left:'5%'}}>🍋</div>
        <div className="hero-bg-emoji" style={{top:'20%',right:'7%'}}>🥕</div>
        <div className="hero-bg-emoji" style={{top:'70%',left:'8%'}}>🥑</div>
        <div className="hero-bg-emoji" style={{top:'75%',right:'5%'}}>🍅</div>
        <div className="hero-bg-emoji" style={{top:'45%',left:'2%'}}>🫑</div>
        <div className="hero-bg-emoji" style={{top:'40%',right:'2%'}}>🥦</div>

        <motion.div 
          className="hero-badge"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="hero-badge-dot"></div> 
          Powered by Claude AI · Trusted by 24,000+ home cooks
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Your <em>personal chef</em>,<br/>always in your pocket
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Just tell Flavour.AI what's in your fridge — it plans meals, generates recipes, tracks calories, and guides you step-by-step through cooking.
        </motion.p>

        <motion.div 
          className="hero-chat"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="hc-header">
            <div className="hc-dots">
              <div className="hc-dot"></div>
              <div className="hc-dot"></div>
              <div className="hc-dot"></div>
            </div>
            <div className="hc-title">✦ Flavour AI — Try it now, no signup needed</div>
            <div className="hc-status">
              <div className="hc-status-dot"></div> Live
            </div>
          </div>

          <div className="hc-messages" ref={chatContainerRef}>
            {messages.map((msg, i) => (
              <motion.div 
                key={i} 
                className={`hc-msg ${msg.role === 'user' ? 'user' : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`hc-av ${msg.role === 'ai' ? 'ai' : 'usr'}`}>
                  {msg.role === 'ai' ? '🥦' : '👤'}
                </div>
                <div>
                  <div className="hc-bubble">{msg.content}</div>
                  {msg.recipes && (
                    <div className="hc-recipe-chips">
                      {msg.recipes.map((r, ri) => (
                        <div key={ri} className="hc-recipe-chip" onClick={() => setIsSignupOpen(true)}>
                          <span style={{fontSize:'20px'}}>{r.e}</span>
                          <div>
                            <strong>{r.t}</strong>
                            <div style={{fontSize:'10px',color:'#6b8575',marginTop:'1px'}}>{r.m}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.hasSignup && (
                    <div style={{marginTop:'10px', display: 'flex', gap: '8px'}}>
                      <Link href="/kitchen">
                        <button className="hc-signup-btn">
                          🍳 Start Cooking →
                        </button>
                      </Link>
                      <button onClick={() => setIsSignupOpen(true)} className="hc-signup-btn" style={{background: 'transparent', border: '2px solid var(--g)', color: 'var(--g)'}}>
                        Sign Up Free
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="hc-msg">
                <div className="hc-av ai">🥦</div>
                <div className="hc-bubble">
                  <div className="typing-ind">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="hc-suggestions">
            {quickSuggestions.map((sug, i) => (
              <div key={i} className="hc-sug" onClick={() => handleSend(sug.query)}>
                {sug.text}
              </div>
            ))}
          </div>

          <div className="hc-input-row">
            <input 
              className="hc-input" 
              type="text" 
              placeholder="e.g. 'I have eggs, spinach and feta...'" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="hc-send" onClick={() => handleSend()}>
              <ArrowUp size={16} />
            </button>
          </div>
        </motion.div>

        <motion.div 
          className="hero-proof"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="proof-avatars">
            <div className="proof-av">👩</div>
            <div className="proof-av">👨</div>
            <div className="proof-av">👩‍🦱</div>
            <div className="proof-av">🧑</div>
            <div className="proof-av">👩‍🦳</div>
          </div>
          <div className="proof-text">Loved by <strong>24,000+</strong> home cooks</div>
          <div className="proof-sep"></div>
          <div className="proof-stat">
            <div className="proof-stat-val">4.9★</div>
            <div className="proof-stat-lbl">App Rating</div>
          </div>
          <div className="proof-sep"></div>
          <div className="proof-stat">
            <div className="proof-stat-val">2M+</div>
            <div className="proof-stat-lbl">Recipes Generated</div>
          </div>
        </motion.div>
      </section>

      <div className="logos-strip">
        <span className="logos-label">As seen in</span>
        <div className="logos-list">
          <span className="logo-item">TechCrunch</span>
          <span className="logo-item">Product Hunt</span>
          <span className="logo-item">Food & Wine</span>
          <span className="logo-item">The Verge</span>
          <span className="logo-item">Bon Appétit</span>
        </div>
      </div>

      <section id="how" className="section">
        <div className="section-label">Simple as 1, 2, 3</div>
        <h2 className="section-title">Cooking has never been<br/>this <em>effortless</em></h2>
        <p className="section-sub">From empty fridge to delicious dinner in minutes. No culinary degree required.</p>
        <div className="how-steps">
          <div className="how-step">
            <div className="step-num-wrap">
              <div className="step-emoji">🥦</div>
              <div className="step-badge">1</div>
            </div>
            <h3>Tell us what you have</h3>
            <p>Type your ingredients, dietary preferences, or craving. Our AI understands natural language perfectly.</p>
          </div>
          <div className="how-step">
            <div className="step-num-wrap">
              <div className="step-emoji">✨</div>
              <div className="step-badge">2</div>
            </div>
            <h3>Get personalized recipes</h3>
            <p>Flavour.AI generates tailored recipes with full instructions, nutrition info, and cook times — in seconds.</p>
          </div>
          <div className="how-step">
            <div className="step-num-wrap">
              <div className="step-emoji">🍽️</div>
              <div className="step-badge">3</div>
            </div>
            <h3>Cook with guidance</h3>
            <p>Follow step-by-step with built-in timers, track calories automatically, and plan your whole week.</p>
          </div>
        </div>
      </section>

      <section id="features" className="section features-section">
        <div className="section-label">Everything you need</div>
        <h2 className="section-title">One app for your<br/>entire culinary life</h2>
        <p className="section-sub">Six powerful tools, all working together seamlessly — and all powered by AI.</p>
        <div className="features-grid">
          {[
            { icon: '✦', title: 'AI Chef Chat', desc: 'A real-time AI chef that answers any food question, generates custom recipes from your ingredients, and guides you through cooking.', tag: 'Powered by Claude' },
            { icon: '⏱️', title: 'Smart Cooking Timer', desc: 'Visual countdown timers that sync with your recipe steps. Audio alerts so you never overcook again.', tag: 'Step-by-step' },
            { icon: '🔥', title: 'Calorie Tracker', desc: 'Log meals in seconds, track macros, set daily goals and visualize your weekly nutrition patterns — no spreadsheets needed.', tag: 'Macro tracking' },
            { icon: '📅', title: 'Weekly Meal Planner', desc: 'Drag-and-drop meal planning for the whole week. The AI can auto-fill your plan based on your goals and preferences.', tag: 'Auto-planning' },
            { icon: '📝', title: 'Recipe Notes', desc: 'Save recipes, shopping lists, and meal plan notes in one place. Organized by category, searchable, always with you.', tag: 'Searchable' },
            { icon: '🍽️', title: 'Recipe Library', desc: 'Browse hundreds of curated recipes filtered by diet, time, difficulty and cuisine. Each one links directly to timers and calorie tracking.', tag: '500+ recipes' }
          ].map((feat, i) => (
            <motion.div 
              key={i} 
              className="feat-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="feat-icon-wrap">{feat.icon}</div>
              <h3>{feat.title}</h3>
              <p>{feat.desc}</p>
              <span className="feat-tag">{feat.tag}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="testimonials" className="section testimonials-section">
        <div className="section-label">Real people, real meals</div>
        <h2 className="section-title">They tried it.<br/>They're hooked.</h2>
        <p className="section-sub">Join thousands of home cooks who've transformed their relationship with food.</p>
        <div className="testi-grid">
          {[
            { stars: 5, text: "I opened the fridge, typed what I had, and had a gourmet pasta on the table in 25 minutes. This thing is genuinely magic.", name: 'Sarah M.', role: 'Home cook · London', avatar: '👩' },
            { stars: 5, text: "The calorie tracker + meal planner combo changed everything for my fitness goals. I don't have to think about what to eat anymore.", name: 'James R.', role: 'Fitness enthusiast · NYC', avatar: '🧑' },
            { stars: 5, text: "As a busy mum of three, this is a lifesaver. The weekly meal planner alone saves me hours every week. Absolutely worth it.", name: 'Priya K.', role: 'Busy parent · Toronto', avatar: '👩‍🦱' },
            { stars: 5, text: "The AI actually understands what I mean when I say 'something cozy with lentils'. I've discovered so many dishes I never would have tried.", name: 'Marco T.', role: 'Food lover · Milan', avatar: '👨' },
            { stars: 5, text: "The cooking timer syncing with recipe steps is such a simple idea but no other app does it. I burned things all the time before this.", name: 'Linda W.', role: 'Recipe collector · Austin', avatar: '👩‍🦳' },
            { stars: 4, text: "I was skeptical about AI cooking apps but this one actually knows food. The recipes aren't generic — they feel like they were made for me.", name: 'Alex C.', role: 'Amateur chef · Singapore', avatar: '🧑‍🍳' }
          ].map((testi, i) => (
            <motion.div 
              key={i} 
              className="testi-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="testi-stars">{'★'.repeat(testi.stars)}{'☆'.repeat(5-testi.stars)}</div>
              <p className="testi-text">"{testi.text}"</p>
              <div className="testi-author">
                <div className="testi-av">{testi.avatar}</div>
                <div>
                  <div className="testi-name">{testi.name}</div>
                  <div className="testi-role">{testi.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="cta" className="cta-section">
        <h2>Start cooking smarter<br/>today. It's free.</h2>
        <p>No credit card. No commitment. Just better meals starting tonight.</p>
        <div className="cta-form">
          <input 
            className="cta-email" 
            type="email" 
            placeholder="Enter your email..." 
          />
          <button className="cta-btn" onClick={() => setIsSignupOpen(true)}>
            Get started free →
          </button>
        </div>
        <p className="cta-note">🔒 No spam. Unsubscribe anytime. Free forever plan included.</p>
      </section>

      <Footer />

      <AnimatePresence>
        {isSignupOpen && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !signupSuccess && setIsSignupOpen(false)}
          >
            <motion.div 
              className="modal-box"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              {!signupSuccess ? (
                <>
                  <div className="modal-top">
                    <h2>Start cooking smarter 🥦</h2>
                    <button className="modal-close-btn" onClick={() => setIsSignupOpen(false)}>
                      <X size={16} />
                    </button>
                  </div>
                  <Link href="/signup" onClick={() => setIsSignupOpen(false)}>
                    <button className="modal-google">
                      <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                      Continue with Google
                    </button>
                  </Link>
                  <div className="modal-divider"><span>or</span></div>
                  <Link href="/signup" onClick={() => setIsSignupOpen(false)}>
                    <input className="modal-input" type="text" placeholder="Your name" />
                  </Link>
                  <Link href="/signup" onClick={() => setIsSignupOpen(false)}>
                    <input className="modal-input" type="email" placeholder="Email address" />
                  </Link>
                  <Link href="/signup" onClick={() => setIsSignupOpen(false)}>
                    <input className="modal-input" type="password" placeholder="Create a password (min 8 chars)" />
                  </Link>
                  <Link href="/signup" onClick={() => setIsSignupOpen(false)}>
                    <button className="modal-submit">
                      Create free account →
                    </button>
                  </Link>
                  <p className="modal-fine">By signing up you agree to our <u>Terms</u> and <u>Privacy Policy</u>. No credit card required.</p>
                </>
              ) : (
                <div className="success-state">
                  <div className="success-emoji">🎉</div>
                  <h3>Welcome to Flavour.AI!</h3>
                  <p>Your account is ready. You're about to eat better, cook smarter, and waste less food.<br/><br/><strong>Check your email</strong> for your login link!</p>
                  <button onClick={() => { setIsSignupOpen(false); setSignupSuccess(false); }} className="modal-submit" style={{marginTop:'20px'}}>
                    Let's cook! →
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Home
