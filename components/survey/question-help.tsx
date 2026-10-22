import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export function QuestionHelp({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function closeWhenClickingOutsideHint(event: PointerEvent) {
      if (
        detailsRef.current &&
        !detailsRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', closeWhenClickingOutsideHint);
    return () =>
      document.removeEventListener('pointerdown', closeWhenClickingOutsideHint);
  }, []);

  return (
    <details
      className="question-help"
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      open={isOpen}
      ref={detailsRef}
    >
      <summary aria-label={`Explain: ${label}`}>?</summary>
      <p>{children}</p>
    </details>
  );
}
