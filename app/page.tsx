'use client';

import { useState } from 'react';

const tabs = [
  { label: 'Dashboard', message: 'Your dashboard will appear here.' },
  { label: 'My Cards', message: 'Your saved cards will appear here.' },
  { label: 'Matches', message: 'Your card matches will appear here.' },
] as const;

export default function HomePage() {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const activeTab = tabs[activeTabIndex];

  return (
    <main className="site-shell">
      <section aria-labelledby="page-title" className="workspace">
        <p className="eyebrow">Personal finance workspace</p>
        <h1 id="page-title">Credit Card Match</h1>
        <p className="intro">Your workspace is ready for its first features.</p>

        <div aria-label="Workspace sections" className="tabs" role="tablist">
          {tabs.map((tab, index) => {
            const isActive = activeTabIndex === index;

            return (
              <button
                aria-controls="workspace-panel"
                aria-selected={isActive}
                className="tab"
                id={`tab-${index}`}
                key={tab.label}
                onClick={() => setActiveTabIndex(index)}
                onKeyDown={(event) => {
                  const offset =
                    event.key === 'ArrowRight'
                      ? 1
                      : event.key === 'ArrowLeft'
                        ? -1
                        : 0;

                  if (!offset) return;

                  event.preventDefault();
                  const nextTabIndex =
                    (activeTabIndex + offset + tabs.length) % tabs.length;
                  setActiveTabIndex(nextTabIndex);
                  event.currentTarget.parentElement
                    ?.querySelector<HTMLButtonElement>(`#tab-${nextTabIndex}`)
                    ?.focus();
                }}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                type="button"
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <section
          aria-labelledby={`tab-${activeTabIndex}`}
          className="empty-panel"
          id="workspace-panel"
          role="tabpanel"
          tabIndex={0}
        >
          <h2>{activeTab.label}</h2>
          <p>{activeTab.message}</p>
        </section>
      </section>
    </main>
  );
}
