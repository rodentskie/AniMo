# 16 - Definition of Terms

## Overview

Build `/terms` as in [context-2.jpg](../screenshots/context-2.jpg): a glossary of the key terms used in AniMo, one icon card per term.

## Requirements

### 1. Data: `src/lib/terms.ts`

`TERMS: Term[]` with `{ term, definition, icon }`, using the glossary table in [project-overview.md](../project-overview.md) (18 terms), in this order:

1. Rice Production, Prediction, ARIMA, Evaluation, Time Series Data, Accuracy, Rice Yield, Climate Factors, Region, Trend (the mockup's 10 cards, in its order)
2. Then AniMo, Historical Data, Irrigated, Non-Irrigated, Production Outlook, MAE, RMSE, MAPE

Icons come from `react-icons/lu` (e.g. `LuWheat`, `LuTrendingUp`, `LuChartLine`, `LuSearch`, `LuCalendarClock`, `LuPercent`, `LuSprout`, `LuCloudSunRain`, `LuMapPin`, `LuChartColumnIncreasing`).

### 2. Page

- Server component, login required (no extra permission)
- Header: "Definition of Terms — Understand the key terms used in AniMo!"
- Two-column grid of cards on desktop, one column on phones. Each card: a large green icon on the left, the term as a heading, and the definition.
- A search input that filters the cards by term or definition (small `'use client'` component)

## Acceptance Criteria

- [ ] All 18 terms are shown with an icon
- [ ] Searching "error" shows MAE, RMSE and MAPE
- [ ] The layout matches the mockup on desktop and stacks on phones
- [ ] `npm run lint` and `npm run build` pass
