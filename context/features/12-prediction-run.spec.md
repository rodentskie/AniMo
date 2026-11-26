# 12 - Prediction Run and Forecast Chart

## Overview

Build `/prediction` as on the Prediction screen of [context-1.jpg](../screenshots/context-1.jpg): pick a location and irrigation status, click **Run ARIMA**, and see the **ARIMA Forecast** chart (actual vs. forecast).

## Requirements

### 1. Page

- `requirePermission("prediction:Read")`
- Left panel: "View your prediction results using the ARIMA model.", the location select, the irrigation radio, and the **Run ARIMA** button (shown if `can(user, "prediction:Run")`)
- Shows the active model name (e.g. "Model: ARIMA(1,1,1)"). If no model is active: "No active model. Ask an admin to set one in Settings."
- If the series fails `validateSeries`, show the reason and disable the button.
- Main panel: the latest prediction for the selected location and irrigation status, if one exists (`?location=&irrigation=` search params, as in spec 09).

### 2. Server Action: `runPrediction` in `src/actions/prediction.ts`

1. `authorize("prediction:Run")`, then Zod-validate `{ locationId, irrigation }`
2. Load the active model; error if there is none
3. `loadSeries` → `validateSeries`
4. `forecast(values, lastYear, model, FORECAST_HORIZON = 5)`
5. `historicalAvg` = mean of the series; `outlook` = `getOutlook(historicalAvg, mean of the forecasts)`
6. Create the `Prediction` with nested `points` in one write (no audit wrapper, since predictions aren't audited)
7. `revalidatePath("/prediction")`, return `{ success, data: { predictionId }, error }`

Wrap the ARIMA call in try/catch. A fitting error returns "The model could not fit this data. Try another model."

### 3. Chart: `src/components/prediction/ForecastChart.tsx`

- `@chakra-ui/charts` line chart. Series `actual` = `green.solid` (solid), `forecast` = `orange.solid` with `strokeDasharray: "5 5"`.
- The forecast line starts at the last actual point, so the two lines connect.
- Optional 95% band from `lowerBound` / `upperBound` (Recharts `Area`, low opacity).
- Show the last 10 actual years plus the forecast years, as in the mockup. Legend: "Actual", "Forecast". Y-axis in MT, compact format.

### 4. Forecast table

Under the chart: Year, Forecast (MT), 95% range.

## Out of Scope

- Production Outlook and Planting Decision Support cards (spec 13)
- A list of past predictions, and deleting predictions

## Acceptance Criteria

- [ ] With 10+ years of data and an active model, Run ARIMA saves a prediction with 5 points and shows the chart
- [ ] With fewer than 10 years, or missing years, the reason is shown and the button is disabled
- [ ] With no active model, the message is shown
- [ ] Reloading the page shows the latest saved prediction
- [ ] A user without `prediction:Run` gets the permission error from the action
- [ ] `npm run lint` and `npm run build` pass
