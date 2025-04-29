import React from 'react';
import Link from 'next/link';
import { BlockData } from '@/lib/types';
import { formatDate } from '@/lib/utils/formatDate';
import { truncateHash } from '@/lib/utils/truncateHash';

interface BlockSummaryProps {
  block: BlockData;
}

export default function BlockSummary({ 
    block,
}: BlockSummaryProps) {

    return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Overview</h2>
      
      <div className="space-y-0 text-sm">
        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Block Hash:</span>
          <span className="font-mono" title={block.blockhash}>{truncateHash(block.blockhash)}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Slot:</span>
          <span className="font-mono">{block.slot.toLocaleString()}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Slot Leader:</span>
          <span className="font-mono">{truncateHash(block.slotLeader)}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Timestamp:</span>
          <span>{formatDate(block.blockTime)}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Epoch:</span>
          <span className="font-mono">{block.epoch}</span>
        </div>
        
        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Parent Blockhash:</span>
          <span className="font-mono">{truncateHash(block.parentBlockHash)}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Parent Slot:</span>
          <Link href={`/block/${block.parentSlot}`} className="font-mono text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            {block.parentSlot.toLocaleString()}
          </Link>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Parent Slot Leader:</span>
          <span className="font-mono">{truncateHash(block.parentSlotLeader)}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Child Slot:</span>
          <Link href={`/block/${block.childSlot}`} className="font-mono text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            {block.childSlot.toLocaleString()}
          </Link>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Child Slot Leader:</span>
          <span className="font-mono">{truncateHash(block.childSlotLeader)}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Processed Transactions:</span>
          <span className='font-mono'>{block.processedTransactions || 'N/A'}</span>
        </div>

        <div className="flex justify-between py-3">
          <span className="text-gray-500 dark:text-gray-400">Successful Transaction:</span>
          <span className='font-mono'>{block.successfulTransactions || 'N/A'}</span>
        </div>
        
      </div>
    </div>
  );
}