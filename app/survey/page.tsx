import { SurveyForm } from '../../components/survey-form';
import { getOptionalSavedSurveyAnswers } from '../../lib/account/data';

interface SurveyPageProps {
  searchParams?: Promise<{ review?: string }>;
}

export default async function SurveyPage({
  searchParams,
}: SurveyPageProps = {}) {
  const savedSurvey = await getOptionalSavedSurveyAnswers();
  const params = searchParams ? await searchParams : {};
  return (
    <main className="page-shell survey-page">
      <header className="page-intro">
        <p className="eyebrow">A few questions</p>
        <h1>Tell us what matters to you</h1>
        <p>
          Your answers stay in this browser unless you choose to save them after
          signing in.
        </p>
      </header>
      <SurveyForm
        savedSubmission={savedSurvey?.answers}
        startAtReview={params.review === '1'}
      />
    </main>
  );
}
