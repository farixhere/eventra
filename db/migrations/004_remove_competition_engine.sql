-- Eventra competition-engine cleanup
-- Results are entered manually and published by organisers.
-- These legacy objects are no longer used by Eventra.

DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS scoring_criteria CASCADE;
DROP TABLE IF EXISTS programme_point_rules CASCADE;
DROP TABLE IF EXISTS judges CASCADE;
