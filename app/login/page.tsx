"use client";

import { useState } from "react";

/**
 * KORM FOREX — Login
 *
 * Design concept: a real trading-terminal feel, not a generic SaaS login.
 * Left pane: an animated candlestick chart (grows in once on load) with a
 * live-style pair strip, grounded in actual forex conventions (green/red
 * for gains/losses). Right pane: a quiet, focused password form.
 *
 * Fonts: Space Grotesk for the display wordmark, Inter for UI text,
 * JetBrains Mono for numeric data — the mono face is used because this is
 * a trading terminal, not as decoration.
 */

const CANDLES = [
  { h: 38, up: true },
  { h: 54, up: true },
  { h: 22, up: false },
  { h: 61, up: true },
  { h: 29, up: false },
  { h: 45, up: true },
  { h: 71, up: true },
  { h: 33, up: false },
  { h: 48, up: true },
  { h: 26, up: false },
  { h: 58, up: true },
  { h: 40, up: false },
  { h: 65, up: true },
  { h: 31, up: false },
  { h: 52, up: true },
  { h: 24, up: false },
  { h: 44, up: true },
  { h: 68, up: true },
  { h: 36, up: false },
  { h: 57, up: true },
  { h: 28, up: false },
  { h: 50, up: true },
  { h: 63, up: true },
  { h: 35, up: false },
];

const PAIRS = [
  { sym: "GOLD", px: "2,634.80", delta: "+0.32%", up: true },
  { sym: "NASDAQ", px: "19,842.10", delta: "-0.18%", up: false },
  { sym: "EUR/USD", px: "1.0842", delta: "+0.14%", up: true },
  { sym: "GBP/USD", px: "1.2731", delta: "+0.06%", up: true },
  { sym: "USD/JPY", px: "154.92", delta: "-0.21%", up: false },
  { sym: "AUD/USD", px: "0.6588", delta: "-0.08%", up: false },
  { sym: "USD/CHF", px: "0.8811", delta: "+0.03%", up: true },
];

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.href = "/";
      } else {
        setError("That password isn't right. Try again.");
        setLoading(false);
      }
    } catch {
      setError("Couldn't reach the server. Check your connection.");
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="chart-pane" aria-hidden="true">
        <div className="chart-glow" />
        {/* Drop your logo file into /public (e.g. public/logo.png) and it will render here. */}
        <img src="/logo.png" alt="Korm Forex" className="corner-logo" />
        <svg
          className="candles"
          viewBox="0 0 480 220"
          preserveAspectRatio="none"
        >
          {CANDLES.map((c, i) => {
            const w = 480 / CANDLES.length;
            const x = i * w + w * 0.28;
            const bodyW = w * 0.44;
            const baseY = 220;
            return (
              <g
                key={i}
                className="candle"
                style={{ animationDelay: `${i * 28}ms` }}
              >
                <line
                  x1={x + bodyW / 2}
                  x2={x + bodyW / 2}
                  y1={baseY}
                  y2={baseY - c.h - 10}
                  stroke={c.up ? "var(--buy)" : "var(--sell)"}
                  strokeWidth={1.5}
                  opacity={0.55}
                />
                <rect
                  x={x}
                  width={bodyW}
                  y={baseY - c.h}
                  height={c.h}
                  rx={1.5}
                  fill={c.up ? "var(--buy)" : "var(--sell)"}
                  opacity={0.9}
                />
              </g>
            );
          })}
        </svg>

        <div className="brand">
          <div className="wordmark">Korm Forex</div>
          <p className="tagline">
            Your positions, spreads, and journal — in one place.
          </p>
        </div>

        <div className="strip">
          <div className="strip-head">
            <span className="dot" />
            <span>Reference rates</span>
          </div>
          <ul className="strip-list">
            {PAIRS.map((p) => (
              <li key={p.sym}>
                <span className="sym">{p.sym}</span>
                <span className="px">{p.px}</span>
                <span className={"delta " + (p.up ? "up" : "down")}>
                  {p.delta}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="form-pane">
        <form className="form-card" onSubmit={handleSubmit}>
          {/* Drop your logo file into /public (e.g. public/logo.png) and it will render here. */}
          <img src="/logo.png" alt="Korm Forex" className="logo" />
          <h1>Welcome back</h1>
          <p className="sub">Enter your password to open the dashboard.</p>

          <label className="field-label" htmlFor="password">
            Password
          </label>
          <div className="input-wrap">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
            <button
              type="button"
              className="toggle-pw"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 3l18 18M10.6 10.7a2.6 2.6 0 003.7 3.7M6.6 6.7C4.4 8.2 2.9 10.3 2 12c1.6 3.2 5.2 7 10 7 1.6 0 3.1-.4 4.4-1.1M9.9 5.2A10.6 10.6 0 0112 5c4.8 0 8.4 3.8 10 7-.6 1.2-1.4 2.4-2.4 3.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M2 12c1.6-3.2 5.2-7 10-7s8.4 3.8 10 7c-1.6 3.2-5.2 7-10 7s-8.4-3.8-10-7z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              )}
            </button>
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="submit" disabled={loading}>
            {loading ? "Checking…" : "Log in"}
          </button>
        </form>

        <p className="footnote">Private tracker · access limited to you</p>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
          background: var(--ink);
          color: var(--text);
        }

        .chart-pane {
          position: relative;
          overflow: hidden;
          padding: 56px 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: radial-gradient(
            120% 90% at 0% 0%,
            #131a22 0%,
            var(--ink) 55%
          );
          border-right: 1px solid var(--line);
        }

        .chart-glow {
          position: absolute;
          inset: -20% -10% auto auto;
          width: 480px;
          height: 480px;
          background: radial-gradient(
            circle,
            rgba(52, 211, 153, 0.14),
            transparent 65%
          );
          pointer-events: none;
        }

        .corner-logo {
          position: absolute;
          top: 32px;
          left: 48px;
          z-index: 2;
          height: 28px;
          width: auto;
          max-width: 160px;
        }

        .candles {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 46%;
          width: 100%;
        }

        .candle {
          transform-origin: bottom;
          animation: grow 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes grow {
          from {
            transform: scaleY(0);
            opacity: 0;
          }
          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        .brand {
          position: relative;
          z-index: 1;
          max-width: 380px;
          margin-top: 40px;
        }

        .logo {
          height: 100px;
          width: auto;
          max-width: 280px;
          display: block;
          margin: 0 auto 32px;
          border-radius: 50%;
          overflow: hidden;
          background: rgba(18, 22, 27, 0.9);
          padding: 12px;
          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;
        }

        .logo:hover {
          transform: scale(1.05);
          box-shadow:
            0 12px 32px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.15);
        }

        .wordmark {
          font-family: "Space Grotesk", var(--font-sans);
          font-size: 30px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .tagline {
          margin-top: 10px;
          font-size: 14.5px;
          line-height: 1.55;
          color: var(--muted);
          max-width: 300px;
        }

        .strip {
          position: relative;
          z-index: 1;
          background: rgba(18, 22, 27, 0.72);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 14px 16px;
          backdrop-filter: blur(6px);
          max-width: 360px;
        }

        .strip-head {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 10px;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--buy);
          box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.6);
          animation: pulse 2.2s ease-out infinite;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.5);
          }
          70% {
            box-shadow: 0 0 0 7px rgba(52, 211, 153, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(52, 211, 153, 0);
          }
        }

        .strip-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .strip-list li {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 14px;
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 12.5px;
        }

        .sym {
          color: var(--text);
          opacity: 0.85;
        }
        .px {
          color: var(--text);
          text-align: right;
        }
        .delta {
          text-align: right;
          min-width: 56px;
        }
        .delta.up {
          color: var(--buy);
        }
        .delta.down {
          color: var(--sell);
        }

        .form-pane {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 32px;
          gap: 18px;
        }

        .form-card {
          width: 100%;
          max-width: 340px;
        }

        h1 {
          font-family: "Space Grotesk", var(--font-sans);
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 6px;
        }

        .sub {
          font-size: 14px;
          color: var(--muted);
          margin: 0 0 28px;
        }

        .field-label {
          display: block;
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 7px;
        }

        .input-wrap {
          position: relative;
          margin-bottom: 10px;
        }

        input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 42px 12px 14px;
          font-size: 14.5px;
          border-radius: 8px;
          border: 1px solid var(--line);
          background: var(--panel);
          color: var(--text);
          transition: border-color 150ms ease;
        }

        input::placeholder {
          color: #5b6472;
        }

        input:focus-visible {
          outline: 2px solid var(--buy);
          outline-offset: 1px;
          border-color: var(--buy);
        }

        .toggle-pw {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--muted);
          padding: 6px;
          display: flex;
          cursor: pointer;
          border-radius: 6px;
        }

        .toggle-pw:hover {
          color: var(--text);
        }

        .toggle-pw:focus-visible {
          outline: 2px solid var(--buy);
          outline-offset: 1px;
        }

        .error {
          color: var(--sell);
          font-size: 13px;
          margin: 4px 0 14px;
        }

        .submit {
          width: 100%;
          margin-top: 6px;
          padding: 12px 16px;
          border-radius: 8px;
          border: none;
          background: var(--buy);
          color: #06251b;
          font-size: 14.5px;
          font-weight: 600;
          cursor: pointer;
          transition:
            filter 150ms ease,
            transform 150ms ease;
        }

        .submit:hover:not(:disabled) {
          filter: brightness(1.06);
        }
        .submit:active:not(:disabled) {
          transform: translateY(1px);
        }
        .submit:disabled {
          opacity: 0.65;
          cursor: default;
        }

        .submit:focus-visible {
          outline: 2px solid var(--text);
          outline-offset: 2px;
        }

        .footnote {
          font-size: 12px;
          color: #4d5560;
        }

        @media (prefers-reduced-motion: reduce) {
          .candle {
            animation: none;
            opacity: 1;
            transform: none;
          }
          .dot {
            animation: none;
          }
        }

        @media (max-width: 860px) {
          .page {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto;
          }
          .chart-pane {
            padding: 36px 28px;
            border-right: none;
            border-bottom: 1px solid var(--line);
            min-height: 320px;
          }
          .corner-logo {
            top: 20px;
            left: 28px;
            height: 24px;
            border-radius: 50%;
            overflow: hidden;
            background: rgba(18, 22, 27, 0.8);
            padding: 3px;
          }

          .form-pane {
            padding: 40px 24px 56px;
          }
        }
      `}</style>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap");

        :root {
          --ink: #0a0d12;
          --panel: #12161d;
          --line: #232a34;
          --text: #ecf0f3;
          --muted: #8891a0;
          --buy: #34d399;
          --sell: #f76464;
          --font-sans: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
        }

        body {
          font-family: var(--font-sans);
        }
      `}</style>
    </div>
  );
}
