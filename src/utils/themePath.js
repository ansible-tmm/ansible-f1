import { LEVELS } from "../data/config.js";

const ORDER = ["A", "B", "C", "D", "E", "F", "G", "H", "DS"];

function segmentToLevelId(segment) {
  for (const id of ORDER) {
    if (LEVELS[id].pathSegment === segment) return id;
  }
  return null;
}

/**
 * Map a URL path segment (last path part) to internal level id, or null.
 * @param {string} segment
 */
export function getLevelIdForPathSegment(segment) {
  return segmentToLevelId(segment);
}

/**
 * Read the active theme level from the browser path (e.g. …/AIOps → "A").
 * @param {string} [pathname]
 */
export function getLevelIdFromPathname(pathname) {
  const p = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const parts = p.replace(/\/+$/, "").split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last) return null;
  return segmentToLevelId(last);
}

/**
 * Directory URL for the deployed app (strips /ThemeSlug when present).
 * Used to build theme URLs and must match the inline base-href logic in index.html.
 * @param {string} [pathname]
 */
export function getDeployBasePathname(pathname) {
  const p = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const normalized = p.replace(/\/+$/, "") || "/";
  const parts = normalized.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  if (last && segmentToLevelId(last)) {
    parts.pop();
    return parts.length ? "/" + parts.join("/") : "/";
  }
  return normalized === "/" ? "/" : normalized;
}

/**
 * Full path for a level, including leading slash and trailing slash (e.g. /ansible-f1/AIOps/).
 * @param {string} levelId
 */
export function getThemePathForLevel(levelId) {
  const seg = LEVELS[levelId]?.pathSegment;
  if (!seg) return null;
  const base = getDeployBasePathname();
  if (base === "/") return `/${seg}/`;
  return `${base}/${seg}/`;
}

/**
 * @param {string} levelId
 * @param {"replace" | "push" | "skip"} mode skip = do not change history
 */
export function syncThemeUrl(levelId, mode = "replace") {
  const nextPath = getThemePathForLevel(levelId);
  if (!nextPath || typeof history === "undefined") return;

  const cur = window.location.pathname.replace(/\/+$/, "") || "/";
  const next = nextPath.replace(/\/+$/, "") || "/";
  if (cur === next) return;
  if (mode === "skip") return;

  const state = { level: levelId };
  if (mode === "push") {
    history.pushState(state, "", nextPath);
  } else {
    history.replaceState(state, "", nextPath);
  }
}
