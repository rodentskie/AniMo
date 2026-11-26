# 13 - Production Outlook and Planting Decision Support

## Overview

Add the two cards under the forecast chart on `/prediction`, as in [context-1.jpg](../screenshots/context-1.jpg): **Production Outlook** and **Planting Decision Support**. Both are read from the saved `Prediction` (`outlook`, `historicalAvg`).

## Requirements

### 1. Text: `src/lib/outlook-text.ts`

| `outlook`  | Badge          | Outlook text                                       | Planting recommendation                                                         |
| ---------- | -------------- | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| `HIGH`     | **Favorable** (green)  | Estimated production is above historical average.  | You may consider planting rice in the next season.                              |
| `MODERATE` | **Moderate** (yellow)  | Estimated production is close to the historical average. | Planting is reasonable; keep monitoring local conditions.             |
| `LOW`      | **Low** (red)          | Estimated production is below historical average.  | Consider preparing for lower production (e.g. irrigation support, alternative crops). |

Keep the wording in one constant map so it's easy to change.

### 2. Components (`src/components/prediction/`)

- `ProductionOutlookCard`: a leaf icon, the badge label, the outlook text, and below it the forecast average vs. historical average in MT (e.g. "+8.2% vs. historical average")
- `PlantingDecisionCard`: a check icon and the recommendation
- Shown side by side on desktop and stacked on phones. Hidden until a prediction exists.

### 3. Note

Add a small muted note: "Based on the ARIMA forecast only. Weather and other local factors are not included."

## Acceptance Criteria

- [ ] Each of `HIGH`, `MODERATE` and `LOW` shows the matching badge, color and text (check by editing a prediction's `outlook` in Prisma Studio)
- [ ] The percentage vs. historical average is correct
- [ ] The cards look right in light and dark mode and on phones
- [ ] `npm run lint` and `npm run build` pass
