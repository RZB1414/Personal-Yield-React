import React, { useEffect, useMemo, useState } from 'react';
import './Snapshots.css';
import { getSnapshots } from '../../services/snapshots';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { ReferenceLine } from 'recharts';
import { formatPercent, formatNumber } from '../../utils/format';

/**
 * Snapshots chart
 * - Fetches /auth/snapshots and allows selecting a symbol to plot closePrice and dayChangePercent over time
 */
export default function Snapshots({ userId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [range] = useState('30d'); // future use
  const [clickedPoint, setClickedPoint] = useState(null);

  useEffect(() => {
    async function load() {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        // default last 30d from backend behavior
        const data = await getSnapshots({ userId });
        const list = Array.isArray(data?.items) ? data.items : [];
        // ensure tradingDate is Date
        const normalized = list.map((d) => ({
          ...d,
          tradingDate: d.tradingDate ? new Date(d.tradingDate) : null
        }));
        setItems(normalized);
        // default selection: ALL aggregated
        setSymbol('ALL');
      } catch (e) {
        setError('Erro ao carregar snapshots');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId, range]);

  const symbols = useMemo(() => {
    const filtered = items.filter((d) => d.currency === currency);
    return Array.from(new Set(filtered.map((d) => d.symbol).filter(Boolean))).sort();
  }, [items, currency]);

  const symbolsWithAll = useMemo(() => ['ALL', ...symbols], [symbols]);

  const chartData = useMemo(() => {
    if (!symbol) return [];
    const parseNumber = (value) => {
      if (value === null || value === undefined) return NaN;
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : NaN;
      }
      if (typeof value === 'string') {
        const normalized = value
          .trim()
          .replace(/\s+/g, '')
          .replace(/\./g, '')
          .replace(',', '.');
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : NaN;
      }
      return NaN;
    };
    // Aggregate across all assets
    if (symbol === 'ALL') {
      const byDate = new Map();
      for (const d of items) {
        if (d.currency !== currency) continue;
        if (!d.tradingDate) continue;
        const date = d.tradingDate.toISOString().slice(0, 10);
        const pct = parseNumber(d.dayChangePercent);
        if (!Number.isFinite(pct)) continue;
        const prev = byDate.get(date) || { sum: 0, count: 0 };
        prev.sum += pct; // sum of daily % across symbols
        prev.count += 1;
        byDate.set(date, prev);
      }
      return Array.from(byDate.entries())
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([date, { sum, count }]) => ({
          date,
          closePrice: null,
          dayChangePercent: count > 0 ? sum / count : null
        }));
    }
    // Single symbol series
    return items
      .filter((d) => d.currency === currency && d.symbol === symbol && d.tradingDate)
      .sort((a, b) => a.tradingDate - b.tradingDate)
      .map((d) => ({
        date: d.tradingDate.toISOString().slice(0, 10),
        closePrice: (() => {
          const value = parseNumber(d.closePrice);
          return Number.isFinite(value) ? value : null;
        })(),
        dayChangePercent: (() => {
          const value = parseNumber(d.dayChangePercent);
          return Number.isFinite(value) ? value : null;
        })(),
        currency: d.currency
      }));
  }, [items, symbol, currency]);

  // Utility: compare floating numbers with tolerance
  function approxEq(a, b, eps = 1e-6) {
    return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < eps;
  }

  // Determine min/max for right axis (percent)
  const rightMinMax = useMemo(() => {
    const vals = chartData.map(d => Number(d.dayChangePercent)).filter(Number.isFinite);
    if (vals.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [chartData]);
  const yRightDomain = useMemo(() => {
    const pad = 1; // small padding to avoid clipping
    let minBound = Math.min(rightMinMax.min, 0) - pad;
    let maxBound = Math.max(rightMinMax.max, 0) + pad;
    if (approxEq(maxBound, minBound)) {
      // ensure a visible span
      maxBound = minBound + 2 * pad;
    }
    return [minBound, maxBound];
  }, [rightMinMax]);
  const leftMinMax = useMemo(() => {
    if (symbol === 'ALL') return { min: 0, max: 0 };
    const vals = chartData.map(d => Number(d.closePrice)).filter(Number.isFinite);
    if (vals.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [chartData, symbol]);
  const yLeftDomain = useMemo(() => {
    if (symbol === 'ALL') return undefined;
    const pad = 1;
    let minBound = leftMinMax.min - pad;
    let maxBound = leftMinMax.max + pad;
    if (approxEq(maxBound, minBound)) {
      maxBound = minBound + 2 * pad;
    }
    return [minBound, maxBound];
  }, [leftMinMax, symbol]);

  // Build ticks: show only [min, 0, max]
  const uniqueSorted = (arr) => Array.from(new Set(arr.filter((v) => Number.isFinite(v)))).sort((a, b) => a - b);

  const rightTicks = useMemo(() => {
    const vals = chartData.map((d) => Number(d.dayChangePercent)).filter(Number.isFinite);
    if (vals.length === 0) return [0];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return uniqueSorted([min, 0, max]);
  }, [chartData]);

  const leftTicks = useMemo(() => {
    if (symbol === 'ALL') return undefined;
    const vals = chartData.map((d) => Number(d.closePrice)).filter(Number.isFinite);
    if (vals.length === 0) return undefined;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    // Include 0 only if the data crosses zero; otherwise just [min, max]
    if (min < 0 && max > 0) {
      return uniqueSorted([min, 0, max]);
    }
    return uniqueSorted([min, max]);
  }, [chartData, symbol]);

  // Reset selection when currency changes
  useEffect(() => {
    setSymbol('ALL');
    setClickedPoint(null);
  }, [currency]);

  // Custom Y-axis ticks with color: white for >= 0, red for < 0

  const LeftAxisTick = React.useCallback((props) => {
    const { x, y, payload } = props;
    const v = Number(payload?.value);
    const color = Number.isFinite(v) && v < 0 ? '#ff4d4f' : '#ffffff';
    const isMin = approxEq(v, leftMinMax.min);
    const isMax = approxEq(v, leftMinMax.max);
    const dy = isMax ? 8 : isMin ? -2 : 4;
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={dy} dx={-4} textAnchor="end" fill={color}>
          {Number.isFinite(v) ? formatNumber(v) : payload?.value}
        </text>
      </g>
    );
  }, [leftMinMax]);

  const RightAxisTick = React.useCallback((props) => {
    const { x, y, payload } = props;
    const v = Number(payload?.value);
    const color = Number.isFinite(v) && v < 0 ? '#ff4d4f' : '#ffffff';
    const isMin = approxEq(v, rightMinMax.min);
    const isMax = approxEq(v, rightMinMax.max);
    const dy = isMax ? 8 : isMin ? -2 : 4;
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={dy} dx={4} textAnchor="start" fill={color}>
          {formatPercent(v)}
        </text>
      </g>
    );
  }, [rightMinMax]);

  return (
    <div className="snapshots-wrapper">
      <div className="snapshots-header">
        <h3>Total Gain</h3>
        <div className="snapshots-controls">
          <label>
            Currency:
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="BRL">BRL</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label style={{ marginLeft: 8 }}>
            Stock:
            <select value={symbol} onChange={(e) => setSymbol(e.target.value) }>
              {symbolsWithAll.map((s) => (
                <option key={s} value={s}>
                  {s.replace('.SA', '')}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading && <div className="snap-status">Carregando...</div>}
      {error && <div className="snap-error">{error}</div>}
      {clickedPoint && (
        <div className="snap-status">
          {(() => {
            const date = typeof clickedPoint.date === 'string' && clickedPoint.date.length >= 10
              ? `${clickedPoint.date.slice(8, 10)}/${clickedPoint.date.slice(5, 7)}`
              : clickedPoint.date;
            const v = Number(clickedPoint.dayChangePercent);
            const color = Number.isFinite(v) && v < 0 ? '#ff4d4f' : '#ffffff';
            return (
              <>
                {date} — <span style={{ color }}>{formatPercent(v)}</span>
              </>
            );
          })()}
        </div>
      )}
      {!loading && !error && chartData.length === 0 && (
        <div className="snap-status">Sem dados</div>
      )}

      {chartData.length > 0 && (
        <div className="chart-container">
              <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={chartData}
                  margin={{ top: 28, right: 30, left: 10, bottom: 28 }}
              onClick={(e) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                  setClickedPoint(e.activePayload[0].payload);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) =>
                  typeof v === 'string' && v.length >= 10
                    ? `${v.slice(8, 10)}/${v.slice(5, 7)}`
                    : v
                }
              />
              <YAxis yAxisId="left" orientation="left" stroke="var(--chart-price-line)" domain={yLeftDomain} ticks={leftTicks} tick={<LeftAxisTick />} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="var(--chart-quantity-line)"
                domain={yRightDomain}
                ticks={rightTicks}
                tick={<RightAxisTick />}
              />
              <Tooltip
                wrapperStyle={{ marginTop: -84 }}
                content={({ label, payload }) => {
                  if (!payload || payload.length === 0) return null;
                  const percentItem = payload.find(p => p.dataKey === 'dayChangePercent') || payload[0];
                  const dateLabel = typeof label === 'string' && label.length >= 10
                    ? `${label.slice(8, 10)}/${label.slice(5, 7)}`
                    : label;
                  const v = Number(percentItem.value);
                  const color = Number.isFinite(v) && v < 0 ? '#ff4d4f' : '#ffffff';
                  return (
                    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 8, borderRadius: 6 }}>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{dateLabel}</div>
                      <div style={{ fontWeight: 600, color }}>{formatPercent(v)}</div>
                    </div>
                  );
                }}
              />
              <Legend />
              <ReferenceLine y={0} yAxisId="right" stroke="var(--color-border)" />
              {symbol !== 'ALL' && leftMinMax.min < 0 && leftMinMax.max > 0 && (
                <ReferenceLine y={0} yAxisId="left" stroke="var(--color-border)" />
              )}
              {symbol !== 'ALL' && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="closePrice"
                  stroke="var(--chart-price-line)"
                  name={`Preço (${currency})`}
                  dot={false}
                />
              )}
              <Line yAxisId="right" type="monotone" dataKey="dayChangePercent" stroke="var(--chart-quantity-line)" name="Variação %" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
