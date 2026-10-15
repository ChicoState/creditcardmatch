import type { ReactNode } from 'react';

export function QuestionHelp({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <details className="question-help">
      <summary aria-label={`Explain: ${label}`}>?</summary>
      <p>{children}</p>
    </details>
  );
}
