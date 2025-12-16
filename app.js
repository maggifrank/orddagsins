function getSiteKey() {
  // Priority 1: querystring ?site=en
  const url = new URL(window.location.href);
  const qs = url.searchParams.get("site");
  if (qs) return qs;

  // Priority 2: pretty path /en/ or /is/
  // Example pathnames: "/", "/en/", "/is"
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length >= 1) return parts[0];

  // Default
  return "en";
}

// Stable daily seed from YYYY-MM-DD (visitor local time)
function getTodayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function hashStringToInt(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

async function loadSite(siteKey) {
  const res = await fetch(`/subsites/${siteKey}.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load /subsites/${siteKey}.json`);
  return res.json();
}

function formatTodayLabel(todayKey) {
  return `Today: ${todayKey}`;
}

async function main() {
  const siteKey = getSiteKey();
  const todayKey = getTodayKey();

  document.getElementById("todayLabel").textContent = formatTodayLabel(todayKey);

  let data;
  try {
    data = await loadSite(siteKey);
  } catch (e) {
    document.getElementById("word").textContent = "Missing word list";
    document.getElementById("meta").textContent =
      `Could not load /subsites/${siteKey}.json\n` +
      `Try /en/ or /?site=en`;
    return;
  }

  document.getElementById("siteTitle").textContent = data.title || "Word of the Day";

  const words = Array.isArray(data.words) ? data.words : [];
  if (words.length === 0) {
    document.getElementById("word").textContent = "No words configured";
    document.getElementById("meta").textContent = `Add words to subsites/${siteKey}.json`;
    return;
  }

  const seed = hashStringToInt(`${siteKey}::${todayKey}`);
  const idx = seed % words.length;
  const item = words[idx];

  document.getElementById("word").textContent = item.word ?? String(item);
  document.getElementById("pronunciation").textContent=item.pronunciation? item.pronunciation:"";
  document.getElementById("meta").textContent = item.note ? item.note : "";
}

main();
