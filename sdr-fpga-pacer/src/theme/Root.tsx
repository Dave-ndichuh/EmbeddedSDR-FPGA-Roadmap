import React from 'react';
import HighlightExplainer from '@site/src/components/HighlightExplainer';

export default function Root({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      {children}
      <HighlightExplainer />
    </>
  );
}
