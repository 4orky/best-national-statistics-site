// Small number and text formatters for Japan in Numbers. One job: make
// figures readable the same way on every page.

export function fmtMillions(value) {
  return `${value.toFixed(2)}m`;
}

export function fmtTrillions(value) {
  return `$${value.toFixed(2)}tn`;
}

export function fmtMoney(value) {
  return `$${value.toLocaleString('en-US')}`;
}

export function fmtSigned(value, decimals = 1) {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toFixed(decimals)}`;
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function sourceLine(source, year) {
  return `<p class="source">Source: ${escapeHtml(source)}, ${year}.</p>`;
}
