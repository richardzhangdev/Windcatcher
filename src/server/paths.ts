import { join } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** App data root in the user home directory (memory, .env, icons). */
export const BOB_AGGREGATOR_HOME = join(homedir(), "bob-aggregator");
export const MEMORY_FILE = join(BOB_AGGREGATOR_HOME, "memory", "ibm-bob-results.json");
export const ENV_FILE = join(BOB_AGGREGATOR_HOME, ".env");
/** Legacy path — only used for one-time migration to .env */
export const LEGACY_CONFIG_FILE = join(BOB_AGGREGATOR_HOME, "skills", "ibm-bob-tracker", "config.json");
export const ICONS_DIR = join(BOB_AGGREGATOR_HOME, "icons");
export const WORKER_SCRIPT = join(__dirname, "worker", "index.js");
export const PORT = 7331;
