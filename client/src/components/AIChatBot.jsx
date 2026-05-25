import { useState, useRef, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sparkles, X, Send, User, Bot, HelpCircle, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const AIChatBot = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Initialize welcome message based on role
  useEffect(() => {
    if (user) {
      const savedMessages = localStorage.getItem(`chat_history_${user.id}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        const welcomeText = user.role === 'admin'
          ? `Welcome to operations control, ${user.name}! I am your **SmartStore AI Operations Consultant**.\n\nI am connected to your live database. Ask me to:\n*   Analyze overall sales trends or low stock warnings\n*   Perform pricing optimization checks\n*   Examine monthly revenue dynamics`
          : `Hello, ${user.name}! Welcome to SmartStore! 🛍️ I am your **AI Shopping Copilot**.\n\nI can help you browse our premium catalog, find active discount rates, recommend products, or check stock availability.\n\nWhat high-fidelity gear are you looking to add to your collection today?`;
        
        setMessages([
          { sender: 'bot', text: welcomeText, timestamp: new Date() }
        ]);
      }
    }
  }, [user]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  if (!user) return null;

  const handleSend = async (textToSend) => {
    const activeText = textToSend || message;
    if (!activeText.trim()) return;

    if (!textToSend) setMessage('');

    // Append user message
    const updatedMessages = [
      ...messages,
      { sender: 'user', text: activeText, timestamp: new Date() }
    ];
    setMessages(updatedMessages);
    localStorage.setItem(`chat_history_${user.id}`, JSON.stringify(updatedMessages));
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: activeText });
      
      const botReply = {
        sender: 'bot',
        text: response.data.response || response.data.description,
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, botReply];
      setMessages(finalMessages);
      localStorage.setItem(`chat_history_${user.id}`, JSON.stringify(finalMessages));
    } catch (error) {
      console.error('AI chat failed:', error);
      const errorReply = {
        sender: 'bot',
        text: 'Apologies, I encountered a connection issue while querying the backend. Please try again shortly.',
        timestamp: new Date()
      };
      setMessages([...updatedMessages, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const clearChat = () => {
    localStorage.removeItem(`chat_history_${user.id}`);
    const welcomeText = user.role === 'admin'
      ? `Welcome to operations control, ${user.name}! I am your **SmartStore AI Operations Consultant**.\n\nAsk me to:\n*   Analyze overall sales trends or low stock warnings\n*   Perform pricing optimization checks\n*   Examine monthly revenue dynamics`
      : `Hello, ${user.name}! Welcome to SmartStore! 🛍️ I am your **AI Shopping Copilot**.\n\nI can help you browse our premium catalog, find active discount rates, recommend products, or check stock availability.`;
    
    setMessages([
      { sender: 'bot', text: welcomeText, timestamp: new Date() }
    ]);
  };

  // Suggestion bubbles based on role
  const suggestions = user.role === 'admin'
    ? [
        { label: 'Stock Alerts', query: 'Which products are running low on stock?' },
        { label: 'Sales Metrics', query: 'What is our current total revenue and order count?' },
        { label: 'Pricing advice', query: 'How can I optimize product prices?' }
      ]
    : [
        { label: 'Recommend tech', query: 'Recommend some premium electronic products' },
        { label: 'Active discounts', query: 'What active product discounts are available today?' },
        { label: 'Headphones price', query: 'What is the price of Wireless Headphones after discount?' }
      ];

  // Helper to parse basic markdown inside the bubble
  const renderMessageText = (text) => {
    // Escape and highlight markdown tags (bolding, bullet points, headers)
    const lines = text.split('\n');
    return lines.map((line, i) => {
      let content = line;
      
      // Headers (e.g. ### Title)
      if (content.startsWith('### ')) {
        return <h4 key={i} className="text-sm font-extrabold text-blue-400 mt-3 mb-1 uppercase tracking-wider">{content.slice(4)}</h4>;
      }
      if (content.startsWith('## ')) {
        return <h3 key={i} className="text-base font-extrabold text-blue-400 mt-4 mb-2 uppercase tracking-wide">{content.slice(3)}</h3>;
      }

      // Bullet points
      const isBullet = content.startsWith('* ') || content.startsWith('• ') || content.startsWith('- ');
      if (isBullet) {
        content = content.slice(2);
      }

      // Bold tags (**text**)
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-extrabold text-white">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      const formattedLine = parts.length > 0 ? parts : content;

      if (isBullet) {
        return (
          <li key={i} className="ml-4 list-disc text-sm text-gray-300 py-0.5 leading-relaxed">
            {formattedLine}
          </li>
        );
      }

      return <p key={i} className="text-sm text-gray-300 py-0.5 leading-relaxed">{formattedLine}</p>;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      
      {/* Expanded Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="w-[92vw] sm:w-[420px] h-[550px] rounded-2xl border border-white/20 bg-slate-900/95 text-white shadow-2xl backdrop-blur-xl flex flex-col mb-4 overflow-hidden"
          >
            {/* Header */}
            <div className={`p-4 bg-gradient-to-r ${
              user.role === 'admin' ? 'from-blue-900/60 to-slate-900/80' : 'from-purple-900/60 to-slate-900/80'
            } border-b border-white/10 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${
                  user.role === 'admin' ? 'from-blue-600 to-cyan-500 shadow-blue-500/20' : 'from-purple-600 to-pink-500 shadow-purple-500/20'
                } flex items-center justify-center shadow-lg`}>
                  {user.role === 'admin' ? <Bot className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">
                    {user.role === 'admin' ? 'SmartStore AI Consultant' : 'SmartStore AI Copilot'}
                  </h4>
                  <span className="text-[10px] text-green-400 font-bold flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span> Live Database Connected
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={clearChat}
                  title="Clear chat history"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 text-xs font-semibold"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Bubble Avatar */}
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border text-xs font-bold ${
                      msg.sender === 'user'
                        ? 'bg-slate-800 border-white/10 text-blue-400'
                        : user.role === 'admin'
                        ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                        : 'bg-purple-600/10 border-purple-500/30 text-purple-400'
                    }`}>
                      {msg.sender === 'user' ? <User size={14} /> : msg.sender === 'bot' && user.role === 'admin' ? <Bot size={14} /> : <Sparkles size={14} />}
                    </div>

                    {/* Bubble Content */}
                    <div className={`rounded-2xl p-3 shadow-md border ${
                      msg.sender === 'user'
                        ? 'bg-blue-600/20 border-blue-500/30 text-white rounded-tr-none'
                        : 'bg-white/5 border-white/10 text-gray-200 rounded-tl-none'
                    }`}>
                      <div className="space-y-0.5">{renderMessageText(msg.text)}</div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Loader */}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 items-center">
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border ${
                      user.role === 'admin' ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 'bg-purple-600/10 border-purple-500/30 text-purple-400'
                    }`}>
                      {user.role === 'admin' ? <Bot size={14} /> : <Sparkles size={14} />}
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 shadow-md">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length < 3 && !loading && (
              <div className="px-4 py-2 border-t border-white/5 bg-slate-950/40 space-y-1.5">
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  <HelpCircle size={10} /> Quick Inquiries
                </div>
                <div className="flex flex-wrap gap-2 pb-1">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(s.query)}
                      className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white px-2.5 py-1 rounded-lg transition-all text-left flex items-center gap-1"
                    >
                      {s.label} <ArrowRight size={10} className="text-gray-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-white/10 bg-slate-950/60 flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={user.role === 'admin' ? "Ask about sales, stock replenishment..." : "Ask for recommendations, active discounts..."}
                disabled={loading}
                className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500 focus:bg-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-all"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !message.trim()}
                className={`p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center ${
                  loading || !message.trim()
                    ? 'bg-slate-800 text-gray-600 cursor-not-allowed'
                    : user.role === 'admin'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/10'
                }`}
              >
                <Send size={16} />
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Bubble */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 relative ${
          user.role === 'admin'
            ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-blue-500/30'
            : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 shadow-purple-500/30'
        }`}
      >
        {/* Glow pulsing aura */}
        <span className={`absolute inset-0 rounded-full animate-ping pointer-events-none opacity-20 ${
          user.role === 'admin' ? 'bg-blue-500' : 'bg-purple-500'
        }`} style={{ animationDuration: '3s' }} />

        {isOpen ? (
          <X size={22} className="stroke-[2.5]" />
        ) : user.role === 'admin' ? (
          <Bot size={22} className="stroke-[2]" />
        ) : (
          <Sparkles size={22} className="stroke-[2]" />
        )}
      </motion.button>

    </div>
  );
};

export default AIChatBot;
