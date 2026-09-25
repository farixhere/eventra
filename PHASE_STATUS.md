# Eventra build status

Eventra now has the eight-phase architecture in the repository.

## Implemented in code
- Core event, programme, participant, team and registration APIs
- Scheduling, conflict detection and auto-scheduling APIs
- Manual results with verification and publishing
- Team leaderboard
- Certificates and ID cards
- Public festival pages, gallery, downloads, announcements and registration
- Analytics, contact messages and audit infrastructure
- Role/permission/session foundation
- Phase 2-5 schema for configurable programme rules, judging criteria, judge score sheets, corrections, venue availability, appeals, festival settings and API keys

## Production gate
The production Neon database must run migrations 003-007 in order (or the equivalent consolidated migration set), then the full production workflow must be tested against the live database. Vercel currently has a READY production deployment on main.
