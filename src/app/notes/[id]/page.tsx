import React from 'react';
import NoteDetailPageClient from './NoteDetailPageClient';

export function generateStaticParams() { return []; }

export default function Page() {
  return <NoteDetailPageClient />;
}
