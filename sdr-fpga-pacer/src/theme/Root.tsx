import React from 'react';
import HighlightExplainer from '@site/src/components/HighlightExplainer';
import InteractionTracker from '@site/src/components/InteractionTracker';

export default function Root({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <>
      {children}
      <HighlightExplainer />
      <InteractionTracker />
    </>
  );
}
