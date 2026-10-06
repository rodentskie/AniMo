# History

- Scaffold (**Oct 5, 2026**) - setup project initially
- Home Page (**Oct 5, 2026**) - build home page `/` from the mockup
  - Shared navbar (logo, nav links, light/dark toggle, menu on phones)
  - Hero with rice field background, ARIMAX description, page search bar, Get Started card, and AniMo mascot
  - Non-home nav links and Get Started use `#` placeholders until their pages exist
- Database Schema Design (**Oct 6, 2026**) - document the Prisma schema in `context/database-schema.md`
  - Auth: next-auth Credentials provider with JWT sessions, `bcryptjs` password hashes, `tokenVersion` to force logout
  - AWS-IAM-style RBAC: roles, policies and statements (allow/deny, actions, resources), with seeded Admin, Analyst and Viewer roles
  - Domain: multiple rice fields, historical yield records, ARIMAX model configurations, per-field evaluations (MAE, RMSE, MAPE) and predictions
  - ARIMAX uses the `arima` npm package; it was tested on sample data and models are refitted on each prediction
  - Audit log filled by Postgres triggers on the important tables
