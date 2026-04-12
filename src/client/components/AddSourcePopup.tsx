import React from "react";
import { AppConfig, BUILTIN_SOURCES } from "../../shared/types";

interface AddSourcePopupProps {
  open: boolean;
  config: AppConfig;
  onClose: () => void;
  onAdd: (sourceId: string) => void;
}

export function AddSourcePopup({ open, config, onClose, onAdd }: AddSourcePopupProps) {
  const disabled = BUILTIN_SOURCES.filter((s) => config.sources[s.id] === false);

  return (
    <div className={`pop-bg${open ? " vis" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pop">
        <div className="pop-hd">
          <span className="pop-title">Add a source</span>
          <button className="pop-x" onClick={onClose}>✕</button>
        </div>
        <div className="pop-body">
          {disabled.length === 0 ? (
            <div className="pop-empty">All sources are active.</div>
          ) : (
            disabled.map((s) => (
              <div key={s.id} className="pick-row" onClick={() => onAdd(s.id)}>
                <img src={`/icons/${s.icon}`} alt="" style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="pick-label">{s.label}</div>
                  <div className="pick-sub">Built-in source</div>
                </div>
                <span className="pick-arr">＋</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
