# 10 - ARIMA Forecast Service

## Overview

Add the server-side ARIMA code that the Prediction (spec 12) and Evaluation (spec 14) features use. No UI.

Uses the [`arima`](https://www.npmjs.com/package/arima) package (v0.2.8, ships its own `index.d.ts`). It is a WebAssembly build of the C `ctsa` library.

## Requirements

### 1. Dependency and config

- `npm i arima`
- Add `"arima"` to `serverExternalPackages` in `next.config.ts` so the bundler doesn't try to bundle the WebAssembly code. Check that the build works with the `--webpack` flag the project uses.

### 2. `src/lib/arima/series.ts`

- `loadSeries(locationId, irrigation)` → `{ years: number[]; values: number[] }`, ordered by year (`Decimal` → `number`).
- `validateSeries(series)` → `{ ok: true } | { ok: false; reason: string }`:
  - Fewer than `MIN_YEARS = 10` → "At least 10 years of data are needed"
  - A missing year between the first and last → "Missing data for 2015" (list the missing years)

### 3. `src/lib/arima/forecast.ts`

```ts
interface ArimaOrder { p: number; d: number; q: number }
interface ForecastPoint { year: number; value: number; lower: number; upper: number }

function forecast(values: number[], lastYear: number, order: ArimaOrder, horizon: number): ForecastPoint[]
```

- `new ARIMA({ ...order, verbose: false }).train(values)`, then `.predict(horizon)` → `[pred, errors]`
- `lower` / `upper` = `pred ± 1.96 · √errors[i]`. Clamp `lower` at 0, since production can't be negative.
- Throw a clear error if any prediction is `NaN` or not finite (the model failed to fit).

### 4. `src/lib/arima/metrics.ts`

`mae(actual, predicted)`, `rmse(actual, predicted)` and `mape(actual, predicted)`. MAPE skips years where the actual value is 0 and returns a percentage.

### 5. `src/lib/arima/outlook.ts`

- `OUTLOOK_THRESHOLD = 0.05`
- `getOutlook(historicalAvg, forecastAvg)` → `HIGH` if the forecast average is more than 5% above the historical average, `LOW` if more than 5% below, otherwise `MODERATE`.

All files import `server-only`.

## Out of Scope

- Choosing `p`, `d`, `q` automatically (`auto: true`)
- Storing results (specs 12 and 14)

## Acceptance Criteria

- [ ] A temporary script with a 20-year linear series returns 5 increasing forecasts with `lower ≤ value ≤ upper`; delete the script afterwards
- [ ] `validateSeries` flags fewer than 10 years and lists missing years
- [ ] `mae([1,2,3],[1,2,4])` = 0.333…, `rmse` = 0.577…, `mape` = 11.11…
- [ ] `npm run build` succeeds with `arima` in `serverExternalPackages`
- [ ] `npm run lint` passes

## References

- `arima` docs: constructor, `train`, `predict` (Context7, `/zemlyansky/arima`)
- [database-schema.md](../database-schema.md): ARIMA section
