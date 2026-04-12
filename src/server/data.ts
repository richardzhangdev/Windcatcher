import { readFileSync, existsSync } from "fs";
import { Item, ResultsFile } from "../shared/types.js";
import { MEMORY_FILE } from "./paths.js";

export function loadResults(days = 90): ResultsFile {
  if (!existsSync(MEMORY_FILE)) {
    return { last_updated: null, items: [] };
  }
  const data = JSON.parse(readFileSync(MEMORY_FILE, "utf8")) as ResultsFile;
  if (days < 9999) {
    const cutoff = new Date(Date.now() - days * 86_400_000);
    data.items = data.items.filter((item: Item) => {
      try {
        return new Date(item.timestamp) >= cutoff;
      } catch {
        return true;
      }
    });
  }
  return data;
}
