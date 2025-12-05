import React, { useState, useRef, useEffect } from 'react';
import { GestureType, GestureState, ChatMessage } from '../types';
import { generateSaturnResponse } from '../services/geminiService';
import { Send, Hand, MousePointer2, Maximize, Rotate3d, Info } from 'lucide-react';

interface InterfaceProps {
  gestureState: GestureState;
}

const Interface: React.FC<InterfaceProps> = ({ gestureState }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Welcome, Explorer. Ask me anything about Saturn.', timestamp: Date.now() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: inputText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    const aiText = await generateSaturnResponse(inputText);
    
    setMessages(prev => [...prev, { role: 'model', text: aiText, timestamp: Date.now() }]);
    setIsLoading(false);
  };

  const getGestureIcon = () => {
    switch(gestureState.type) {
      case GestureType.ROTATE: return <Rotate3d className="text-yellow-400 animate-pulse" />;
      case GestureType.ZOOM: return <Maximize className="text-green-400 animate-pulse" />;
      case GestureType.IDLE: return <Hand className="text-cyan-400" />;
      default: return <MousePointer2 className="text-gray-500" />;
    }
  };

  const getGestureText = () => {
    switch(gestureState.type) {
      case GestureType.ROTATE: return "ROTATING (Fist + Move)";
      case GestureType.ZOOM: return "ZOOMING (Pinch + Up/Down)";
      case GestureType.IDLE: return "HAND DETECTED";
      default: return "NO HAND DETECTED";
    }
  };

  return (
    <>
      {/* Top Left Title */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none select-none">
        <h1 className="text-4xl text-cyan-50 font-sci-fi tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
          SATURN
        </h1>
        <p className="text-cyan-400/80 text-sm font-mono mt-1 tracking-widest">
          PARTICLE SIMULATION // S-01
        </p>
      </div>

      {/* Gesture Status Indicator - Top Center */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className={`flex items-center gap-3 px-6 py-2 rounded-full border backdrop-blur-md transition-all duration-300 ${
          gestureState.isHandDetected ? 'bg-black/40 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-black/20 border-white/10'
        }`}>
          {getGestureIcon()}
          <span className={`font-mono text-sm font-bold ${gestureState.isHandDetected ? 'text-cyan-100' : 'text-gray-500'}`}>
            {getGestureText()}
          </span>
        </div>
      </div>

      {/* Instructions - Top Right */}
      <div className="absolute top-6 right-6 z-10 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-lg text-xs font-mono text-gray-300 space-y-2 max-w-[200px]">
             <div className="flex items-center gap-2 text-cyan-400 font-bold border-b border-white/10 pb-1 mb-2">
                <Info size={14} /> CONTROLS
             </div>
             <p><span className="text-yellow-400 font-bold">FIST</span> + Move: Rotate</p>
             <p><span className="text-green-400 font-bold">PINCH</span> + Up/Down: Zoom</p>
             <p className="text-gray-500 italic pt-1">Require Camera Permission</p>
          </div>
      </div>

      {/* Chat Interface - Bottom Right */}
      <div className="absolute bottom-6 right-6 z-20 w-80 md:w-96 flex flex-col gap-2">
        <div className="bg-black/60 backdrop-blur-lg border border-cyan-900/50 rounded-lg overflow-hidden flex flex-col h-80 shadow-2xl">
          {/* Header */}
          <div className="bg-cyan-950/30 p-3 border-b border-cyan-900/30 flex justify-between items-center">
            <span className="text-cyan-400 font-sci-fi text-xs tracking-wider">AI DATABASE</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg border ${
                  msg.role === 'user' 
                    ? 'bg-cyan-900/20 border-cyan-700/50 text-cyan-100 rounded-br-none' 
                    : 'bg-black/40 border-gray-700/50 text-gray-300 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-black/40 border border-gray-700/50 p-3 rounded-lg text-cyan-400 text-xs animate-pulse">
                    Processing query...
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-black/80 border-t border-cyan-900/30 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Query the database..."
              className="flex-1 bg-transparent border border-gray-700 rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-600 font-mono"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading}
              className="p-2 bg-cyan-900/50 hover:bg-cyan-700/50 border border-cyan-700 rounded text-cyan-400 transition-colors disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Interface;
