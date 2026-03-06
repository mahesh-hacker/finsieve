/**
 * InvestBot — AI investment assistant for Indian markets.
 * Floating chat widget embedded in MainLayout.
 * Backend proxy: POST /api/v1/chatbot/message
 */
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Fab,
  Paper,
  Chip,
  CircularProgress,
  useTheme,
  alpha,
  Tooltip,
} from "@mui/material";
import {
  SmartToy,
  Close,
  Send,
  Psychology,
  RestartAlt,
} from "@mui/icons-material";
import apiService from "../../services/common/apiService";

// ── Types ────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatResponse {
  success: boolean;
  message: string;
}

// ── Markdown renderer ────────────────────────────────────────────
const renderInline = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
};

const MarkdownBlock = ({ content }: { content: string }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const blocks = content.split(/\n{2,}/);

  return (
    <Box sx={{ "& table": { width: "100%", borderCollapse: "collapse", fontSize: 12, my: 1 }, "& th, & td": { border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, px: 1.5, py: 0.75, textAlign: "left" }, "& th": { background: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)", fontWeight: 700, color: "#6366f1" } }}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter(Boolean);
        if (!lines.length) return null;

        // Table
        if (lines[0].startsWith("|")) {
          const rows = lines.filter(l => l.includes("|") && !l.match(/^\|[-\s|]+\|$/));
          const headers = rows[0]?.split("|").filter(Boolean).map(h => h.trim()) ?? [];
          const body = rows.slice(1);
          return (
            <Box key={bi} sx={{ overflowX: "auto", my: 1 }}>
              <table>
                <thead>
                  <tr>{headers.map((h, i) => <th key={i}>{renderInline(h)}</th>)}</tr>
                </thead>
                <tbody>
                  {body.map((row, ri) => (
                    <tr key={ri}>
                      {row.split("|").filter(Boolean).map((cell, ci) => (
                        <td key={ci}>{renderInline(cell.trim())}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          );
        }

        // Heading
        if (lines[0].startsWith("#")) {
          const lvl = (lines[0].match(/^#+/) || [""])[0].length;
          const txt = lines[0].replace(/^#+\s*/, "");
          return (
            <Typography key={bi} fontWeight={700} sx={{ fontSize: lvl === 1 ? 15 : 14, mb: 0.5, mt: 1, color: "#6366f1" }}>
              {renderInline(txt)}
            </Typography>
          );
        }

        // Bullet list
        if (lines.every(l => l.match(/^[-*•]\s/))) {
          return (
            <Box key={bi} component="ul" sx={{ pl: 2.5, my: 0.5, "& li": { mb: 0.4 } }}>
              {lines.map((l, li) => (
                <li key={li}>
                  <Typography variant="body2" component="span" sx={{ fontSize: 13, lineHeight: 1.6 }}>
                    {renderInline(l.replace(/^[-*•]\s/, ""))}
                  </Typography>
                </li>
              ))}
            </Box>
          );
        }

        // Disclaimer (bold lines that start **)
        if (block.startsWith("**") && block.endsWith("**")) {
          return (
            <Box
              key={bi}
              sx={{
                mt: 1.5, p: 1.5,
                borderRadius: 1.5,
                background: isDark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)",
                border: `1px solid ${alpha("#f59e0b", 0.25)}`,
                fontSize: 11,
                color: isDark ? "#fcd34d" : "#92400e",
                lineHeight: 1.6,
              }}
            >
              {block.slice(2, -2)}
            </Box>
          );
        }

        // Regular paragraph
        return (
          <Typography key={bi} variant="body2" sx={{ fontSize: 13, lineHeight: 1.7, mb: 0.5 }}>
            {lines.map((line, li) => (
              <span key={li}>{renderInline(line)}{li < lines.length - 1 ? <br /> : null}</span>
            ))}
          </Typography>
        );
      })}
    </Box>
  );
};

// ── Typing indicator ─────────────────────────────────────────────
const TypingDots = () => (
  <Box sx={{ display: "flex", gap: 0.6, alignItems: "center", py: 0.5 }}>
    {[0, 1, 2].map(i => (
      <Box
        key={i}
        sx={{
          width: 6, height: 6, borderRadius: "50%",
          bgcolor: "#6366f1",
          animation: "typingBounce 1.2s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`,
          "@keyframes typingBounce": {
            "0%, 80%, 100%": { transform: "scale(0.7)", opacity: 0.4 },
            "40%": { transform: "scale(1.1)", opacity: 1 },
          },
        }}
      />
    ))}
  </Box>
);

// ── Quick suggestions ────────────────────────────────────────────
const SUGGESTIONS = [
  "₹50,000 · 2 years · 12% · medium risk",
  "₹1 lakh SIP options · 5 years · aggressive",
  "Safe bonds for ₹2L · low risk · 1 year",
  "Gold vs equity · ₹25k · medium · 3 years",
];

// ── Main InvestBot Component ─────────────────────────────────────
const InvestBot = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm **InvestBot**, your AI investment research assistant for Indian markets.\n\nTell me your **amount, time horizon, target return, and risk tolerance** and I'll suggest the best options across Stocks, Mutual Funds, Bonds, and Commodities.\n\n*Example: ₹50,000 · 1 year · 10% return · medium risk*",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, messages]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Build conversation history for context (last 10 messages, skip welcome)
    const history = messages
      .filter(m => m.id !== "welcome")
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await apiService.post<ChatResponse>("/chatbot/message", {
        message: trimmed,
        history,
      });

      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: res.message || "Sorry, I couldn't process that. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const handleReset = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Chat cleared! Tell me your investment goals and I'll suggest the best options for you.",
      timestamp: new Date(),
    }]);
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* ── Floating Button ── */}
      {!open && (
        <Tooltip title="InvestBot - AI Investment Assistant" placement="left">
          <Fab
            onClick={() => setOpen(true)}
            sx={{
              position: "fixed",
              bottom: { xs: 16, sm: 24 },
              right: { xs: 16, sm: 24 },
              zIndex: 1300,
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "#fff",
              width: 56, height: 56,
              boxShadow: "0 8px 32px rgba(99,102,241,0.45)",
              "&:hover": {
                background: "linear-gradient(135deg, #4f46e5, #4338ca)",
                boxShadow: "0 12px 40px rgba(99,102,241,0.55)",
                transform: "scale(1.05)",
              },
              transition: "all 0.25s ease",
            }}
          >
            <Psychology sx={{ fontSize: 26 }} />
          </Fab>
        </Tooltip>
      )}

      {/* ── Chat Panel ── */}
      {open && (
        <Paper
          elevation={0}
          sx={{
            position: "fixed",
            bottom: { xs: 0, sm: 24 },
            right: { xs: 0, sm: 24 },
            zIndex: 1300,
            width: { xs: "100vw", sm: 400 },
            height: { xs: "100dvh", sm: 580 },
            borderRadius: { xs: 0, sm: 4 },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: isDark ? "#0f1420" : "#ffffff",
            border: `1px solid ${isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.15)"}`,
            boxShadow: "0 32px 80px rgba(99,102,241,0.25), 0 8px 32px rgba(0,0,0,0.15)",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 2.5, py: 1.75,
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              display: "flex", alignItems: "center", gap: 1.5,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 36, height: 36, borderRadius: 2,
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <SmartToy sx={{ fontSize: 20, color: "#fff" }} />
            </Box>
            <Box flex={1}>
              <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#fff", lineHeight: 1.2 }}>
                InvestBot
              </Typography>
              <Box display="flex" alignItems="center" gap={0.6}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#34d399", animation: "pulse 2s infinite", "@keyframes pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.5 } } }} />
                <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                  AI · NSE/BSE/MCX · Live data
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Clear chat">
              <IconButton size="small" onClick={handleReset} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }}>
                <RestartAlt sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }}>
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              px: 2, py: 1.5,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              "&::-webkit-scrollbar": { width: 4 },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": { background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", borderRadius: 2 },
            }}
          >
            {messages.map(msg => (
              <Box
                key={msg.id}
                sx={{
                  display: "flex",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  gap: 1,
                  alignItems: "flex-end",
                }}
              >
                {/* Bot avatar */}
                {msg.role === "assistant" && (
                  <Box
                    sx={{
                      width: 28, height: 28, borderRadius: 1.5, flexShrink: 0,
                      background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <SmartToy sx={{ fontSize: 15, color: "#fff" }} />
                  </Box>
                )}

                {/* Bubble */}
                <Box
                  sx={{
                    maxWidth: "82%",
                    px: 2, py: 1.25,
                    borderRadius: msg.role === "user"
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                      : isDark ? "rgba(30,41,59,0.8)" : "rgba(248,250,252,1)",
                    border: msg.role === "assistant"
                      ? `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`
                      : "none",
                    boxShadow: msg.role === "user"
                      ? "0 4px 16px rgba(99,102,241,0.3)"
                      : "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  {msg.role === "user" ? (
                    <Typography sx={{ fontSize: 13, color: "#fff", lineHeight: 1.6 }}>
                      {msg.content}
                    </Typography>
                  ) : (
                    <MarkdownBlock content={msg.content} />
                  )}
                  <Typography
                    sx={{
                      fontSize: 10,
                      color: msg.role === "user" ? "rgba(255,255,255,0.6)" : "text.disabled",
                      mt: 0.5,
                      textAlign: msg.role === "user" ? "right" : "left",
                    }}
                  >
                    {formatTime(msg.timestamp)}
                  </Typography>
                </Box>
              </Box>
            ))}

            {/* Typing indicator */}
            {loading && (
              <Box display="flex" alignItems="flex-end" gap={1}>
                <Box
                  sx={{
                    width: 28, height: 28, borderRadius: 1.5,
                    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <SmartToy sx={{ fontSize: 15, color: "#fff" }} />
                </Box>
                <Box
                  sx={{
                    px: 2, py: 1.25,
                    borderRadius: "16px 16px 16px 4px",
                    background: isDark ? "rgba(30,41,59,0.8)" : "rgba(248,250,252,1)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                  }}
                >
                  <TypingDots />
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Suggestions (show only when no user messages yet) */}
          {messages.length <= 1 && !loading && (
            <Box sx={{ px: 2, pb: 1 }}>
              <Typography sx={{ fontSize: 11, color: "text.disabled", mb: 1, fontWeight: 600, letterSpacing: 0.5 }}>
                QUICK START
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.75}>
                {SUGGESTIONS.map(s => (
                  <Chip
                    key={s}
                    label={s}
                    size="small"
                    onClick={() => sendMessage(s)}
                    sx={{
                      fontSize: 11, height: 26,
                      background: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.07)",
                      border: `1px solid ${alpha("#6366f1", 0.2)}`,
                      color: "#6366f1",
                      cursor: "pointer",
                      "&:hover": { background: alpha("#6366f1", 0.15) },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Disclaimer strip */}
          <Box
            sx={{
              px: 2, py: 0.75,
              background: isDark ? "rgba(245,158,11,0.06)" : "rgba(245,158,11,0.04)",
              borderTop: `1px solid ${alpha("#f59e0b", 0.15)}`,
            }}
          >
            <Typography sx={{ fontSize: 10, color: isDark ? "#fcd34d" : "#92400e", lineHeight: 1.4, opacity: 0.85 }}>
              For educational purposes only. Not investment advice. DYOR. Market investments are subject to risks.
            </Typography>
          </Box>

          {/* Input */}
          <Box
            sx={{
              px: 2, py: 1.5,
              borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              display: "flex", gap: 1, alignItems: "flex-end",
              background: isDark ? "rgba(15,20,32,0.9)" : "#fff",
            }}
          >
            <TextField
              inputRef={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="e.g. ₹1L · 2yr · 12% · medium risk"
              multiline
              maxRows={3}
              size="small"
              fullWidth
              disabled={loading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  fontSize: 13,
                  background: isDark ? "rgba(30,41,59,0.6)" : "rgba(248,250,252,0.8)",
                  "& fieldset": { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)" },
                  "&:hover fieldset": { borderColor: alpha("#6366f1", 0.4) },
                  "&.Mui-focused fieldset": { borderColor: "#6366f1" },
                },
              }}
            />
            <IconButton
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              sx={{
                width: 40, height: 40, flexShrink: 0,
                background: input.trim() && !loading
                  ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                  : isDark ? "rgba(30,41,59,0.6)" : "rgba(0,0,0,0.06)",
                color: input.trim() && !loading ? "#fff" : "text.disabled",
                borderRadius: 2,
                transition: "all 0.2s ease",
                "&:hover": {
                  background: input.trim() && !loading ? "linear-gradient(135deg, #4f46e5, #4338ca)" : undefined,
                  transform: input.trim() && !loading ? "scale(1.05)" : undefined,
                },
              }}
            >
              {loading
                ? <CircularProgress size={16} sx={{ color: "text.disabled" }} />
                : <Send sx={{ fontSize: 17 }} />
              }
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default InvestBot;
