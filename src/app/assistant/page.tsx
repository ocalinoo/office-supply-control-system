"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  data?: any;
  intent?: string;
}

export default function AssistantPage() {
  const { token } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simple markdown parser untuk formatting
  const parseContent = (content: string) => {
    // Split by newlines to handle line-by-line
    const lines = content.split("\n");
    
    return lines.map((line, lineIndex) => {
      let processedLine: any = line;
      
      // Bold: **text**
      const boldParts = processedLine.split(/(\*\*.*?\*\*)/g);
      if (boldParts.length > 1) {
        processedLine = boldParts.map((part: string, partIndex: number) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={`${lineIndex}-${partIndex}`} className="font-semibold">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
      }
      
      // Code: `text`
      if (typeof processedLine === "string") {
        const codeParts = processedLine.split(/(`.*?`)/g);
        if (codeParts.length > 1) {
          processedLine = codeParts.map((part: string, partIndex: number) => {
            if (part.startsWith("`") && part.endsWith("`")) {
              return (
                <code key={`${lineIndex}-${partIndex}`} className="bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-sm font-mono">
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          });
        }
      }
      
      // Empty lines become line breaks
      if (line.trim() === "") {
        return <br key={lineIndex} />;
      }
      
      return <span key={lineIndex}>{processedLine}</span>;
    });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          question: input,
          conversationHistory: messages.slice(-5), // Send last 5 messages for context
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.answer,
          timestamp: new Date(),
          data: data.data,
          intent: data.intent,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "⚠️ Maaf, terjadi kesalahan. Silakan coba lagi.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "⚠️ Maaf, terjadi kesalahan koneksi.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { icon: "📦", label: "Total Barang", query: "Berapa total barang?" },
    { icon: "⚠️", label: "Stock Rendah", query: "Barang dengan stock rendah" },
    { icon: "📂", label: "Kategori", query: "Tampilkan kategori" },
    { icon: "📊", label: "Statistik", query: "Statistik inventory" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            AI Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Asisten pintar untuk membantu mengelola inventaris Anda
          </p>
        </div>

        {/* Chat Container */}
        <div className="card h-[60vh] md:h-[650px] flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Halo! Saya AI Assistant OSCS 👋
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Saya bisa membantu Anda mengelola inventaris dengan lebih mudah. 
                    Tanya saya apapun tentang stock, kategori, atau laporan!
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {quickActions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => setInput(action.query)}
                        className="px-2 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 transition-all text-xs sm:text-sm text-left"
                      >
                        <span className="text-lg sm:text-xl mb-1 block">{action.icon}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-primary-500 to-primary-700"
                          : "bg-gradient-to-br from-green-500 to-green-700"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl ${
                        message.role === "user"
                          ? "bg-primary-600 text-white"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <div className={`text-sm ${message.role === "user" ? "" : "text-gray-900 dark:text-gray-100"}`}>
                        {parseContent(message.content)}
                      </div>
                      
                      {/* Data display for structured info */}
                      {message.data && message.intent === "low_stock" && message.data.items && (
                        <div className="mt-3 space-y-2">
                          {message.data.items.slice(0, 5).map((item: any, idx: number) => (
                            <div key={idx} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
                              <div className="font-medium text-red-800 dark:text-red-300">{item.name}</div>
                              <div className="text-red-600 dark:text-red-400 text-xs">
                                Stock: {item.quantity} / Min: {item.minStock}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div
                        className={`text-xs mt-2 ${
                          message.role === "user"
                            ? "text-white/70"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tanya tentang inventory, stock, kategori..."
                className="flex-1 input-field"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Kirim</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              💡 Coba: "Total barang", "Stock rendah", "Kategori", atau "Cari kertas"
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
