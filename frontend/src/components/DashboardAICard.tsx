import { useState } from "react";
import {
  ArrowRight,
  Bot,
  HelpCircle,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendAIMessage } from "../services/aiService";
import { appendDashboardExchange } from "../services/chatStorageService";

interface DashboardAICardProps {
  periodLabel: string;
  narrative: string | null;
  narrativeLoading: boolean;
}

export default function DashboardAICard({
  periodLabel,
  narrative,
  narrativeLoading,
}: DashboardAICardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [lastAskedQuestion, setLastAskedQuestion] = useState<string | null>(null);
  const [askError, setAskError] = useState<string | null>(null);

  const suggestedQuestions = [
    `Who spent the most?`,
    `How much did we spend on Food?`,
    `What was our total income?`,
  ];

  async function handleAskQuestion(queryToAsk?: string) {
    const rawQuery = queryToAsk ?? question;
    const trimmed = rawQuery.trim();

    if (!trimmed || isAsking) return;

    setAskError(null);
    setIsAsking(true);
    setAnswer(null);
    setLastAskedQuestion(trimmed);
    setQuestion("");

    // Contextualized question prefix for the active dashboard period
    const contextualMessage = `[Context: Family finances for ${periodLabel}] ${trimmed}`;

    try {
      const response = await sendAIMessage([
        {
          role: "user",
          content: contextualMessage,
        },
      ]);

      setAnswer(response);
    } catch (err) {
      console.error("Dashboard AI inquiry failed:", err);
      setAskError(
        err instanceof Error
          ? err.message
          : "Unable to get an answer right now.",
      );
    } finally {
      setIsAsking(false);
    }
  }

  function handleContinueInAssistant() {
    if (!lastAskedQuestion || !answer) return;

    // Append this question and verified answer into the persisted chat store
    appendDashboardExchange(lastAskedQuestion, answer, user?.id);

    // Navigate to full AI Assistant page
    navigate("/ai-assistant");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAskQuestion();
    }
  }

  return (
    <section className="mt-4 fade-up" style={{ animationDelay: "130ms" }}>
      <div className="overflow-hidden rounded-2xl border border-[#e8e5ef] bg-white shadow-sm transition-all dark:border-[#2e265c] dark:bg-[#161130]">
        {/* Top: AI Narrative Summary */}
        <div className="flex items-start gap-3.5 px-5 py-4 sm:px-6">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2a234f] text-white dark:bg-[#352a6a]">
            {narrativeLoading ? (
              <RefreshCw size={15} className="animate-spin text-white" />
            ) : (
              <Bot size={16} className="text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#77738a] dark:text-[#a5a0ba]">
                AI monthly summary · {periodLabel}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f4e5ea] px-2.5 py-0.5 text-[11px] font-semibold text-[#2a234f] dark:bg-[#2e1d3a] dark:text-[#ffb3c3]">
                <Sparkles size={11} className="text-[#ff859d]" />
                Live Advisor
              </span>
            </div>

            {narrativeLoading ? (
              <div className="mt-2 space-y-2">
                <div className="h-3.5 w-full animate-pulse rounded-full bg-[#e8e5ef] dark:bg-[#2e265c]" />
                <div className="h-3.5 w-4/5 animate-pulse rounded-full bg-[#e8e5ef] dark:bg-[#2e265c]" />
              </div>
            ) : narrative ? (
              <p className="mt-1.5 text-sm leading-relaxed text-[#2a234f] dark:text-[#f5f3fa]">
                {narrative}
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-[#77738a] italic dark:text-[#a5a0ba]">
                Summary will appear as family activity is recorded.
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#f0edf5] dark:border-[#2e265c]" />

        {/* Bottom: Ask About My Finances (AI-6) */}
        <div className="bg-[#fcfbfe] px-5 py-4 sm:px-6 dark:bg-[#120d28]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#77738a] dark:text-[#a5a0ba]">
              <HelpCircle size={13} className="text-[#ff859d]" />
              <span>Ask about this period</span>
            </div>

            {/* Suggested quick chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isAsking}
                  onClick={() => handleAskQuestion(q)}
                  className="rounded-full border border-[#e8e5ef] bg-white px-2.5 py-1 text-xs text-[#2a234f] transition-all hover:border-[#ffb3c3] hover:bg-[#fff7f9] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#2e265c] dark:bg-[#1c1540] dark:text-[#f5f3fa] dark:hover:border-[#ffb3c3] dark:hover:bg-[#251d54]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Query Bar */}
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isAsking}
                placeholder={`Ask anything about ${periodLabel} finances...`}
                className="w-full rounded-xl border border-[#e8e5ef] bg-white py-2.5 pl-3.5 pr-10 text-sm text-[#2a234f] outline-none transition-all placeholder:text-[#9a96a8] focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#2e265c] dark:bg-[#161130] dark:text-[#f5f3fa] dark:placeholder:text-[#726b8e]"
              />

              <button
                type="button"
                onClick={() => handleAskQuestion()}
                disabled={!question.trim() || isAsking}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#2a234f] text-white transition-all hover:bg-[#1f1a3b] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-[#352a6a] dark:hover:bg-[#433585]"
                aria-label="Ask AI"
              >
                {isAsking ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
              </button>
            </div>
          </div>

          {/* Error notice if asking failed */}
          {askError && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-600 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-400">
              {askError}
            </div>
          )}

          {/* Inline Verified Answer Box */}
          {answer && (
            <div className="mt-3.5 rounded-xl border border-[#e8e5ef] bg-white p-4 shadow-sm fade-up dark:border-[#2e265c] dark:bg-[#161130]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#f4e5ea] text-[#2a234f] dark:bg-[#2e1d3a] dark:text-[#ffb3c3]">
                    <Sparkles size={13} className="text-[#ff859d]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#77738a] mb-0.5 dark:text-[#a5a0ba]">
                      "{lastAskedQuestion}"
                    </p>
                    <p className="text-sm font-medium leading-relaxed text-[#2a234f] dark:text-[#f5f3fa]">
                      {answer}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-3 flex items-center justify-end gap-2 border-t border-[#f0edf5] pt-2.5 dark:border-[#2e265c]">
                <button
                  type="button"
                  onClick={handleContinueInAssistant}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#2a234f] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#1f1a3b] active:scale-95 dark:bg-[#352a6a] dark:hover:bg-[#433585]"
                >
                  <span>Continue in AI Assistant</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
