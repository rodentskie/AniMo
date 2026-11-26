# 09 - Historical Production Chart

## Overview

Add the **Historical Rice Production** line chart to `/data` (right column), as on the Data / Overview screen of [context-1.jpg](../screenshots/context-1.jpg): production (MT) per year, with one line for Irrigated and one for Non-Irrigated.

## Requirements

### 1. Dependencies

```bash
npm i @chakra-ui/charts recharts
```

`@chakra-ui/charts` gives `useChart` and `Chart.Root`, built on Recharts and themed with Chakra tokens, so dark mode works.

### 2. Data

- The `/data` page (server component, `requirePermission("dataset:Read")`) reads the selected location from the `?location=<id>` search param. It defaults to the first active location.
- Query the `production_records` for that location, ordered by year.
- Convert `Decimal` to `number` before passing to the client.
- Shape: `{ year: number; irrigated: number | null; nonIrrigated: number | null }[]`, one row per year with either value.
- Changing the location picker updates the URL (`router.replace`), so the page re-renders with new data. The selected location is shared with the form in spec 08.

### 3. Chart: `src/components/data/HistoricalProductionChart.tsx` (`'use client'`)

- `LineChart` with x-axis = year and y-axis = production formatted as `1M`, `2M` (`Intl.NumberFormat` compact).
- Series: `irrigated` = `green.solid`, `nonIrrigated` = `orange.solid`, with dots.
- Legend: "Irrigated", "Non-Irrigated". `<Chart.Tooltip />` shows the full value with "MT".
- Grid lines use `chart.color("border.muted")`.
- `connectNulls={false}`, so missing years show as gaps.
- Empty state: "No production data yet for this location."

## Out of Scope

- Forecast lines (spec 12)

## Acceptance Criteria

- [ ] The chart shows both lines for a location with irrigated and non-irrigated data
- [ ] Saving a new record (spec 08) updates the chart without a full reload
- [ ] Switching locations updates the URL and the chart
- [ ] The chart is readable in light and dark mode
- [ ] `npm run lint` and `npm run build` pass

## References

- Chakra UI charts: installation, line chart, dashed series (Context7, `/chakra-ui/chakra-ui`)
