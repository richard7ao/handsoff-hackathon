import { useCallback, useEffect, useRef, useState } from "react";

const HOME_URL = "/";
const NAME = "Richard";

/* ---------------- glyphs ---------------- */

function Asterisk() {
  return (
    <svg className="chat-mark" viewBox="0 0 48 48" aria-hidden="true">
      <g stroke="var(--accent)" strokeWidth="3.4" strokeLinecap="round">
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          const x = 24 + Math.cos(a) * 16;
          const y = 24 + Math.sin(a) * 16;
          return <line key={i} x1={24} y1={24} x2={x} y2={y} />;
        })}
      </g>
    </svg>
  );
}

function MicGlyph({ on }: { on?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SendGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M4 12h14M12 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- seed suggestions ---------------- */

type Seed = { icon: string; label: string; prompt: string };
const SEEDS: Seed[] = [
  { icon: "✎", label: "Draft a post", prompt: "Draft a Reddit post for my barbershop in my own voice." },
  { icon: "◎", label: "Find my audience", prompt: "Where do my customers talk online? Find the best subreddits for a local coffee shop." },
  { icon: "↻", label: "Improve a post", prompt: "My last post got 2 upvotes. How would you rewrite it to do better?" },
  { icon: "▤", label: "Build my brief", prompt: "Help me build a business brief — ask me the 5 intake questions." },
  { icon: "✦", label: "Signal's choice", prompt: "Surprise me — show me what Signal would do for a new gym this week." },
];

/* ---------------- mock assistant ---------------- */

function reply(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("audience") || q.includes("subreddit") || q.includes("where"))
    return "I'd start where the intent already lives. For a local spot that's your city subreddit, r/smallbusiness, and 2–3 niche communities. I'll scan recent threads, rank them by fit, and surface the three with the warmest audience before drafting anything.";
  if (q.includes("draft") || q.includes("post") || q.includes("write"))
    return "Here's a first pass in your voice: lead with a specific, lived detail — not a pitch. Something like \"12 years behind the chair taught me one thing about regulars…\" then one honest lesson, and a soft invite to visit. Want me to tailor it to a subreddit?";
  if (q.includes("improve") || q.includes("rewrite") || q.includes("upvote"))
    return "Low upvotes usually means the title was generic. I'd swap the opener for a concrete moment, cut the first sentence, and repost at a higher-traffic hour. Pulse would then watch it for 10-minute intervals and rewrite again if it stalls.";
  if (q.includes("brief") || q.includes("intake") || q.includes("question"))
    return "Let's build it. (1) What does your business do? (2) Who's your ideal customer? (3) What makes you different? (4) Where are you based? (5) What's one thing you want more of? Answer in a sentence each and I'll turn it into a structured brief.";
  return "Got it. I can research your market, find where your customers talk, draft content in your voice, and keep improving it based on real engagement. Tell me about your business and I'll take it from there.";
}

/* ---------------- speech helpers ---------------- */

type SR = typeof window & {
  SpeechRecognition?: new () => any;
  webkitSpeechRecognition?: new () => any;
};

function getRecognition(): any | null {
  if (typeof window === "undefined") return null;
  const w = window as SR;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = "en-US";
  r.interimResults = true;
  r.continuous = false;
  return r;
}

const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;

/* ---------------- component ---------------- */

type Msg = { role: "user" | "assistant"; text: string };

export function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const recRef = useRef<any>(null);
  const voiceRef = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const sttSupported = useRef<boolean>(typeof window !== "undefined" && !!getRecognition()).current;

  useEffect(() => {
    voiceRef.current = voiceMode;
  }, [voiceMode]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.stop();
        if (ttsSupported) window.speechSynthesis.cancel();
      } catch {
        /* noop */
      }
    };
  }, []);

  const speak = useCallback((text: string, then?: () => void) => {
    if (!ttsSupported) {
      then?.();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    u.pitch = 1;
    u.onstart = () => setSpeaking(true);
    u.onend = () => {
      setSpeaking(false);
      then?.();
    };
    window.speechSynthesis.speak(u);
  }, []);

  const send = useCallback(
    (textArg?: string) => {
      const text = (textArg ?? input).trim();
      if (!text) return;
      setInput("");
      setMessages((m) => [...m, { role: "user", text }]);
      const answer = reply(text);
      window.setTimeout(() => {
        setMessages((m) => [...m, { role: "assistant", text: answer }]);
        if (voiceRef.current) speak(answer, () => startListening());
      }, 450);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, speak],
  );

  const startListening = useCallback(() => {
    const rec = getRecognition();
    if (!rec) return;
    recRef.current = rec;
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      setInput(finalText || interim);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      const t = finalText.trim();
      if (t && voiceRef.current) send(t);
    };
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }, [send]);

  const stopListening = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }, []);

  const toggleMic = () => (listening ? stopListening() : startListening());

  const toggleVoice = () => {
    if (voiceMode) {
      setVoiceMode(false);
      stopListening();
      if (ttsSupported) window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      setVoiceMode(true);
      voiceRef.current = true;
      startListening();
    }
  };

  const hour = new Date().getHours();
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const empty = messages.length === 0;

  return (
    <div className={`chat ${voiceMode ? "is-voice" : ""}`}>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <a className="brand" href={HOME_URL}>
            <svg className="logo" viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="21" fill="none" stroke="var(--accent)" strokeWidth="3" opacity="0.35" />
              <circle cx="32" cy="32" r="12" fill="none" stroke="var(--accent)" strokeWidth="3" opacity="0.6" />
              <circle cx="32" cy="32" r="5" fill="var(--accent)" />
            </svg>
            Signal
          </a>
          <nav className="topbar-nav">
            <div className="topbar-links">
              <a href={HOME_URL}>← Back to home</a>
            </div>
            <a className="btn btn-ghost" href={HOME_URL}>
              Home
            </a>
          </nav>
        </div>
      </header>

      <main className="chat-main">
        <div className="chat-col">
          {empty ? (
            <div className="chat-greeting">
              <Asterisk />
              <h1>
                Good {part}, {NAME}
              </h1>
            </div>
          ) : (
            <div className="chat-thread">
              {messages.map((m, i) => (
                <div className={`chat-msg ${m.role}`} key={i}>
                  <span className="chat-role">{m.role === "user" ? "You" : "Signal"}</span>
                  <p>{m.text}</p>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          )}

          {/* composer */}
          <div className="chat-box">
            <textarea
              className="chat-input"
              placeholder="How can I help you today?"
              value={input}
              rows={2}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <div className="chat-box-foot">
              <button className="chat-icon ghost" aria-label="Add attachment" title="Add">
                <PlusGlyph />
              </button>
              <div className="chat-box-right">
                <span className="chat-model">
                  Signal 1.0 <span className="chat-model-dim">Auto</span>
                </span>
                <button
                  className={`chat-icon ${listening ? "is-on" : ""}`}
                  onClick={toggleMic}
                  disabled={!sttSupported}
                  aria-label={listening ? "Stop dictation" : "Dictate"}
                  title={sttSupported ? "Speech to text" : "Speech recognition not supported in this browser"}
                >
                  <MicGlyph on={listening} />
                </button>
                <button
                  className={`chat-orb-btn ${voiceMode ? "is-on" : ""} ${speaking ? "is-speaking" : ""} ${listening && voiceMode ? "is-listening" : ""}`}
                  onClick={toggleVoice}
                  aria-label={voiceMode ? "End voice conversation" : "Start voice conversation"}
                  title="Voice mode (speech in + out)"
                >
                  <span className="orb" />
                </button>
              </div>
            </div>
          </div>

          {/* seed suggestions */}
          {empty && (
            <div className="chat-seeds">
              {SEEDS.map((s) => (
                <button key={s.label} className="chat-seed" onClick={() => send(s.prompt)}>
                  <span className="chat-seed-icon">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {!sttSupported && empty && (
            <p className="chat-note">
              Tip: voice features use your browser's Web Speech API — best in Chrome.
            </p>
          )}
        </div>
      </main>

      {/* voice overlay */}
      {voiceMode && (
        <div className="voice-overlay" role="dialog" aria-label="Voice conversation">
          <div className={`voice-orb ${speaking ? "speaking" : ""} ${listening ? "listening" : ""}`}>
            <span className="vo-core" />
            <span className="vo-ring r1" />
            <span className="vo-ring r2" />
            <span className="vo-ring r3" />
          </div>
          <div className="voice-status">
            {speaking ? "Speaking…" : listening ? "Listening…" : "Thinking…"}
          </div>
          <button className="btn btn-dark" onClick={toggleVoice}>
            End voice chat
          </button>
        </div>
      )}
    </div>
  );
}
