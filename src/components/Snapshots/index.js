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
import { formatPercent } from '../../utils/format';

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
    // Aggregate across all assets
    if (symbol === 'ALL') {
      const byDate = new Map();
      for (const d of items) {
        if (d.currency !== currency) continue;
        if (!d.tradingDate) continue;
        const date = d.tradingDate.toISOString().slice(0, 10);
        const pct = Number(d.dayChangePercent);
        if (!Number.isFinite(pct)) continue;
        const prev = byDate.get(date) || { sum: 0, count: 0 };
        prev.sum += pct; // sum of daily % across symbols
        prev.count += 1;
        byDate.set(date, prev);
      }
      return Array.from(byDate.entries())
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([date, { sum }]) => ({
          date,
          closePrice: null,
          dayChangePercent: sum
        }));
    }
    // Single symbol series
    return items
      .filter((d) => d.currency === currency && d.symbol === symbol && d.tradingDate)
      .sort((a, b) => a.tradingDate - b.tradingDate)
      .map((d) => ({
        date: d.tradingDate.toISOString().slice(0, 10),
        closePrice: Number(d.closePrice),
        dayChangePercent: Number(d.dayChangePercent),
        currency: d.currency
      }));
  }, [items, symbol, currency]);

  // Determine if there are negatives to adjust domain and show zero line
  const hasNegative = useMemo(() => chartData.some(d => Number(d.dayChangePercent) < 0), [chartData]);
  const yRightDomain = hasNegative ? ["dataMin-5", "dataMax+5"] : [0, "dataMax+5"];
  const yLeftDomain = useMemo(() => (symbol !== 'ALL' ? [0, 'dataMax+5'] : undefined), [symbol]);

  // Build ticks only from existing data values (sampled to avoid clutter)
  const uniqueSorted = (arr) => Array.from(new Set(arr.filter((v) => Number.isFinite(v)))).sort((a, b) => a - b);
  const sampleTicks = (values, max = 8) => {
    const n = values.length;
    if (n <= max) return values;
    const step = (n - 1) / (max - 1);
    const picked = [];
    for (let i = 0; i < max; i++) {
      const idx = Math.round(i * step);
      picked.push(values[idx]);
    }
    return Array.from(new Set(picked));
  };

  const rightTicks = useMemo(() => {
    const vals = uniqueSorted([...chartData.map((d) => Number(d.dayChangePercent)), 0]);
    const sampled = sampleTicks(vals);
    return sampled.includes(0) ? sampled : uniqueSorted([...sampled, 0]);
  }, [chartData]);

  const leftTicks = useMemo(() => {
    if (symbol === 'ALL') return undefined;
    const vals = uniqueSorted([...chartData.map((d) => Number(d.closePrice)), 0]);
    const sampled = sampleTicks(vals);
    return sampled.includes(0) ? sampled : uniqueSorted([...sampled, 0]);
  }, [chartData, symbol]);

  // Reset selection when currency changes
  useEffect(() => {
    setSymbol('ALL');
    setClickedPoint(null);
  }, [currency]);

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
            return `${date} — ${formatPercent(Number(clickedPoint.dayChangePercent))}`;
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
              margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
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
              <YAxis yAxisId="left" orientation="left" stroke="var(--chart-price-line)" domain={yLeftDomain} ticks={leftTicks} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="var(--chart-quantity-line)"
                domain={yRightDomain}
                ticks={rightTicks}
                tickFormatter={(v) => formatPercent(Number(v))}
              />
              <Tooltip
                content={({ label, payload }) => {
                  if (!payload || payload.length === 0) return null;
                  const percentItem = payload.find(p => p.dataKey === 'dayChangePercent') || payload[0];
                  const dateLabel = typeof label === 'string' && label.length >= 10
                    ? `${label.slice(8, 10)}/${label.slice(5, 7)}`
                    : label;
                  return (
                    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 8, borderRadius: 6 }}>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{dateLabel}</div>
                      <div style={{ fontWeight: 600 }}>{formatPercent(Number(percentItem.value))}</div>
                    </div>
                  );
                }}
              />
              <Legend />
              {hasNegative && (
                <ReferenceLine y={0} yAxisId="right" />
              )}
              {symbol !== 'ALL' && (
                <ReferenceLine y={0} yAxisId="left" stroke="var(--color-border)" />
              )}
              {symbol !== 'ALL' && (
                <Line yAxisId="left" type="monotone" dataKey="closePrice" stroke="var(--chart-price-line)" name="Preço" dot={false} />
              )}
              <Line yAxisId="right" type="monotone" dataKey="dayChangePercent" stroke="var(--chart-quantity-line)" name="Variação %" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
