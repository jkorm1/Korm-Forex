"use client";
import { useState } from "react";
import type { Trade } from "@/lib/types";

const labels = [
  "Largest Bar",
  "Space Left",
  "Engulfing",
  "HH",
  "LL",
  "BOS",
  "Same Direction (XAU / NAS)",
];

function emptyTrade(): Trade {
  return {
    id: "new",
    date: new Date().toISOString().slice(0, 16),
    pair: "XAU/USD",
    order: "Buy",
    sameDirection: false,
    setupQuality: "0/7",
    entry: 0,
    outcome: "Pending",
    pl: 0,
    ratio: 0,
    checklist: Array(7).fill(false),
  };
}

export function TradeForm({
  initial,
  logOutcomeOnly = false,
  onSave,
  onCancel,
}: {
  initial?: Trade;
  /** True when this form should only collect the outcome/P&L/ratio for an
   *  already-planned trade, not the setup itself. */
  logOutcomeOnly?: boolean;
  onSave: (trade: Trade) => Promise<void>;
  onCancel?: () => void;
}) {
  const [trade, setTrade] = useState<Trade>(() => {
    const base = initial || emptyTrade();
    // If we're logging the outcome of a planned trade, the dropdown needs a
    // real (non-Pending) starting value, or leaving it untouched on submit
    // would silently save "Pending" again instead of the selected outcome.
    if (logOutcomeOnly && base.outcome === "Pending") {
      return { ...base, outcome: "Win" };
    }
    return base;
  });
  const [saving, setSaving] = useState(false);

  const isNewPlan = !initial;
  const showPlanFields = !logOutcomeOnly;
  const showOutcomeFields = !isNewPlan;

  const update = (patch: Partial<Trade>) =>
    setTrade((current) => ({ ...current, ...patch }));

  const toggle = (index: number) => {
    const checklist = [...trade.checklist];
    checklist[index] = !checklist[index];
    update({
      checklist,
      sameDirection: checklist[6],
      setupQuality: `${checklist.filter(Boolean).length}/7`,
    });
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const outcome = isNewPlan ? "Pending" : trade.outcome;
    const pl =
      outcome === "Pending"
        ? 0
        : outcome === "Loss"
          ? -Math.abs(trade.pl)
          : Math.abs(trade.pl);
    await onSave({ ...trade, outcome, pl });
    setSaving(false);
  }

  return (
    <form className="trade-form panel" onSubmit={submit}>
      {logOutcomeOnly && initial && (
        <div className="plan-summary">
          <div>
            <span>Pair</span>
            <strong>{initial.pair}</strong>
          </div>
          <div>
            <span>Order</span>
            <strong>{initial.order}</strong>
          </div>
          <div>
            <span>Entry</span>
            <strong>{initial.entry}</strong>
          </div>
          <div>
            <span>Setup</span>
            <strong>{initial.setupQuality}</strong>
          </div>
          <div>
            <span>Planned</span>
            <strong>{initial.date}</strong>
          </div>
        </div>
      )}

      {showPlanFields && (
        <>
          <div className="form-grid">
            <label>
              Date & Time
              <input
                type="datetime-local"
                value={trade.date}
                onChange={(e) => update({ date: e.target.value })}
                required
              />
            </label>

            <label>
              Pair
              <select
                value={trade.pair}
                onChange={(e) =>
                  update({ pair: e.target.value as Trade["pair"] })
                }
              >
                <option>XAU/USD</option>
                <option>NAS100</option>
              </select>
            </label>

            <label>
              Order
              <select
                value={trade.order}
                onChange={(e) =>
                  update({ order: e.target.value as Trade["order"] })
                }
              >
                <option>Buy</option>
                <option>Sell</option>
              </select>
            </label>

            <label>
              Entry
              <input
                type="number"
                step="any"
                value={trade.entry}
                onChange={(e) => update({ entry: Number(e.target.value) })}
              />
            </label>
          </div>

          <fieldset>
            <legend>Setup checklist</legend>
            <div className="check-grid">
              {labels.map((label, index) => (
                <label key={label} className="check-option">
                  <input
                    type="checkbox"
                    checked={trade.checklist[index]}
                    onChange={() => toggle(index)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      {isNewPlan && (
        <p className="form-hint">
          This saves as a planned setup — no outcome yet. Once you've taken the
          trade in the market, come back and log the outcome from the trade log.
        </p>
      )}

      {showOutcomeFields && (
        <div className="form-grid">
          <label>
            Outcome
            <select
              value={trade.outcome}
              onChange={(e) =>
                update({ outcome: e.target.value as Trade["outcome"] })
              }
            >
              <option>Win</option>
              <option>Loss</option>
              <option>BE</option>
            </select>
          </label>

          <label>
            P/L ($)
            <input
              type="number"
              step="any"
              value={trade.pl}
              onChange={(e) => update({ pl: Number(e.target.value) })}
            />
          </label>

          <label>
            Ratio (R:R)
            <input
              type="number"
              step="any"
              value={trade.ratio}
              onChange={(e) => update({ ratio: Number(e.target.value) })}
            />
          </label>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button className="primary-button" disabled={saving}>
          {saving
            ? "Saving..."
            : isNewPlan
              ? "Save planned trade"
              : logOutcomeOnly
                ? "Log outcome"
                : "Save changes"}
        </button>
      </div>
    </form>
  );
}
