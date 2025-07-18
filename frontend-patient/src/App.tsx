import React, { useState, useRef, useEffect, FormEvent, ChangeEvent, MouseEvent } from 'react'
import './App.css'

type Message =
  | { sender: string; text: string; image?: undefined }
  | { sender: string; image: string; text?: undefined }

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: 'Hello! How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [isBotTyping, setIsBotTyping] = useState(false)
  const [showPromptBar, setShowPromptBar] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // WebSocket state
  const ws = useRef<WebSocket | null>(null)
  const [isConnecting, setIsConnecting] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Connect to WebSocket
    ws.current = new WebSocket('ws://localhost:8006/stream-patient')
    ws.current.onopen = () => {
      setIsConnecting(false)
      setIsConnected(true)
      ws.current?.send('start')
    }
    ws.current.onclose = () => {
      setIsConnecting(false)
      setIsConnected(false)
    }
    ws.current.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        if (data.question) {
          setMessages((msgs: Message[]) => [...msgs, { sender: 'bot', text: data.question }])
          setIsBotTyping(false)
        }
        // Optionally handle other fields like 'report' if needed
      } catch (e) {
        // fallback: treat as plain text
        setMessages((msgs: Message[]) => [...msgs, { sender: 'bot', text: event.data }])
        setIsBotTyping(false)
      }
    }
    return () => {
      ws.current?.close()
    }
  }, [])

  const handleSend = (e?: FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return
    setMessages([...messages, { sender: 'user', text: input }])
    ws.current.send(input)
    setInput('')
    setIsBotTyping(true)
  }

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setMessages([...messages, { sender: 'user', image: ev.target?.result as string }])
      }
      reader.readAsDataURL(file)
      setInput('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a183d] via-[#142850] to-[#27496d] text-white font-sans relative animate-fadeIn">
      {/* Header */}
      <header className="w-full flex justify-between items-center py-8 mb-2 animate-fadeInDown px-8 relative z-20 sticky top-0 bg-transparent">
        <div className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            fill="none"
            className="w-12 h-12 cursor-pointer"
            onClick={() => window.location.reload()}
            style={{ transition: 'transform 0.2s' }}
            onMouseDown={(e: MouseEvent<SVGSVGElement>) => (e.currentTarget.style.transform = 'scale(0.93)')}
            onMouseUp={(e: MouseEvent<SVGSVGElement>) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e: MouseEvent<SVGSVGElement>) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <circle cx="32" cy="32" r="32" fill="#142850"/>
            <ellipse cx="32" cy="38" rx="16" ry="10" fill="#fff" fillOpacity="0.9"/>
            <ellipse cx="32" cy="28" rx="10" ry="10" fill="#fff"/>
            <ellipse cx="32" cy="28" rx="6" ry="6" fill="#27496d"/>
            <rect x="28" y="24" width="8" height="2" rx="1" fill="#fff"/>
            <rect x="30" y="30" width="4" height="2" rx="1" fill="#fff"/>
          </svg>
          <span
            className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent drop-shadow-lg select-none cursor-pointer"
            onClick={() => window.location.reload()}
            style={{ transition: 'transform 0.2s' }}
            onMouseDown={(e: MouseEvent<HTMLSpanElement>) => (e.currentTarget.style.transform = 'scale(0.93)')}
            onMouseUp={(e: MouseEvent<HTMLSpanElement>) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e: MouseEvent<HTMLSpanElement>) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            MedMind
          </span>
        </div>
        <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition hover:scale-105">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#27496d" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75z" />
          </svg>
        </button>
      </header>
      {/* Welcome message */}
      <div className="w-full flex justify-center animate-fadeIn mb-4">
        <span className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">Welcome back, Patrick!</span>
      </div>
      {/* Starter buttons or chat */}
      {!showPromptBar ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-row gap-6">
              <button
                className="px-10 py-5 rounded-full bg-[#1a2947] text-white text-xl shadow-xl hover:bg-white hover:text-[#142850] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-200 border border-[#27496d] hover:scale-110 font-medium animate-fadeInBlue"
                onClick={e => {
                  const parent = (e.currentTarget.closest('.flex.flex-col.items-center.gap-6') as HTMLElement);
                  if (parent) {
                    parent.classList.add('animate-buttonExitFast');
                    setTimeout(() => {
                      setShowPromptBar(true);
                      setMessages([...messages, { sender: 'user', text: 'I want to contact my doctor.' }]);
                      setIsBotTyping(true);
                      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                        ws.current.send('FAKE');
                      }
                    }, 300);
                  } else {
                    setShowPromptBar(true);
                    setMessages([...messages, { sender: 'user', text: 'I want to contact my doctor.' }]);
                    setIsBotTyping(true);
                    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                      ws.current.send('FAKE');
                    }
                  }
                }}
              >
                Contact doctor
              </button>
              <button
                className="px-10 py-5 rounded-full bg-[#1a2947] text-white text-xl shadow-xl hover:bg-white hover:text-[#142850] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-200 border border-[#27496d] hover:scale-110 font-medium animate-fadeInBlue"
                onClick={e => {
                  const parent = (e.currentTarget.closest('.flex.flex-col.items-center.gap-6') as HTMLElement);
                  if (parent) {
                    parent.classList.add('animate-buttonExitFast');
                    setTimeout(() => {
                      setShowPromptBar(true);
                      setMessages([...messages, { sender: 'user', text: 'I want to view my lab results.' }]);
                      setIsBotTyping(true);
                      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                        ws.current.send('FAKE');
                      }
                    }, 300);
                  } else {
                    setShowPromptBar(true);
                    setMessages([...messages, { sender: 'user', text: 'I want to view my lab results.' }]);
                    setIsBotTyping(true);
                    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                      ws.current.send('FAKE');
                    }
                  }
                }}
              >
                View results
              </button>
            </div>
            <button
              className="px-10 py-5 rounded-full bg-[#1a2947] text-white text-xl shadow-xl hover:bg-white hover:text-[#142850] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-200 border border-[#27496d] hover:scale-110 font-medium animate-fadeInBlue"
              onClick={e => {
                const parent = (e.currentTarget.closest('.flex.flex-col.items-center.gap-6') as HTMLElement);
                if (parent) {
                  parent.classList.add('animate-buttonExitFast');
                  setTimeout(() => {
                    setShowPromptBar(true);
                    setMessages([...messages, { sender: 'user', text: 'I want to refill my prescriptions.' }]);
                    setIsBotTyping(true);
                    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                      ws.current.send('FAKE');
                    }
                  }, 300);
                } else {
                  setShowPromptBar(true);
                  setMessages([...messages, { sender: 'user', text: 'I want to refill my prescriptions.' }]);
                  setIsBotTyping(true);
                  if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    ws.current.send('FAKE');
                  }
                }
              }}
            >
              Refill prescriptions
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 flex justify-center items-start overflow-y-auto px-4 pt-8 pb-44">
            <div className="w-full max-w-2xl space-y-4" style={{ scrollbarColor: '#222 #0a183d' }}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} transition-transform duration-300 hover:scale-105 cursor-pointer`}
                >
                  {msg.image ? (
                    <img
                      src={msg.image}
                      alt="User upload"
                      className="max-w-[70%] rounded-2xl shadow-xl border-2 border-white transition-transform duration-300 hover:scale-105 hover:border-blue-300 hover:shadow-2xl"
                      style={{ maxHeight: 240, objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className={`max-w-[70%] px-5 py-3 rounded-3xl shadow-xl text-base break-words ${msg.sender === 'user' ? 'bg-white text-[#142850]' : 'bg-[#1a2947] text-white'} transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-opacity-90`}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              ))}
              {isBotTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] px-5 py-3 rounded-3xl shadow-xl text-base break-words bg-[#1a2947] text-white flex items-center gap-2 animate-fadeIn">
                    <span className="inline-block w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="inline-block w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="inline-block w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                    <span className="ml-2 text-sm text-gray-300">MedMind is typing...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
          {/* Floating prompt bar */}
          <form onSubmit={handleSend} className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-xl flex items-center gap-2 px-4 z-10 animate-fadeInUp pointer-events-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center bg-[#1a2947] hover:bg-[#22335a] text-white rounded-full p-3 shadow-lg border border-[#27496d] focus:outline-none focus:ring-2 focus:ring-white transition-all duration-300 hover:scale-110 hover:border-white"
              aria-label="Add photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V7.5A2.25 2.25 0 015.25 5.25h2.086a2.25 2.25 0 011.591.659l.828.828a2.25 2.25 0 001.591.659h2.086A2.25 2.25 0 0118.75 7.5v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5z" />
                <circle cx="12" cy="13" r="3.25" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageSelect}
            />
            <input
              className="flex-1 rounded-full bg-[#1a2947] text-white px-6 py-4 outline-none border border-[#27496d] focus:border-white transition-all duration-300 placeholder-gray-300 shadow-lg backdrop-blur-md hover:shadow-2xl hover:border-white"
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' && !e.shiftKey) handleSend() }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className={`font-bold py-4 px-8 rounded-full transition-all duration-300 shadow-lg hover:scale-105 hover:shadow-2xl focus:outline-none ${input.trim() ? 'bg-white hover:bg-gray-200 text-[#142850] cursor-pointer' : 'bg-[#22335a] text-gray-400 cursor-not-allowed'}`}
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default App

/* Add to App.css or index.css:
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fadeIn {
  animation: fadeIn 2.8s cubic-bezier(0.4,0,0.2,1);
}
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-40px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeInDown {
  animation: fadeInDown 2.2s cubic-bezier(0.4,0,0.2,1);
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeInUp {
  animation: fadeInUp 2.2s cubic-bezier(0.4,0,0.2,1);
}
@keyframes buttonExit {
  0% { opacity: 1; transform: scale(1) translateY(0); }
  60% { opacity: 0.7; transform: scale(0.97) translateY(10px); }
  100% { opacity: 0; transform: scale(0.9) translateY(60px); pointer-events: none; }
}
.animate-buttonExit {
  animation: buttonExit 0.7s cubic-bezier(0.4,0,0.2,1) forwards;
}
@keyframes buttonExitFast {
  0% { opacity: 1; transform: scale(1) translateY(0); }
  100% { opacity: 0; transform: scale(0.9) translateY(60px); pointer-events: none; }
}
.animate-buttonExitFast {
  animation: buttonExitFast 0.3s cubic-bezier(0.4,0,0.2,1) forwards;
}
// For slow fade in, keep .animate-fadeInBlue as:
@keyframes fadeInBlue {
  0% { opacity: 0; transform: scale(0.95); background: #000; }
  60% { opacity: 1; background: #1a2947; }
  100% { opacity: 1; transform: scale(1); background: #1a2947; }
}
.animate-fadeInBlue {
  animation: fadeInBlue 1.2s cubic-bezier(0.4,0,0.2,1);
}
*/
