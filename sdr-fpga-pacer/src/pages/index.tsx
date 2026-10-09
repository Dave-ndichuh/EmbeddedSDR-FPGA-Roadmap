import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import PacerDashboard from '@site/src/components/Pacer';

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - Dashboard`}
      description="Personal Pacer and Documentor for SDR & FPGA Engineering">
      <main>
        <PacerDashboard />
      </main>
    </Layout>
  );
}
