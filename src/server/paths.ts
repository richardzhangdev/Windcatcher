import { join } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const WINDCATCHER = join(homedir(), "Windcatcher");
export const MEMORY_FILE = join(WINDCATCHER, "memory", "ibm-bob-results.json");
export const ENV_FILE = join(WINDCATCHER, ".env");
/** Legacy path — only used for one-time migration to .env */
export const LEGACY_CONFIG_FILE = join(WINDCATCHER, "skills", "ibm-bob-tracker", "config.json");
export const ICONS_DIR = join(WINDCATCHER, "icons");
export const WORKER_SCRIPT = join(__dirname, "worker", "index.js");
export const PORT = 7331;
