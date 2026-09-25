# Eventra 8-Phase Build

1. **Core integrity** — authentication, RBAC, ownership, audit and validation.
2. **Festival setup** — categories, programme rules, limits, skills, chest numbers and sub-fests.
3. **Registration** — candidate registration, bulk import/export, substitutions and teams.
4. **Scheduling** — manual scheduling, conflicts, judge availability, auto scheduling and publishing.
5. **Judging/results** — criteria, judge access, scoring, verification, corrections, appeals and leaderboard.
6. **Documents** — ID cards, certificates, QR verification, posters and bulk generation.
7. **Public experience** — website, gallery, downloads, news, announcements, notifications and live updates.
8. **Management** — analytics, multi-festival dashboard, API and custom domains.

## Production definition of done
A phase is complete only when its schema exists in production, its API/UI path works against production data, permissions are enforced, public/private visibility is correct, the workflow is tested end-to-end, and the deployment is READY.

Implementation rule: extend existing Eventra functionality, preserve the Eventra visual identity, keep judging/results manual and publishable, and keep public content database-driven.
