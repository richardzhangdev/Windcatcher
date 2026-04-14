import React, { useState, useEffect } from "react";
import { AppConfig } from "../../shared/types";

interface SettingsPopupProps {
  open: boolean;
  config: AppConfig;
  onClose: () => void;
  onSave: (config: AppConfig) => void;
  onClearCache: () => void;
}

export function SettingsPopup({ open, config, onClose, onSave, onClearCache }: SettingsPopupProps) {
  const [maxResultsStr, setMaxResultsStr] = useState(String(config.max_results_per_source));
  const [showWarning, setShowWarning] = useState(false);

  // Reset state when popup opens
  useEffect(() => {
    if (open) {
      setMaxResultsStr(String(config.max_results_per_source));
      setShowWarning(config.max_results_per_source > 30);
    }
  }, [open, config.max_results_per_source]);

  const handleSave = () => {
    const value = parseInt(maxResultsStr, 10);
    if (!isNaN(value) && value >= 1 && value <= 100) {
      onSave({ ...config, max_results_per_source: value });
      onClose();
    }
  };

  const handleMaxResultsChange = (valueStr: string) => {
    // Allow empty string for editing
    if (valueStr === "") {
      setMaxResultsStr("");
      setShowWarning(false);
      return;
    }
    
    const value = parseInt(valueStr, 10);
    if (!isNaN(value) && value >= 1 && value <= 100) {
      setMaxResultsStr(valueStr);
      setShowWarning(value > 30);
    }
  };

  const isValidInput = maxResultsStr !== "" && !isNaN(parseInt(maxResultsStr, 10));

  const handleClearCache = async () => {
    if (confirm("Are you sure you want to clear the cache? This will remove all stored search results.")) {
      onClearCache();
    }
  };

  return (
    <div className={`pop-bg${open ? " vis" : ""}`}>
      <div className="pop" style={{ maxWidth: 500 }}>
        <div className="pop-hd">
          <span className="pop-title">Settings</span>
          <button className="pop-x" onClick={onClose}>✕</button>
        </div>
        <div className="pop-body" style={{ padding: "20px" }}>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Max Results Per Source
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={maxResultsStr}
              onChange={(e) => handleMaxResultsChange(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
            <div style={{ marginTop: "8px", fontSize: "13px", color: "#666" }}>
              Default: 30 results per source
            </div>
            {showWarning && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffc107",
                  borderRadius: "4px",
                  fontSize: "13px",
                  color: "#856404",
                }}
              >
                ⚠️ <strong>Warning:</strong> Increasing this value will fetch more results from APIs, which may
                increase API costs (especially for YouTube and Twitter) and longer refresh times.
              </div>
            )}
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Cache Management
            </label>
            <button
              onClick={handleClearCache}
              style={{
                padding: "8px 16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Clear Cache
            </button>
            <div style={{ marginTop: "8px", fontSize: "13px", color: "#666" }}>
              Remove all stored search results. The next refresh will fetch fresh data.
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isValidInput}
              style={{
                padding: "8px 16px",
                backgroundColor: isValidInput ? "#007bff" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isValidInput ? "pointer" : "not-allowed",
                fontSize: "14px",
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
