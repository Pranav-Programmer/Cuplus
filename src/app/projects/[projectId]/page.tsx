import React from 'react';
import ProjectPageClient from './ProjectPageClient';

export function generateStaticParams() { return []; }

export default function Page() {
  return <ProjectPageClient />;
}
