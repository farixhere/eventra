CREATE TABLE IF NOT EXISTS scoring_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  name text NOT NULL,
  max_score numeric(8,2) NOT NULL CHECK (max_score > 0),
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scoring_criteria_programme ON scoring_criteria(programme_id);

ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS criterion_id uuid REFERENCES scoring_criteria(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_scores_criterion ON scores(criterion_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_scores_judge_entry_criterion
  ON scores (
    programme_id,
    judge_id,
    COALESCE(participant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(team_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(criterion_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

CREATE TABLE IF NOT EXISTS programme_point_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position > 0),
  points numeric(8,2) NOT NULL DEFAULT 0 CHECK (points >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(programme_id, position)
);

CREATE INDEX IF NOT EXISTS idx_programme_point_rules_programme
  ON programme_point_rules(programme_id);
