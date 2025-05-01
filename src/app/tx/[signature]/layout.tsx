import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Update the props type to make params a Promise
type TransactionLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    transaction: string;
  }>;
};

// Update metadata generator to handle Promise params
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ transaction: string }> 
}): Promise<Metadata> {
  // Now we need to await the params Promise
  const resolvedParams = await params;
  
  return {
    title: `Transaction | ${resolvedParams.transaction} | Solana Explorer`,
    description: `Details for Solana tx #${resolvedParams.transaction}`,
  };
}

// Handle the Promise params in the layout component
export default async function TransactionLayout({
  children,
  params
}: TransactionLayoutProps) {
  // Await the params Promise
  const resolvedParams = await params;
  
  // Then use the resolved value for validation
  if (!resolvedParams.transaction || resolvedParams.transaction.length < 32) {
    notFound();
  }

  return <div className="container mx-auto">{children}</div>;
}