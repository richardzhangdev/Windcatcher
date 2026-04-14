import React, { useEffect, useRef } from "react";

interface LogPanelProps {
  lines: string[];
  status: "idle" | "run" | "done" | "err";
  onClose: () => void;
}

const STATUS_TEXT: Record<string, string> = {
  idle: "Ready",
  run: "Fetching…",
  done: "Done — reloading…",
  err: "Error",
};

export function LogPanel({ lines, status, onClose }: LogPanelProps) {
  const outRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (outRef.current) {
      outRef.current.scrollTop = outRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="log-panel">
      <pre className="log-out" ref={outRef}>{lines.join("")}</pre>
      <div className="log-hd">
        <span className={`log-status ${status}`}>{STATUS_TEXT[status]}</span>
        <button className="log-close" onClick={onClose}>✕ dismiss</button>
      </div>
    </div>
  );
}
