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
import { formatPercent, formatNumber, formatCurrency } from '../../utils/format';

const normalizeCurrency = (value) => (value ?? '').trim().toUpperCase();

const parseNumeric = (value) => {
  if (value === null || value === undefined) return NaN;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().replace(/\s+/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  return NaN;
};

const normalizePercentUnits = (value) => {
  const numeric = parseNumeric(value);
  if (!Number.isFinite(numeric)) return NaN;
  if (Math.abs(numeric) <= 1) {
    return numeric * 100;
  }
  return numeric;
};

const normalizePercentDecimal = (value) => {
  const numeric = parseNumeric(value);
  if (!Number.isFinite(numeric)) return NaN;
  if (Math.abs(numeric) > 1) {
    return numeric / 100;
  }
  return numeric;
};

const deriveTotalValue = (snapshot) => {
  if (!snapshot || typeof snapshot !== 'object') return NaN;

  const candidateKeys = [
    'totalValue',
    'total_value',
    'total',
    'marketValue',
    'market_value',
    'positionValue',
    'position_value',
    'positionValueBRL',
    'position_value_brl',
    'positionValueUSD',
    'position_value_usd',
    'currentValue',
    'current_value',
    'portfolioValue',
    'portfolio_value',
    'totalInvested',
    'total_invested',
    'totalValueBRL',
    'total_value_brl',
    'totalValueUSD',
    'total_value_usd',
    'value',
    'grossValue',
    'netValue'
  ];

  for (const key of candidateKeys) {
    const numeric = parseNumeric(snapshot?.[key]);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  const resolveCandidate = (keys) => {
    for (const key of keys) {
      const numeric = parseNumeric(snapshot?.[key]);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
    return NaN;
  };

  const quantity = resolveCandidate([
    'quantity',
    'totalQuantity',
    'stocksQuantity',
    'qty',
    'amount',
    'position',
    'shares',
    'totalAmount'
  ]);

  const averagePrice = resolveCandidate([
    'averagePrice',
    'average_price',
    'avgPrice',
    'avg_price',
    'priceAverage',
    'meanPrice',
    'mediumPrice',
    'averageCost',
    'average_cost',
    'costBasis',
    'cost_basis'
  ]);

  const dayChangeValue = resolveCandidate([
    'dayChangeValue',
    'day_change_value',
    'dayChange',
    'day_change',
    'dayChangeAmount',
    'day_change_amount',
    'dailyChangeValue',
    'daily_change_value',
    'dailyVariationValue',
    'daily_variation_value',
    'dailyGain',
    'daily_gain',
    'dailyResult',
    'daily_result',
    'variationValue',
    'variation_value',
    'appreciationValue',
    'appreciation_value'
  ]);

  const dayChangePercentRaw = resolveCandidate([
    'dayChangePercent',
    'day_change_percent',
    'dailyVariationPercent',
    'daily_variation_percent',
    'variationPercent',
    'variation_percent',
    'dailyReturnPercent',
    'daily_return_percent'
  ]);

  if (Number.isFinite(quantity) && Number.isFinite(averagePrice)) {
    const base = quantity * averagePrice;
    if (Number.isFinite(dayChangeValue)) {
      return base + dayChangeValue;
    }
    if (Number.isFinite(dayChangePercentRaw)) {
      const percent = Math.abs(dayChangePercentRaw) > 1 ? dayChangePercentRaw / 100 : dayChangePercentRaw;
      return base + (base * percent);
    }
  }

  const price = parseNumeric(snapshot?.closePrice);
  if (Number.isFinite(price) && Number.isFinite(quantity)) {
    return price * quantity;
  }

  return NaN;
};

const deriveDailyChangeValue = (snapshot) => {
  if (!snapshot || typeof snapshot !== 'object') return NaN;

  const changeKeys = [
    'dayChange',
    'day_change',
    'dayChangeValue',
    'day_change_value',
    'dayChangeAmount',
    'day_change_amount',
    'dailyChangeValue',
    'daily_change_value',
    'dailyVariationValue',
    'daily_variation_value',
    'dailyGain',
    'daily_gain',
    'dailyResult',
    'daily_result',
    'variationValue',
    'variation_value',
    'appreciationValue',
    'appreciation_value'
  ];

  for (const key of changeKeys) {
    const numeric = parseNumeric(snapshot?.[key]);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  const percentKeys = [
    'dayChangePercent',
    'day_change_percent',
    'dailyVariationPercent',
    'daily_variation_percent',
    'variationPercent',
    'variation_percent',
    'dailyReturnPercent',
    'daily_return_percent'
  ];

  const baseKeys = [
    'positionValue',
    'position_value',
    'totalValue',
    'total_value',
    'marketValue',
    'market_value',
    'currentValue',
    'current_value',
    'portfolioValue',
    'portfolio_value',
    'totalValueBRL',
    'total_value_brl',
    'totalValueUSD',
    'total_value_usd'
  ];

  const percent = percentKeys
    .map((key) => parseNumeric(snapshot?.[key]))
    .find((value) => Number.isFinite(value));

  if (Number.isFinite(percent)) {
    const baseCandidate = baseKeys
      .map((key) => parseNumeric(snapshot?.[key]))
      .find((value) => Number.isFinite(value));
    if (Number.isFinite(baseCandidate)) {
      const normalizedPercent = Math.abs(percent) > 1 ? percent / 100 : percent;
      return baseCandidate * normalizedPercent;
    }
  }

  const quantity = parseNumeric(snapshot?.quantity ?? snapshot?.stocksQuantity ?? snapshot?.totalQuantity);
  const priceChange = parseNumeric(snapshot?.priceChange ?? snapshot?.dayPriceChange);
  if (Number.isFinite(quantity) && Number.isFinite(priceChange)) {
    return quantity * priceChange;
  }

  return NaN;
};

const currencyColorMap = {
  BRL: 'var(--chart-quantity-line)',
  USD: 'var(--chart-price-line)'
};

const fallbackLineColors = [
  '#ffd166',
  '#06d6a0',
  '#118ab2',
  '#ef476f',
  '#8338ec'
];

const CurrencyMode = {
  ALL: 'ALL',
  BRL: 'BRL',
  USD: 'USD'
};

/**
 * Snapshots chart
 * - Fetches /auth/snapshots and allows selecting a symbol to plot closePrice and dayChangePercent over time
 */
export default function Snapshots({ userId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [currency, setCurrency] = useState(CurrencyMode.BRL);
  const [range] = useState('30d'); // future use
  const [clickedPoint, setClickedPoint] = useState(null);
  const [tooltipEnabled, setTooltipEnabled] = useState(false);

  const availableCurrencies = useMemo(() => {
    const set = new Set();
    for (const item of items) {
      const normalized = normalizeCurrency(item?.currency);
      if (normalized && normalized !== 'ALL') {
        set.add(normalized);
      }
    }
    return Array.from(set).sort();
  }, [items]);

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
    if (currency === CurrencyMode.ALL) {
      return [];
    }
    const normalizedCurrency = normalizeCurrency(currency);
    const filtered = items.filter((d) => normalizeCurrency(d.currency) === normalizedCurrency);
    return Array.from(new Set(filtered.map((d) => d.symbol).filter(Boolean))).sort();
  }, [items, currency]);

  const symbolsWithAll = useMemo(() => ['ALL', ...symbols], [symbols]);

  const chartData = useMemo(() => {
    if (!symbol) return [];

    const ensureIsoDate = (date) => {
      if (!date) return null;
      if (date instanceof Date) {
        if (Number.isNaN(date.getTime())) return null;
        return date.toISOString().slice(0, 10);
      }
      const parsed = new Date(date);
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
    };

    if (currency === CurrencyMode.ALL) {
      const currencyKeys = availableCurrencies;
      if (currencyKeys.length === 0) {
        return [];
      }
      const byDate = new Map();
      for (const snapshot of items) {
        const date = ensureIsoDate(snapshot?.tradingDate);
        if (!date) continue;
        const pctDecimal = normalizePercentDecimal(snapshot?.dayChangePercent);
        if (!Number.isFinite(pctDecimal)) continue;
        const currencyKey = normalizeCurrency(snapshot?.currency);
        if (!currencyKey) continue;
        const entry = byDate.get(date) || new Map();
        const stats = entry.get(currencyKey) || { sumDecimal: 0, count: 0 };
        stats.sumDecimal += pctDecimal;
        stats.count += 1;
        entry.set(currencyKey, stats);
        byDate.set(date, entry);
      }

      return Array.from(byDate.entries())
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([date, currencyMap]) => {
          const base = { date, totalValue: null };
          currencyKeys.forEach((currencyKey) => {
            const stats = currencyMap.get(currencyKey);
            base[`dayChangePercent_${currencyKey}`] = stats && stats.count > 0 ? (stats.sumDecimal / stats.count) * 100 : null;
          });
          return base;
        });
    }

    const normalizedCurrency = normalizeCurrency(currency);
    if (symbol === 'ALL') {
      const byDate = new Map();
      for (const snapshot of items) {
        if (normalizeCurrency(snapshot?.currency) !== normalizedCurrency) continue;
        const date = ensureIsoDate(snapshot?.tradingDate);
        if (!date) continue;
        const pctDecimal = normalizePercentDecimal(snapshot?.dayChangePercent);
        const totalValue = deriveTotalValue(snapshot);
        const dayChange = deriveDailyChangeValue(snapshot);
        const prev = byDate.get(date) || {
          sumDecimal: 0,
          count: 0,
          totalValueSum: 0,
          hasTotal: false,
          dailyChangeSum: 0,
          hasDailyChange: false
        };
        if (Number.isFinite(pctDecimal)) {
          prev.sumDecimal += pctDecimal;
          prev.count += 1;
        }
        if (Number.isFinite(totalValue)) {
          prev.totalValueSum += totalValue;
          prev.hasTotal = true;
        }
        if (Number.isFinite(dayChange)) {
          prev.dailyChangeSum += dayChange;
          prev.hasDailyChange = true;
        }
        byDate.set(date, prev);
      }

      const rows = Array.from(byDate.entries())
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([date, { sumDecimal = 0, count, totalValueSum, hasTotal, dailyChangeSum, hasDailyChange }]) => {
          const avgDecimal = count > 0 ? sumDecimal / count : null;
          return {
            date,
            closePrice: null,
            dayChangePercentOriginal: Number.isFinite(avgDecimal) ? avgDecimal * 100 : null,
            dayChangePercentDecimal: Number.isFinite(avgDecimal) ? avgDecimal : null,
            totalValueAbsolute: hasTotal ? totalValueSum : null,
            dailyChangeFallback: hasDailyChange ? dailyChangeSum : null,
            currency: normalizedCurrency
          };
        });

      let prevAbsolute = null;
      return rows.map((row) => {
        let absolute = Number.isFinite(row.totalValueAbsolute) ? row.totalValueAbsolute : null;
        if (!Number.isFinite(absolute) && Number.isFinite(prevAbsolute) && Number.isFinite(row.dailyChangeFallback)) {
          absolute = prevAbsolute + row.dailyChangeFallback;
        }

        let dailyChange = null;
        if (Number.isFinite(absolute) && Number.isFinite(prevAbsolute)) {
          dailyChange = absolute - prevAbsolute;
        }
        if (!Number.isFinite(dailyChange) && Number.isFinite(row.dailyChangeFallback)) {
          dailyChange = row.dailyChangeFallback;
        }
        if (!Number.isFinite(dailyChange) && Number.isFinite(row.dayChangePercentDecimal) && Number.isFinite(prevAbsolute)) {
          dailyChange = prevAbsolute * row.dayChangePercentDecimal;
        }

        let percent = null;
        if (Number.isFinite(dailyChange) && Number.isFinite(prevAbsolute) && prevAbsolute !== 0) {
          percent = (dailyChange / prevAbsolute) * 100;
        } else if (Number.isFinite(row.dayChangePercentOriginal)) {
          percent = row.dayChangePercentOriginal;
        }

        if (Number.isFinite(absolute)) {
          prevAbsolute = absolute;
        } else if (Number.isFinite(prevAbsolute) && Number.isFinite(dailyChange)) {
          const inferred = prevAbsolute + dailyChange;
          if (Number.isFinite(inferred)) {
            prevAbsolute = inferred;
            absolute = inferred;
          }
        }

        return {
          date: row.date,
          closePrice: row.closePrice,
          dayChangePercent: Number.isFinite(percent)
            ? percent
            : (Number.isFinite(row.dayChangePercentOriginal) ? row.dayChangePercentOriginal : null),
          totalValue: Number.isFinite(absolute) ? absolute : null,
          dailyChange: Number.isFinite(dailyChange) ? dailyChange : null,
          currency: row.currency
        };
      });
    }

    const rows = items
      .filter((snapshot) => {
        if (!snapshot?.tradingDate) return false;
        return normalizeCurrency(snapshot?.currency) === normalizedCurrency && snapshot.symbol === symbol;
      })
      .sort((a, b) => a.tradingDate - b.tradingDate)
      .map((snapshot) => {
        const absoluteTotal = (() => {
          const value = deriveTotalValue(snapshot);
          return Number.isFinite(value) ? value : null;
        })();
        const dailyChange = (() => {
          const value = deriveDailyChangeValue(snapshot);
          return Number.isFinite(value) ? value : null;
        })();
        return {
          date: ensureIsoDate(snapshot.tradingDate),
          closePrice: (() => {
            const value = parseNumeric(snapshot?.closePrice);
            return Number.isFinite(value) ? value : null;
          })(),
          dayChangePercentOriginal: (() => {
            const value = normalizePercentUnits(snapshot?.dayChangePercent);
            return Number.isFinite(value) ? value : null;
          })(),
          dayChangePercentDecimal: (() => {
            const value = normalizePercentDecimal(snapshot?.dayChangePercent);
            return Number.isFinite(value) ? value : null;
          })(),
          currency: snapshot.currency,
          totalValueAbsolute: absoluteTotal,
          dailyChangeFallback: dailyChange
        };
      });

    let prevAbsolute = null;
    return rows.map((row) => {
      let absolute = Number.isFinite(row.totalValueAbsolute) ? row.totalValueAbsolute : null;
      if (!Number.isFinite(absolute) && Number.isFinite(prevAbsolute) && Number.isFinite(row.dailyChangeFallback)) {
        absolute = prevAbsolute + row.dailyChangeFallback;
      }

      let dailyChange = null;
      if (Number.isFinite(absolute) && Number.isFinite(prevAbsolute)) {
        dailyChange = absolute - prevAbsolute;
      }
      if (!Number.isFinite(dailyChange) && Number.isFinite(row.dailyChangeFallback)) {
        dailyChange = row.dailyChangeFallback;
      }
      if (!Number.isFinite(dailyChange) && Number.isFinite(row.dayChangePercentDecimal) && Number.isFinite(prevAbsolute)) {
        dailyChange = prevAbsolute * row.dayChangePercentDecimal;
      }

      let percent = null;
      if (Number.isFinite(dailyChange) && Number.isFinite(prevAbsolute) && prevAbsolute !== 0) {
        percent = (dailyChange / prevAbsolute) * 100;
      } else if (Number.isFinite(row.dayChangePercentOriginal)) {
        percent = row.dayChangePercentOriginal;
      }

      if (Number.isFinite(absolute)) {
        prevAbsolute = absolute;
      } else if (Number.isFinite(prevAbsolute) && Number.isFinite(dailyChange)) {
        const inferred = prevAbsolute + dailyChange;
        if (Number.isFinite(inferred)) {
          prevAbsolute = inferred;
          absolute = inferred;
        }
      }

      return {
        date: row.date,
        closePrice: row.closePrice,
        dayChangePercent: Number.isFinite(percent)
          ? percent
          : (Number.isFinite(row.dayChangePercentOriginal) ? row.dayChangePercentOriginal : null),
        currency: row.currency,
        totalValue: Number.isFinite(absolute) ? absolute : null,
        dailyChange: Number.isFinite(dailyChange) ? dailyChange : null
      };
    });
  }, [items, symbol, currency, availableCurrencies]);

  const hasRenderablePoints = useMemo(() => {
    for (const row of chartData) {
      if (!row || typeof row !== 'object') continue;
      for (const [key, rawValue] of Object.entries(row)) {
        if (key === 'closePrice' || key === 'dayChangePercent' || key.startsWith('dayChangePercent_')) {
          const value = Number(rawValue);
          if (Number.isFinite(value)) {
            return true;
          }
        }
      }
    }
    return false;
  }, [chartData]);

  const shouldShowChart = hasRenderablePoints;

  // Utility: compare floating numbers with tolerance
  function approxEq(a, b, eps = 1e-6) {
    return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < eps;
  }

  const percentSeriesKeys = useMemo(() => {
    if (currency === 'ALL') {
      return availableCurrencies.map((code) => `dayChangePercent_${code}`);
    }
    return ['dayChangePercent'];
  }, [currency, availableCurrencies]);

  const percentSeriesValues = useMemo(() => {
    const values = [];
    for (const row of chartData) {
      for (const key of percentSeriesKeys) {
        const value = Number(row?.[key]);
        if (Number.isFinite(value)) {
          values.push(value);
        }
      }
    }
    return values;
  }, [chartData, percentSeriesKeys]);

  // Determine min/max for right axis (percent)
  const rightMinMax = useMemo(() => {
    if (percentSeriesValues.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...percentSeriesValues),
      max: Math.max(...percentSeriesValues)
    };
  }, [percentSeriesValues]);
  const yRightDomain = useMemo(() => {
    const span = rightMinMax.max - rightMinMax.min;
    const dynamicPad = span < 2 ? 3 : span < 5 ? 2 : 1;
    const pad = dynamicPad;
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
    if (percentSeriesValues.length === 0) return [0];
    const min = Math.min(...percentSeriesValues);
    const max = Math.max(...percentSeriesValues);
    const span = max - min;
    const extra = span < 2 ? 3 : span < 5 ? 2 : 1;
    const paddedMin = Math.min(min, 0) - extra;
    const paddedMax = Math.max(max, 0) + extra;
    return uniqueSorted([paddedMin, 0, paddedMax]);
  }, [percentSeriesValues]);

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
    setTooltipEnabled(false);
  }, [currency]);

  useEffect(() => {
    setClickedPoint(null);
    setTooltipEnabled(false);
  }, [symbol]);

  const activeCurrencyLabels = useMemo(() => (
    currency === CurrencyMode.ALL ? availableCurrencies : [currency]
  ), [currency, availableCurrencies]);

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
              <option value={CurrencyMode.ALL}>ALL</option>
              <option value={CurrencyMode.BRL}>BRL</option>
              <option value={CurrencyMode.USD}>USD</option>
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
            const valueEntries = activeCurrencyLabels.map((label) => {
              const key = currency === CurrencyMode.ALL ? `dayChangePercent_${label}` : 'dayChangePercent';
              return {
                label,
                value: Number(clickedPoint.values?.[key])
              };
            });
            const validEntries = valueEntries.filter((entry) => Number.isFinite(entry.value));
            const totalValueDisplay = (
              currency !== CurrencyMode.ALL
              && Number.isFinite(clickedPoint?.totalValue)
              && formatCurrency(
                clickedPoint.totalValue,
                clickedPoint.currency || normalizeCurrency(currency)
              )
            );
            const dailyChangeDisplay = (
              currency !== CurrencyMode.ALL
              && Number.isFinite(clickedPoint?.dailyChange)
              && formatCurrency(
                clickedPoint.dailyChange,
                clickedPoint.currency || normalizeCurrency(currency)
              )
            );
            if (validEntries.length === 0) {
              return (
                <>
                  {date}
                  {totalValueDisplay ? (
                    <>
                      <span style={{ color: '#ffffff' }}>Valor total: {totalValueDisplay}</span>
                    </>
                  ) : null}
                  {dailyChangeDisplay ? (
                    <>
                      <span style={{ color: clickedPoint.dailyChange < 0 ? '#ff4d4f' : '#06d6a0' }}>
                        Variação diária: {dailyChangeDisplay}
                      </span>
                    </>
                  ) : null}
                </>
              );
            }
            return (
              <>
              <div>
                {date} — {validEntries.map((entry, index) => {
                  const color = entry.value < 0 ? '#ff4d4f' : '#ffffff';
                  return (
                    <span key={entry.label} style={{ color }}>
                      {entry.label}: {formatPercent(entry.value)}
                      {index < validEntries.length - 1 ? ' • ' : ''}
                    </span>
                  );
                })}
              </div>
                
                {totalValueDisplay && (
                  <>
                    <span style={{ color: '#ffffff' }}>Valor total: {totalValueDisplay}</span>
                  </>
                )}
                {dailyChangeDisplay && (
                  <>
                    <span style={{ color: clickedPoint.dailyChange < 0 ? '#ff4d4f' : '#06d6a0' }}>
                      Variação diária: {dailyChangeDisplay}
                    </span>
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}
      {!loading && !error && !shouldShowChart && (
        <div className="snap-status">Sem dados</div>
      )}

      {shouldShowChart && (
        <div className="chart-container">
              <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={chartData}
                  margin={{ top: 28, right: 30, left: 10, bottom: 28 }}
              onMouseDown={(e) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                  setTooltipEnabled(true);
                }
              }}
              onMouseLeave={() => {
                setTooltipEnabled(false);
              }}
              onMouseUp={() => {
                setTooltipEnabled(false);
              }}
              onClick={(e) => {
                if (e && Array.isArray(e.activePayload) && e.activePayload.length > 0) {
                  const values = e.activePayload.reduce((acc, item) => {
                    const val = Number(item?.value);
                    if (Number.isFinite(val) && item?.dataKey) {
                      acc[item.dataKey] = val;
                    }
                    return acc;
                  }, {});
                  const date = e.activeLabel ?? e.activePayload[0]?.payload?.date;
                  const firstPayload = e.activePayload[0]?.payload;
                  const totalValueFromPayload = Number(firstPayload?.totalValue);
                  const computedTotal = Number.isFinite(totalValueFromPayload)
                    ? totalValueFromPayload
                    : deriveTotalValue(firstPayload);
                  const dailyChangeFromPayload = Number(firstPayload?.dailyChange);
                  const computedDailyChange = Number.isFinite(dailyChangeFromPayload)
                    ? dailyChangeFromPayload
                    : deriveDailyChangeValue(firstPayload);
                  const payloadCurrency = normalizeCurrency(firstPayload?.currency);
                  setClickedPoint({
                    date,
                    values,
                    totalValue: Number.isFinite(computedTotal) ? computedTotal : null,
                    dailyChange: Number.isFinite(computedDailyChange) ? computedDailyChange : null,
                    currency: payloadCurrency && payloadCurrency !== 'ALL' ? payloadCurrency : normalizeCurrency(currency)
                  });
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
                  if (!tooltipEnabled) return null;
                  if (!payload || payload.length === 0) return null;
                  const dateLabel = typeof label === 'string' && label.length >= 10
                    ? `${label.slice(8, 10)}/${label.slice(5, 7)}`
                    : label;
                  const items = payload
                    .map((item, index) => {
                      const value = Number(item?.value);
                      if (!Number.isFinite(value)) return null;
                      return {
                        key: item?.dataKey || item?.name || `series-${index}`,
                        label: item?.name || item?.dataKey,
                        value,
                        color: item?.color
                      };
                    })
                    .filter(Boolean);
                  if (items.length === 0) return null;
                  const totalValueFromPayload = Number(payload?.[0]?.payload?.totalValue);
                  const totalValue = Number.isFinite(totalValueFromPayload)
                    ? totalValueFromPayload
                    : deriveTotalValue(payload?.[0]?.payload);
                  const dailyChangeFromPayload = Number(payload?.[0]?.payload?.dailyChange);
                  const dailyChangeValue = Number.isFinite(dailyChangeFromPayload)
                    ? dailyChangeFromPayload
                    : deriveDailyChangeValue(payload?.[0]?.payload);
                  const payloadCurrency = normalizeCurrency(payload?.[0]?.payload?.currency);
                  const effectiveCurrency = (payloadCurrency && payloadCurrency !== 'ALL')
                    ? payloadCurrency
                    : normalizeCurrency(currency);
                  return (
                    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 8, borderRadius: 6 }}>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{dateLabel}</div>
                      {items.map((item) => {
                        const color = item.value < 0 ? '#ff4d4f' : item.color || '#ffffff';
                        return (
                          <div key={item.key} style={{ fontWeight: 600, color }}>
                            {item.label}: {formatPercent(item.value)}
                          </div>
                        );
                      })}
                      
                      {currency !== CurrencyMode.ALL && Number.isFinite(totalValue) && (
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                          Valor total: {formatCurrency(totalValue, effectiveCurrency)}
                        </div>
                      )}
                      {currency !== CurrencyMode.ALL && Number.isFinite(dailyChangeValue) && (
                        <div style={{ fontSize: 12, color: dailyChangeValue < 0 ? '#ff4d4f' : '#06d6a0' }}>
                          Variação diária: {formatCurrency(dailyChangeValue, effectiveCurrency)}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Legend />
              <ReferenceLine y={0} yAxisId="right" stroke="var(--color-border)" />
              {symbol !== 'ALL' && leftMinMax.min < 0 && leftMinMax.max > 0 && (
                <ReferenceLine y={0} yAxisId="left" stroke="var(--color-border)" />
              )}
              {(currency === CurrencyMode.BRL || currency === CurrencyMode.USD) && symbol !== 'ALL' && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="closePrice"
                  stroke="var(--chart-price-line)"
                  name={`Preço (${currency})`}
                  dot={chartData.length <= 1}
                  connectNulls
                />
              )}
              {currency === CurrencyMode.ALL
                ? availableCurrencies.map((code, index) => {
                    const dataKey = `dayChangePercent_${code}`;
                    const stroke = currencyColorMap[code] || fallbackLineColors[index % fallbackLineColors.length];
                    return (
                      <Line
                        key={dataKey}
                        yAxisId="right"
                        type="monotone"
                        dataKey={dataKey}
                        stroke={stroke}
                        name={`Variação % (${code})`}
                        dot={chartData.length <= 1}
                        connectNulls
                      />
                    );
                  })
                : (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="dayChangePercent"
                    stroke="var(--chart-quantity-line)"
                    name="Variação %"
                    dot={chartData.length <= 1}
                    connectNulls
                  />
                )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
