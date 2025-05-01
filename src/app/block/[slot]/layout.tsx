import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Adjust the props type to make params a Promise
type BlockLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    slot: string;
  }>;
};

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slot: string }> 
}): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Block ${resolvedParams.slot} | Solana Explorer`,
  };
}

// Correctly handle the Promise params
export default async function BlockLayout({ 
  children, 
  params 
}: BlockLayoutProps) {
  // Await the params Promise
  const resolvedParams = await params;
  
  // Then use the resolved value for validation
  const slotNumber = parseInt(resolvedParams.slot);
  
  if (isNaN(slotNumber) || slotNumber.toString() !== resolvedParams.slot) {
    notFound();
  }

  return (
    <div className="container mx-auto">
      {children}
    </div>
  );
}