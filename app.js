/* --------------------------------------------------
   Word of the Day – Netlify-ready app.js
-------------------------------------------------- */

// Determine which "site" (language) to load
function getSiteKey() {
  // 1) Query string: ?site=en
  const url = new URL(window.location.href);
  const qs = url.searchParams.get("site");
  if (qs) return qs.toLowerCase();

  // 2) Pretty URL: /en/, /is/, /fi/
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length >= 1) return parts[0].toLowerCase();

  // 3) Default
  return "en";
}

// Get today's date as YYYY-MM-DD (visitor local time)
function getTodayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Deterministic string → integer hash
function hashStringToInt(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Load JSON word list
async function loadSite(siteKey) {
  const url = `${window.location.origin}/subsites/${siteKey}.json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${url}`);
  return res.json();
}

// Display date label
function formatTodayLabel(todayKey) {
  return `Today: ${todayKey}`;
}

// Main app
async function main() {
  const siteKey = getSiteKey();
  const todayKey = getTodayKey();

  const wordEl = document.getElementById("word");
  const metaEl = document.getElementById("meta");
  const titleEl = document.getElementById("siteTitle");
  const dateEl = document.getElementById("todayLabel");

  dateEl.textContent = formatTodayLabel(todayKey);

  let data;
  try {
    data = await loadSite(siteKey);
  } catch (err) {
    wordEl.textContent = "Missing word list";
    metaEl.textContent =
      `Could not load /subsites/${siteKey}.json\n` +
      `Try /en/ or /?site=en`;
    return;
  }

  titleEl.textContent = data.title || "Word of the Day";

  const words = Array.isArray(data.words) ? data.words : [];
  if (words.length === 0) {
    wordEl.textContent = "No words configured";
    metaEl.textContent = `Add words to subsites/${siteKey}.json`;
    return;
  }

  // Stable daily selection (per site + date)
  const seed = hashStringToInt(`${siteKey}::${todayKey}`);
  const idx = seed % words.length;

  const raw = words[idx];
  const item = (typeof raw === "string") ? { word: raw } : raw;

  // Render word
  wordEl.textContent = item.word ?? String(raw);

  // Render pronunciation + note
  const lines = [];
  if (item.pronunciation) {
    lines.push(`Pronunciation: ${item.pronunciation}`);
  }
  if (item.note) {
    lines.push(item.note);
  }

  metaEl.textContent = lines.join("\n");
}

// Run
main();
