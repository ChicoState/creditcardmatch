import { SurveyForm } from '../../components/survey-form';

export default function SurveyPage() {
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
      <SurveyForm />
    </main>
  );
}
