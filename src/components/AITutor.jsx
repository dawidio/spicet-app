import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader,
  Wifi,
  WifiOff,
  Download,
  AlertCircle,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { getAllCharts } from '../lib/db';
import {
  chat,
  isAIAvailable,
  initWebLLM,
  getBackend,
  onStatus,
  getGeminiKey,
} from '../lib/ai';
import {
  buildChartContext,
  buildComparisonContext,
  buildSystemPrompt,
} from '../lib/ai-context';
import { buildOERContext } from '../lib/oer';

export default function AITutor({ comparison, compareCharts }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState({ stage: 'idle', message: '', progress: 0 });
  const [aiAvailable, setAiAvailable] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Check if AI is available on mount
  useEffect(() => {
    isAIAvailable().then(setAiAvailable);
  }, []);

  // Register status callback
  useEffect(() => {
    onStatus((status) => {
      setAiStatus(status);
      if (status.stage === 'ready') {
        setAiAvailable(true);
        setModelLoading(false);
      }
      if (status.stage === 'error') {
        setModelLoading(false);
      }
    });
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const handleInitWebLLM = useCallback(async () => {
    setModelLoading(true);
    await initWebLLM();
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build context from all charts + OER knowledge base
      const allCharts = await getAllCharts();
      const chartContext = buildChartContext(allCharts);
      const comparisonCtx = comparison
        ? buildComparisonContext(comparison, compareCharts || [])
        : '';
      const oerCtx = await buildOERContext(allCharts);
      const systemPrompt = buildSystemPrompt(chartContext, comparisonCtx, oerCtx);

      // Chat history (last 10 messages for context window management)
      const history = [...messages.slice(-10), userMsg];

      // Stream response
      let assistantMsg = { role: 'assistant', content: '' };
      setMessages((prev) => [...prev, assistantMsg]);

      const fullResponse = await chat(systemPrompt, history, (chunk) => {
        assistantMsg = { ...assistantMsg, content: assistantMsg.content + chunk };
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { ...assistantMsg },
        ]);
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev.filter((m) => m.content !== ''),
        {
          role: 'assistant',
          content: `⚠️ ${err.message}`,
          isError: true,
        },
      ]);
    }

    setLoading(false);
  }, [input, loading, messages, comparison, compareCharts]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    'What patterns do you see across my charts?',
    'Compare the political structures in my charts.',
    'What changes over time do my charts show?',
    'What gaps should I fill in my charts?',
    'How did trade connect these societies?',
  ];

  const backend = getBackend();

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full shadow-lg hover:bg-primary-dark transition-all hover:scale-105 flex items-center justify-center z-50"
          title="Open AI Study Tutor"
        >
          <MessageCircle size={24} className="text-white" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-0 right-0 sm:bottom-4 sm:right-4 w-full sm:w-[420px] h-[85vh] sm:h-[600px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-dark px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-white" />
              <div>
                <h3 className="font-semibold text-white text-sm">
                  AP World Study Tutor
                </h3>
                <p className="text-white/70 text-xs flex items-center gap-1">
                  {backend === 'webllm' && (
                    <>
                      <Cpu size={10} /> Local AI
                    </>
                  )}
                  {backend === 'gemini' && (
                    <>
                      <Wifi size={10} /> Gemini
                    </>
                  )}
                  {!backend && 'No AI loaded'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X size={18} className="text-white" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-primary" />
                    <span className="font-semibold text-gray-800 text-sm">
                      Study Tutor
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    I can help you analyze your SPICE-T charts using AP
                    historical thinking skills — comparison, CCOT, causation,
                    and contextualization. Ask me anything about the charts
                    you've created!
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    I only reason over entries you've already written. I won't
                    fill in charts or write essays for you.
                  </p>
                </div>

                {/* AI Setup if needed */}
                {!aiAvailable && !modelLoading && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-amber-600" />
                      <span className="font-semibold text-amber-800 text-sm">
                        Set Up AI
                      </span>
                    </div>
                    <p className="text-sm text-amber-700 mb-3">
                      Choose how to power the study tutor:
                    </p>
                    <button
                      onClick={handleInitWebLLM}
                      className="w-full mb-2 px-3 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={14} />
                      Download Local AI (~1.5 GB, one-time)
                    </button>
                    <p className="text-xs text-amber-600 text-center">
                      or add a Gemini API key in Settings
                    </p>
                  </div>
                )}

                {/* Model loading progress */}
                {modelLoading && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader size={16} className="text-primary animate-spin" />
                      <span className="font-semibold text-blue-800 text-sm">
                        Loading AI Model
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mb-2">
                      {aiStatus.message}
                    </p>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all duration-300"
                        style={{ width: `${aiStatus.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-blue-500 mt-2">
                      This is a one-time download. Grab some coffee!
                    </p>
                  </div>
                )}

                {/* Suggested questions */}
                {aiAvailable && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Try asking:
                    </p>
                    <div className="space-y-1.5">
                      {suggestedQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setInput(q);
                            setTimeout(() => inputRef.current?.focus(), 50);
                          }}
                          className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={14} className="text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : msg.isError
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.role === 'assistant' && !msg.content && loading && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={14} className="text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 px-4 py-3 shrink-0">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  aiAvailable
                    ? 'Ask about your charts...'
                    : 'Set up AI first (see above)'
                }
                disabled={!aiAvailable || loading}
                rows={1}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none disabled:bg-gray-50 disabled:text-gray-400"
                style={{ maxHeight: '80px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 80) + 'px';
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading || !aiAvailable}
                className="px-3 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {loading ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-center">
              Only analyzes your saved charts — will not write content for you
            </p>
          </div>
        </div>
      )}
    </>
  );
}
