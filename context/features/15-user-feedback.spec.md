# 15 - User Feedback

## Overview

Add the **User Feedback** section to `/evaluation`, as in [context-1.jpg](../screenshots/context-1.jpg): average ratings out of 5 for Usability, Clarity, Functionality and Practical Usefulness, plus a form where users rate AniMo.

## Requirements

### 1. Averages

- Shown if `can(user, "feedback:Read")`
- `prisma.feedback.aggregate({ _avg: { ... }, _count: true })`
- One row per criterion: label, a Chakra `Progress` bar (value / 5), and "4.7 / 5" (1 decimal). Show "Based on N responses".
- Empty state: "No feedback yet."

### 2. Form

- Shown if `can(user, "feedback:Submit")`
- Chakra `RatingGroup` (1–5) for each of the four criteria, plus an optional comment (`Textarea`, max 500 characters)
- A user can submit more than once; each submission is a new row. Show the user's last submission date if there is one.

### 3. Server Action: `submitFeedback` in `src/actions/feedback.ts`

- `authorize("feedback:Submit")` → Zod (`src/types/feedback.ts`: each rating an integer 1–5, comment trimmed and optional) → create with `userId` from the session (never from the form) → `revalidatePath("/evaluation")`
- Returns `{ success, data, error }`. Toast: "Thanks for your feedback!"

## Out of Scope

- Listing individual comments, and deleting feedback (`feedback:Delete` stays Admin-only for later)

## Acceptance Criteria

- [ ] Submitting the form creates a `feedback` row with the current user's id
- [ ] The averages update after submitting
- [ ] Ratings outside 1–5 are rejected
- [ ] `npm run lint` and `npm run build` pass
