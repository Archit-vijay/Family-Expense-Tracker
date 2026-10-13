import {
  Bot,
  Loader2,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import {
  useRef,
  useState,
} from "react";

import {
  sendAIMessage,
  type AIChatMessage,
} from "../services/aiService";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

function AIAssistant() {
  const [messages, setMessages] =
    useState<ChatMessage[]>([
      {
        id: 1,
        role: "assistant",
        content:
          "Hi! I'm your Family Finance AI assistant. Ask me about your family's spending, income, transactions, or spending trends.",
      },
    ]);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] =
    useState(false);
  const [error, setError] = useState("");

  const nextMessageId = useRef(2);

  async function handleSendMessage() {
    const message = input.trim();

    if (!message || isSending) {
      return;
    }

    setError("");
    setInput("");

    const userMessage: ChatMessage = {
      id: nextMessageId.current++,
      role: "user",
      content: message,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    try {
      setIsSending(true);

      const conversation: AIChatMessage[] =
        [...messages, userMessage].map(
          (chatMessage) => ({
            role: chatMessage.role,
            content: chatMessage.content,
          }),
        );

      const response =
        await sendAIMessage(conversation);

      const assistantMessage: ChatMessage = {
        id: nextMessageId.current++,
        role: "assistant",
        content: response,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (error) {
      console.error(
        "Failed to send AI message:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to get a response from the AI assistant.",
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSendMessage();
    }
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <section className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ffb3c3]/30 text-[#2a234f]">
            <Sparkles size={21} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#77738a]">
              AI Assistant
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#2a234f] sm:text-4xl">
              Ask about your finances
            </h1>
          </div>
        </div>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#77738a] sm:text-base">
          Ask questions about your family's
          spending, income, transactions, and
          financial trends.
        </p>
      </section>

      {/* Chat container */}
      <section className="flex min-h-[600px] flex-col overflow-hidden rounded-2xl border border-[#e8e5ef] bg-white shadow-sm">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-[#e8e5ef] px-5 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a234f] text-white">
            <Bot size={19} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-[#2a234f]">
              Family Finance AI
            </h2>

            <p className="text-xs text-[#77738a]">
              Connected to your family's financial data
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {message.role ===
                "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4e5ea] text-[#2a234f]">
                  <Bot size={16} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[70%] ${
                  message.role === "user"
                    ? "rounded-br-md bg-[#2a234f] text-white"
                    : "rounded-bl-md bg-[#f8f7fb] text-[#2a234f]"
                }`}
              >
                <p className="whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>

              {message.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ffb3c3] text-[#2a234f]">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4e5ea] text-[#2a234f]">
                <Bot size={16} />
              </div>

              <div className="rounded-2xl rounded-bl-md bg-[#f8f7fb] px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-[#77738a]">
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                  Thinking...
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {error}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[#e8e5ef] p-4 sm:p-5">
          <div className="flex items-end gap-3 rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] p-2 transition-all focus-within:border-[#ffb3c3] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#ffb3c3]/20">
            <textarea
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Ask about your finances..."
              rows={1}
              disabled={isSending}
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-[#2a234f] outline-none placeholder:text-[#9a96a8] disabled:cursor-not-allowed disabled:opacity-60"
            />

            <button
              type="button"
              onClick={handleSendMessage}
              disabled={
                !input.trim() || isSending
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2a234f] text-white transition-all duration-200 hover:bg-[#1f1a3b] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              {isSending ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Send size={17} />
              )}
            </button>
          </div>

          <p className="mt-2 text-center text-[11px] text-[#9a96a8]">
            Press Enter to send · Shift + Enter
            for a new line
          </p>
        </div>
      </section>
    </div>
  );
}

export default AIAssistant;