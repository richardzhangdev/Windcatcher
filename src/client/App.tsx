import React, { useState, useEffect, useCallback, useRef } from "react";
import { AppConfig, Item, BUILTIN_SOURCES, ResultsFile, StatusResponse, DEFAULT_SOURCE_ORDER } from "../shared/types";
import { Column } from "./components/Column";
import { LogPanel } from "./components/LogPanel";
import { AddSourcePopup } from "./components/AddSourcePopup";
import { formatLastUpdated } from "./utils";

const DAYS_OPTIONS = [
  { value: 1, label: "Past day" },
  { value: 3, label: "3 days" },
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
];

function getInitialDays(): number {
  const param = new URLSearchParams(window.location.search).get("days");
  return param ? parseInt(param, 10) : 3;
}

function getOrderedSources(config: AppConfig) {
  const order = config.source_order?.length ? config.source_order : DEFAULT_SOURCE_ORDER;
  const byId = new Map(BUILTIN_SOURCES.map((s) => [s.id, s]));
  const ordered = order.filter((id) => byId.has(id) && config.sources[id] !== false).map((id) => byId.get(id)!);
  // Append any enabled sources not in the order list
  for (const s of BUILTIN_SOURCES) {
    if (config.sources[s.id] !== false && !order.includes(s.id)) {
      ordered.push(s);
    }
  }
  return ordered;
}

export function App() {
  const [days, setDays] = useState(getInitialDays);
  const [items, setItems] = useState<Item[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [logLines, setLogLines] = useState<string[]>([]);
  const [logStatus, setLogStatus] = useState<"idle" | "run" | "done" | "err">("idle");
  const [showLog, setShowLog] = useState(false);
  const [showAddPopup, setShowAddPopup] = useState(false);

  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [liveOrder, setLiveOrder] = useState<string[] | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async (d: number) => {
    try {
      const [dataRes, cfgRes] = await Promise.all([
        fetch(`/api/data?days=${d}`),
        fetch("/api/config"),
      ]);
      const data: ResultsFile = await dataRes.json();
      const cfg: AppConfig = await cfgRes.json();
      setItems(data.items);
      setLastUpdated(data.last_updated);
      setConfig(cfg);
    } catch (e) {
      console.error("Failed to load data:", e);
    }
  }, []);

  useEffect(() => {
    loadData(days);
    const interval = setInterval(async () => {
      try {
        const status: StatusResponse = await fetch("/api/status").then((r) => r.json());
        setRefreshing(status.refreshing);
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [days, loadData]);

  function changeDays(d: number) {
    setDays(d);
    const url = new URL(window.location.href);
    url.searchParams.set("days", String(d));
    window.history.pushState({}, "", url);
    loadData(d);
  }

  async function startRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setLogLines([]);
    setLogStatus("run");
    setShowLog(true);

    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/refresh", {
        method: "POST",
        signal: abortRef.current.signal,
      });

      if (res.status === 409) {
        setLogLines(["Already running\n"]);
        setLogStatus("err");
        setRefreshing(false);
        return;
      }

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setLogLines((prev) => [...prev, dec.decode(value)]);
      }
      setLogStatus("done");
      setTimeout(() => {
        loadData(days);
        setLogStatus("idle");
      }, 1200);
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setLogLines((prev) => [...prev, `Error: ${e.message}\n`]);
        setLogStatus("err");
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function persistConfig(updated: AppConfig) {
    await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setConfig(updated);
  }

  async function removeColumn(id: string) {
    if (!config) return;
    persistConfig({ ...config, sources: { ...config.sources, [id]: false } });
  }

  async function addSource(id: string) {
    if (!config) return;
    persistConfig({ ...config, sources: { ...config.sources, [id]: true } });
    setShowAddPopup(false);
  }

  function handleDragStart(id: string) {
    if (!config) return;
    const order = config.source_order?.length ? [...config.source_order] : [...DEFAULT_SOURCE_ORDER];
    setDragSourceId(id);
    setLiveOrder(order);
  }

  function handleDragOver(_e: React.DragEvent, targetId: string) {
    if (!liveOrder || !dragSourceId || targetId === dragSourceId) return;
    const fromIdx = liveOrder.indexOf(dragSourceId);
    const toIdx = liveOrder.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
    const next = [...liveOrder];
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, dragSourceId);
    setLiveOrder(next);
  }

  async function handleDrop() {
    if (!config || !liveOrder) {
      setDragSourceId(null);
      setLiveOrder(null);
      return;
    }
    setDragSourceId(null);
    setLiveOrder(null);
    persistConfig({ ...config, source_order: liveOrder });
  }

  function handleDragEnd() {
    if (!config || !liveOrder) {
      setDragSourceId(null);
      setLiveOrder(null);
      return;
    }
    setDragSourceId(null);
    setLiveOrder(null);
    persistConfig({ ...config, source_order: liveOrder });
  }

  const displayConfig = config && liveOrder ? { ...config, source_order: liveOrder } : config;
  const enabledSources = displayConfig ? getOrderedSources(displayConfig) : [];
  const hasDisabled = config
    ? BUILTIN_SOURCES.some((s) => config.sources[s.id] === false)
    : false;

  const bySource = items.reduce<Record<string, Item[]>>((acc, item) => {
    const src = item.source || "news";
    (acc[src] ??= []).push(item);
    return acc;
  }, {});

  const totalItems = enabledSources.reduce(
    (sum, s) => sum + (bySource[s.id]?.length ?? 0),
    0
  );

  const daysLabel = days >= 9999 ? "all time" : `${days} day${days !== 1 ? "s" : ""}`;

  return (
    <>
      <header className="header">
        <div className="header-left">
          <h1 className="header-title">Aggregated news on IBM Bob</h1>
          <span className="header-upd">Updated {formatLastUpdated(lastUpdated)}</span>
        </div>
        <div className="header-right">
          <select value={days} onChange={(e) => changeDays(Number(e.target.value))}>
            {DAYS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={startRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {showLog && (
        <LogPanel
          lines={logLines}
          status={logStatus}
          onClose={() => setShowLog(false)}
        />
      )}

      <div className={`board-wrap${showLog ? " log-open" : ""}`}>
        <div className="board">
          {config && enabledSources.map((source) => (
            <Column
              key={source.id}
              source={source}
              items={bySource[source.id] ?? []}
              config={config}
              onRemove={removeColumn}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              isDragging={dragSourceId === source.id}
            />
          ))}
          {hasDisabled && (
            <div className="col col-ghost" onClick={() => setShowAddPopup(true)} title="Add a source">
              <div className="ghost-inner">
                <div className="ghost-ring">+</div>
                <span className="ghost-lbl">Add source</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {config && (
        <AddSourcePopup
          open={showAddPopup}
          config={config}
          onClose={() => setShowAddPopup(false)}
          onAdd={addSource}
        />
      )}
    </>
  );
}
