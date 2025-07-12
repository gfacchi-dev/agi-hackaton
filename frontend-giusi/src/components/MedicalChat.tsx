import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';



const MedicalChat = () => {
  const [report, setReport] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'assistant', text: string }[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    // Fetch initial report
    fetch('http://localhost:8005/really-fake')
      .then(response => response.text())
      .then(data => setReport(data))
      .catch(error => console.error('Error fetching initial report:', error));

    // Connect to WebSocket
    ws.current = new WebSocket('ws://localhost:8005/stream-patient');
    ws.current.onopen = () => {
      console.log('connected');
      setIsConnecting(false);
      setIsConnected(true);
      // Send initial message to start the process
      ws.current?.send('start');
    };
    ws.current.onclose = () => {
      console.log('disconnected');
      setIsConnecting(false);
      setIsConnected(false);
    };
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.report) {
        setReport(data.report);
      }
      if (data.question) {
        setQuestion(data.question);
        setChatHistory(prev => [...prev, { sender: 'assistant', text: data.question }]);
      }
    };

    // Cleanup on unmount
    return () => {
      ws.current?.close();
    };
  }, []);

  const handleSendAnswer = () => {
    if (answer.trim() && ws.current?.readyState === WebSocket.OPEN) {
      setChatHistory(prev => [...prev, { sender: 'user', text: answer }]);
      ws.current.send(answer);
      setAnswer(''); // Clear input after sending
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">Conversational Pre-Chart Summary</h1>
      
      <div className="flex-1 flex space-x-4 overflow-hidden">
        {/* Report Section */}
        <div className="w-1/2 bg-white p-4 rounded-lg shadow-md flex flex-col">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Pre-Chart Report</h2>
          <div className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50 overflow-y-auto prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
          </div>
        </div>

        {/* Interaction Section */}
        <div className="w-1/2 bg-white p-4 rounded-lg shadow-md flex flex-col">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Follow-up</h2>
          <div className="flex-1 flex flex-col justify-between overflow-hidden p-2">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
              {isConnecting && <p className="text-gray-500 text-center">Connecting to server...</p>}
              {!isConnected && !isConnecting && <p className="text-red-500 text-center">Connection lost. Please refresh.</p>}
              {chatHistory.map((chat, index) => (
                <div key={index} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md p-3 rounded-lg shadow-sm ${chat.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                    <p className="text-sm">{chat.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {isConnected && (
              <div className="mt-4 flex-shrink-0">
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  placeholder="Your answer..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={!question}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAnswer();
                    }
                  }}
                />
                <button
                  onClick={handleSendAnswer}
                  className="mt-2 w-full bg-indigo-600 text-white font-medium py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={!question || !answer.trim()}
                >
                  Send Answer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalChat;
