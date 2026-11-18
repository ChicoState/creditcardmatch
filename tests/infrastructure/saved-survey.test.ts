import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20261110120000_saved_survey_answers.sql',
  ),
  'utf8',
);

describe('saved survey migration', () => {
  it('adds a timestamped complete answer snapshot to owner-scoped preferences', () => {
    expect(migration).toContain('ALTER TABLE public.user_preferences');
    expect(migration).toContain('ADD COLUMN survey_answers JSONB');
    expect(migration).toContain('ADD COLUMN survey_saved_at TIMESTAMPTZ');
    expect(migration).toContain('Complete validated SurveySubmission snapshot');
  });
});
