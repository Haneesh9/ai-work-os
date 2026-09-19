import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Work OS — Operating System of the Workspace',
  description: 'AI-native workspace combining Action Inbox, Project Management, RAG Document Search, and Local Agent Tool Execution.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
