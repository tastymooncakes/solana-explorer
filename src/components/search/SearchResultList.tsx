'use client';

import Link from 'next/link';
import { SearchResult, BlockData, TransactionData } from '@/lib/types';

interface SearchResultsListProps {
  results: SearchResult | null;
  isLoading: boolean;
  onResultClick: () => void;
}

export default function SearchResultsList({ 
  results, 
  isLoading, 
  onResultClick 
}: SearchResultsListProps) {
  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-400">
        <div className="inline-block animate-spin mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </div>
        Searching...
      </div>
    );
  }

  if (!results) {
    return null;
  }

  // Safely cast data to the appropriate type
  const blockData = results.type === 'block' ? results.data as BlockData : null;
  const transactionData = results.type === 'transaction' ? results.data as TransactionData : null;

  return (
    <>
      {results.type === 'block' && blockData && (
        <Link 
          href={`/block/${blockData.slot}`}
          className="block p-3 hover:bg-gray-700 border-b border-gray-700"
          onClick={onResultClick}
        >
          <div className="text-xs text-gray-400 uppercase">BLOCK</div>
          <div className="font-semibold">Slot #{blockData.slot}</div>
          {blockData.blockTime && (
            <div className="text-xs text-gray-400">
              {new Date(blockData.blockTime * 1000).toLocaleString()}
            </div>
          )}
          <div className="text-xs text-gray-400 truncate">
            Hash: {blockData.blockhash.substring(0, 8)}...
          </div>
        </Link>
      )}
      
      {results.type === 'transaction' && transactionData && (
        <Link 
          href={`/tx/${transactionData.signature}`}
          className="block p-3 hover:bg-gray-700 border-b border-gray-700"
          onClick={onResultClick}
        >
          <div className="text-xs text-gray-400 uppercase">TRANSACTION</div>
          <div className="font-mono text-sm truncate">
            {transactionData.signature.substring(0, 12)}...
            {transactionData.signature.substring(transactionData.signature.length - 12)}
          </div>
          {transactionData.blockTime && (
            <div className="text-xs text-gray-400">
              {new Date(transactionData.blockTime * 1000).toLocaleString()}
            </div>
          )}
          <div className="text-xs text-gray-400">
            Status: <span className={transactionData.success ? "text-green-500" : "text-red-500"}>
              {transactionData.success ? "Success" : "Failed"}
            </span>
          </div>
        </Link>
      )}
      
      {results.type === 'not-found' && (
        <div className="p-3 text-center text-gray-400">
          No Results
        </div>
      )}
    </>
  );
}