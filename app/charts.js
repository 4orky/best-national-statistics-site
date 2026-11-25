// Hand-rolled SVG charts for Japan in Numbers. No library: each function
// takes a series and returns an SVG string with axes, gridlines and labels.
// All charts are drawn from the site's own data files, nothing fetched.

const INK = '#1c2b4a';
const RED = '#c1272d';
const GRID = '#e3ddd2';
const MUTED = '#6b7280';

function niceMax(values) {
  const max = Math.max(...values.map((v) => Math.abs(v)));
  const pow = 10 ** Math.floor(Math.log10(max || 1));
  return Math.ceil(max / pow) * pow;
}

function niceMin(values) {
  const min = Math.min(...values);
  if (min >= 0) return 0;
  const pow = 10 ** Math.floor(Math.log10(Math.abs(min) || 1));
  return -Math.ceil(Math.abs(min) / pow) * pow;
}

// When every value is positive and the range is small next to the level
// (a population falling from 128m to 124m), a zero baseline flattens the
// line into invisibility. Zoom the axis to the data instead, keeping the
// gridlines on round numbers.
function zoomedRange(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (min <= 0 || range >= 0.25 * max || range === 0) return [niceMin(values), niceMax(values)];
  const step = 10 ** Math.floor(Math.log10(range));
  const bottom = Math.floor((min - range * 0.1) / step) * step;
  const top = Math.ceil((max + range * 0.1) / step) * step;
  return [bottom, top];
}

function fmtNum(v, decimals) {
  return Number(v.toFixed(decimals)).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Line chart. series: [{year, value}]. options: {unit, decimals, height}.
export function lineChart(series, options = {}) {
  const { unit = '', decimals = 1, height = 260 } = options;
  const width = 760;
  const padL = 56;
  const padR = 64;
  const padT = 18;
  const padB = 34;
  const values = series.map((p) => p.value);
  const [bottom, top] = zoomedRange(values);
  const span = top - bottom || 1;
  const x = (i) => padL + (i * (width - padL - padR)) / (series.length - 1);
  const y = (v) => padT + ((top - v) / span) * (height - padT - padB);
  const fmt = (v) => fmtNum(v, decimals) + unit;

  let grid = '';
  const steps = 4;
  for (let s = 0; s <= steps; s += 1) {
    const v = bottom + ((top - bottom) * s) / steps;
    const gy = y(v);
    grid += `<line x1="${padL}" y1="${gy}" x2="${width - padR}" y2="${gy}" stroke="${GRID}" stroke-width="1"/>`
      + `<text x="${padL - 8}" y="${gy + 4}" text-anchor="end" font-size="12" fill="${MUTED}">${fmt(v)}</text>`;
  }
  if (bottom < 0) {
    grid += `<line x1="${padL}" y1="${y(0)}" x2="${width - padR}" y2="${y(0)}" stroke="${INK}" stroke-width="1"/>`;
  }

  const points = series.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const last = series[series.length - 1];
  const labels = series
    .filter((p, i) => i % Math.ceil(series.length / 6) === 0 || i === series.length - 1)
    .map((p, i) => {
      const idx = series.indexOf(p);
      return `<text x="${x(idx)}" y="${height - 10}" text-anchor="middle" font-size="12" fill="${MUTED}">${p.year}</text>`;
    })
    .join('');

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Line chart, ${series[0].year} to ${last.year}" preserveAspectRatio="xMidYMid meet">
<title>Line chart ${series[0].year}–${last.year}</title>${grid}
<polyline points="${points}" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
${series.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.value)}" r="${i === series.length - 1 ? 5 : 3}" fill="${i === series.length - 1 ? RED : INK}"><title>${p.year}: ${fmt(p.value)}</title></circle>`).join('')}
<text x="${x(series.length - 1) + 8}" y="${y(last.value) + 4}" font-size="13" font-weight="700" fill="${RED}">${fmt(last.value)}</text>
${labels}</svg>`;
}

// Bar chart. series: [{year, value}]. Negative values draw below the zero line.
// options: {unit, decimals, height, signed} — signed prefixes + to positive
// values (for change series such as growth or inflation, not for levels).
export function barChart(series, options = {}) {
  const { unit = '', decimals = 1, height = 260, signed = false } = options;
  const width = 760;
  const padL = 56;
  const padR = 16;
  const padT = 18;
  const padB = 34;
  const values = series.map((p) => p.value);
  const top = niceMax(values);
  const bottom = niceMin(values);
  const span = top - bottom || 1;
  const y = (v) => padT + ((top - v) / span) * (height - padT - padB);
  const fmt = (v) => (signed && v > 0 ? '+' : '') + fmtNum(v, decimals) + unit;
  const slot = (width - padL - padR) / series.length;
  const barW = Math.min(64, slot * 0.62);

  let grid = '';
  const steps = 4;
  for (let s = 0; s <= steps; s += 1) {
    const v = bottom + ((top - bottom) * s) / steps;
    const gy = y(v);
    grid += `<line x1="${padL}" y1="${gy}" x2="${width - padR}" y2="${gy}" stroke="${GRID}" stroke-width="1"/>`
      + `<text x="${padL - 8}" y="${gy + 4}" text-anchor="end" font-size="12" fill="${MUTED}">${fmtNum(v, decimals)}${unit}</text>`;
  }

  const bars = series
    .map((p, i) => {
      const cx = padL + slot * i + slot / 2;
      const zero = y(0);
      const by = y(p.value);
      const rectY = Math.min(zero, by);
      const rectH = Math.max(2, Math.abs(zero - by));
      const isLast = i === series.length - 1;
      return `<rect x="${(cx - barW / 2).toFixed(1)}" y="${rectY.toFixed(1)}" width="${barW}" height="${rectH.toFixed(1)}" rx="3" fill="${isLast ? RED : INK}"><title>${p.year}: ${fmt(p.value)}</title></rect>`
        + `<text x="${cx}" y="${(p.value >= 0 ? by - 6 : by + rectH + 14).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="${INK}">${fmt(p.value)}</text>`
        + `<text x="${cx}" y="${height - 10}" text-anchor="middle" font-size="12" fill="${MUTED}">${p.year}</text>`;
    })
    .join('');

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Bar chart, ${series[0].year} to ${series[series.length - 1].year}" preserveAspectRatio="xMidYMid meet">
<title>Bar chart ${series[0].year}–${series[series.length - 1].year}</title>${grid}${bars}</svg>`;
}

// Horizontal bars for shares of a whole, e.g. age structure.
export function shareBars(rows, options = {}) {
  const { unit = '%', height = 170 } = options;
  const width = 760;
  const padL = 190;
  const padR = 70;
  const rowH = height / rows.length;
  const max = Math.max(...rows.map((r) => r.value));
  const bars = rows
    .map((r, i) => {
      const y = i * rowH + rowH * 0.22;
      const h = rowH * 0.56;
      const w = ((width - padL - padR) * r.value) / max;
      return `<text x="${padL - 12}" y="${y + h / 2 + 4}" text-anchor="end" font-size="13" fill="${INK}">${r.group}</text>`
        + `<rect x="${padL}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="3" fill="${i === rows.length - 1 ? RED : INK}"><title>${r.group}: ${r.value}${unit}</title></rect>`
        + `<text x="${padL + w + 8}" y="${y + h / 2 + 4}" font-size="13" font-weight="700" fill="${INK}">${r.value}${unit}</text>`;
    })
    .join('');
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Shares of population by age group" preserveAspectRatio="xMidYMid meet"><title>Age structure</title>${bars}</svg>`;
}
