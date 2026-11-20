// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { deriveSurveySubmission } from '../../lib/config/survey';
import {
  asUser,
  createDatabase,
  createUser,
  dropDatabase,
  literal,
  sql,
} from '../helpers/survey-test-database';

function submission(amount: number) {
  const laterSave = amount === 500;
  const category = laterSave ? 'dining' : 'groceries';
  return deriveSurveySubmission({
    acceptsAnnualFee: laterSave,
    categorySpend: { [category]: String(amount) },
    creditScore: laterSave ? 'excellent' : 'good',
    extraBenefits: [],
    incomeRange: laterSave ? 'over_100000' : '40001_to_60000',
    primaryGoal: laterSave ? 'travel_rewards' : 'cash_back',
    priorityCategories: [category],
  });
}
function save(amount: number) {
  return `SELECT public.save_survey_answers(${literal(JSON.stringify(submission(amount)))}::jsonb);`;
}
const clear = 'SELECT public.clear_survey_answers();';

async function state(user: string) {
  const result = await sql(`SELECT jsonb_build_object(
    'profile', (SELECT to_jsonb(p) FROM public.profiles p WHERE id = ${literal(user)}),
    'preferences', (SELECT to_jsonb(p) FROM public.user_preferences p WHERE user_id = ${literal(user)}),
    'spend', COALESCE((SELECT jsonb_agg(to_jsonb(s) || jsonb_build_object('category_slug', c.slug) ORDER BY category_id) FROM public.user_category_spend s JOIN public.reward_categories c USING (category_id) WHERE user_id = ${literal(user)}), '[]'::jsonb),
    'filters', COALESCE((SELECT jsonb_agg(to_jsonb(f) ORDER BY filter_id) FROM public.user_filter_preferences f WHERE user_id = ${literal(user)}), '[]'::jsonb)
  );`);
  return JSON.parse(result.trim());
}

// Explicit opt-in: this suite creates/drops only a generated disposable database.
// It never installs the draft migration in the shared local or remote project.
describe.runIf(process.env.RUN_DATABASE_TESTS === '1')(
  'saved-survey database transactions',
  // Each case runs several Docker/psql processes; keep unit-test timeouts unchanged.
  { timeout: 30_000 },
  () => {
    let user: string;
    let other: string;
    let created = false;
    beforeAll(async () => {
      await createDatabase();
      created = true;
    }, 60_000);
    afterAll(async () => {
      if (created) await dropDatabase();
    }, 30_000);
    beforeEach(async () => {
      user = await createUser();
      other = await createUser();
    });

    it('saves and clears the complete state without changing unrelated preference fields', async () => {
      await asUser(user, save(250));
      const saved = await state(user);
      expect(saved.preferences.survey_answers).toEqual(submission(250));
      expect(saved.preferences.survey_saved_at).toBeTruthy();
      expect(saved.spend).toEqual([
        expect.objectContaining({ user_id: user, monthly_amount: 250 }),
      ]);
      expect(saved.filters).toHaveLength(2);
      await sql(
        `UPDATE public.user_preferences SET monthly_spend = 1234.56, carries_balance = TRUE WHERE user_id = ${literal(user)};`,
      );
      await sql(
        `UPDATE public.profiles SET first_name = 'Preserved', last_name = 'Profile' WHERE id = ${literal(user)};`,
      );
      const profile = (await state(user)).profile;
      await asUser(user, save(500));
      const replaced = await state(user);
      expect(replaced.profile).toEqual(profile);
      expect(replaced.preferences).toMatchObject({
        monthly_spend: 1234.56,
        carries_balance: true,
      });
      expect(replaced.preferences.survey_answers).toEqual(submission(500));
      await asUser(user, clear);
      const cleared = await state(user);
      expect(cleared.profile).toEqual(profile);
      expect(cleared.preferences).toMatchObject({
        survey_answers: null,
        survey_saved_at: null,
        credit_score_range: null,
        income_range: null,
        accepts_annual_fee: null,
        wants_travel_rewards: null,
        monthly_spend: 1234.56,
        carries_balance: true,
      });
      expect(cleared.spend).toEqual([]);
      expect(cleared.filters).toEqual([]);
      await asUser(user, clear);
      expect(await state(user)).toEqual(cleared);
      await asUser(user, save(250));
      const resaved = await state(user);
      expect(resaved.profile).toEqual(profile);
      expect(resaved.preferences).toMatchObject({
        survey_answers: submission(250),
        monthly_spend: 1234.56,
        carries_balance: true,
      });
      expect(resaved.spend).toEqual([
        expect.objectContaining({
          category_slug: 'groceries',
          monthly_amount: 250,
        }),
      ]);
      expect(resaved.filters).toHaveLength(2);
    });

    it('keeps functions invoker-scoped and denies anonymous execution', async () => {
      expect(
        (
          await sql(`SELECT bool_and(NOT prosecdef) FROM pg_proc WHERE oid IN
      ('public.save_survey_answers(jsonb)'::regprocedure, 'public.clear_survey_answers()'::regprocedure);`)
        ).trim(),
      ).toBe('t');
      expect(
        (
          await sql(`SELECT has_function_privilege('service_role', 'public.save_survey_answers(jsonb)', 'EXECUTE')
        OR has_function_privilege('service_role', 'public.clear_survey_answers()', 'EXECUTE');`)
        ).trim(),
      ).toBe('f');
      for (const operation of [save(100), clear]) {
        await expect(sql(`SET ROLE anon; ${operation}`)).rejects.toThrow(
          /permission denied/,
        );
        await expect(
          sql(`SET ROLE authenticated; ${operation}`),
        ).rejects.toThrow(/Authentication required/);
      }
    });

    it('uses the session owner even if a direct caller supplies another user ID inside JSON', async () => {
      await asUser(other, save(777));
      const otherBefore = await state(other);
      const payload = { ...submission(250), user_id: other };
      await asUser(
        user,
        `SELECT public.save_survey_answers(${literal(JSON.stringify(payload))}::jsonb);`,
      );
      expect((await state(user)).preferences.user_id).toBe(user);
      expect(await state(other)).toEqual(otherBefore);
      await asUser(user, clear);
      expect(await state(other)).toEqual(otherBefore);
    });

    it.each([
      ['user_preferences', 'INSERT OR UPDATE'],
      ['user_category_spend', 'DELETE'],
      ['user_category_spend', 'INSERT'],
      ['user_filter_preferences', 'DELETE'],
      ['user_filter_preferences', 'INSERT'],
    ])('rolls back a save failing at %s %s', async (table, event) => {
      await asUser(user, save(250));
      const before = await state(user);
      await sql(`CREATE OR REPLACE FUNCTION public.fail_survey_test() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'Injected survey write failure'; END; $$;
      CREATE TRIGGER fail_survey_test BEFORE ${event} ON public.${table} FOR EACH ROW EXECUTE FUNCTION public.fail_survey_test();`);
      try {
        await expect(asUser(user, save(501))).rejects.toThrow(
          'Injected survey write failure',
        );
        expect(await state(user)).toEqual(before);
      } finally {
        await sql(`DROP TRIGGER fail_survey_test ON public.${table};`);
      }
    });

    it.each([
      ['user_preferences', 'UPDATE'],
      ['user_category_spend', 'DELETE'],
      ['user_filter_preferences', 'DELETE'],
    ])('rolls back a clear failing at %s %s', async (table, event) => {
      await asUser(user, save(250));
      const before = await state(user);
      await sql(`CREATE OR REPLACE FUNCTION public.fail_survey_test() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'Injected survey write failure'; END; $$;
      CREATE TRIGGER fail_survey_test BEFORE ${event} ON public.${table} FOR EACH ROW EXECUTE FUNCTION public.fail_survey_test();`);
      try {
        await expect(asUser(user, clear)).rejects.toThrow(
          'Injected survey write failure',
        );
        expect(await state(user)).toEqual(before);
      } finally {
        await sql(`DROP TRIGGER fail_survey_test ON public.${table};`);
      }
    });

    it('rolls back the first profile insert and all survey writes on a late constraint failure', async () => {
      const invalid = {
        ...submission(250),
        user_filter_preferences: [
          { filter_slug: 'cashback', preference: 'invalid' },
        ],
      };
      const before = await state(user);
      await expect(
        asUser(
          user,
          `SELECT public.save_survey_answers(${literal(JSON.stringify(invalid))}::jsonb);`,
        ),
      ).rejects.toThrow(/check constraint/);
      expect(await state(user)).toEqual(before);
    });

    it('clears a never-saved account without creating or changing stored state', async () => {
      const before = await state(user);
      await asUser(user, clear);
      expect(await state(user)).toEqual(before);
    });
  },
);
