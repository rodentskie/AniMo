# 14 - Model Evaluation

## Overview

Build the **Evaluation Metrics** part of `/evaluation`, as in [context-1.jpg](../screenshots/context-1.jpg): MAE, RMSE and MAPE of the active ARIMA model for a location and irrigation status.

## Requirements

### 1. Page

- `requirePermission("evaluation:Read")`
- Left panel: "Model Evaluation — Check the model's performance using MAE, RMSE, and MAPE.", the location select, the irrigation radio, the test-size select (3 / 5 years, default `TEST_SIZE = 3`), and a **Run Evaluation** button (`evaluation:Run`)
- Three stat cards: **MAE**, **RMSE** (in MT, compact format) and **MAPE** (%, 1 decimal), from the latest `ModelEvaluation` for the active model, location and irrigation status
- Under the cards: "Trained on 2000–2022, tested on 2023–2025", and the evaluation date
- Short help text for each metric (from the glossary): MAE = average absolute error, RMSE = square root of the average squared error, MAPE = average percentage error

### 2. Server Action: `runEvaluation` in `src/actions/evaluation.ts`

1. `authorize("evaluation:Run")`, then Zod-validate `{ locationId, irrigation, testSize }`
2. Load the active model and series; `validateSeries` needs at least `MIN_YEARS + testSize` years
3. Train on the first `n − testSize` values, `forecast` `testSize` years, and compare with the held-out actual values
4. Save `ModelEvaluation` (`trainFrom`, `trainTo`, `testSize`, `mae`, `rmse`, `mape`)
5. `revalidatePath("/evaluation")`, return `{ success, data, error }`

### 3. Actual vs. predicted table

Under the cards: Year, Actual, Predicted, Error, for the test years. It's computed again when the page loads, since points aren't stored. Leave it out if that's too slow.

## Out of Scope

- User Feedback (spec 15)
- Comparing several models side by side

## Acceptance Criteria

- [ ] Run Evaluation saves a `model_evaluations` row and shows the three metrics
- [ ] Metrics match a hand calculation on a small series
- [ ] A series that is too short shows the reason, and nothing is saved
- [ ] A Viewer can see metrics but has no Run button (Viewers have `evaluation:Read` only)
- [ ] `npm run lint` and `npm run build` pass
