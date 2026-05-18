export function unique(values) {
  return [...new Set(values)];
}

export function groupBy(items, key) {
  const map = new Map();
  items.forEach((item) => {
    const value = item[key];
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(item);
  });
  return map;
}

export function buildPairKey(a, b) {
  return [String(a), String(b)].sort().join("::");
}

export function toIntSafe(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function byThenBy(...mappers) {
  return (a, b) => {
    for (const mapper of mappers) {
      const av = mapper(a);
      const bv = mapper(b);
      if (av < bv) return -1;
      if (av > bv) return 1;
    }
    return 0;
  };
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function formatDateDisplay(dateText) {
  if (!dateText) return "-";
  const m = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return dateText;
  return `${m[3]}/${m[2]}/${m[1]}`;
}
