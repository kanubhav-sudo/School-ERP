# Project Constitution

These are the non-negotiable architectural mandates for the entire project.

1. **Monolithic Architecture**:
   - One React Frontend, One Express Backend, One PostgreSQL Database.
   - Do NOT split the codebase into separate applications.
2. **Access & Security**:
   - Share a single login page. Role detection forwards users to their respective dashboards.
   - Self-registration is strictly prohibited. Accounts are created ONLY by administrators.
3. **Decoupling Mandates**:
   - Thin controllers. Business logic resides in services.
   - Backend APIs must not contain presentation logic.
