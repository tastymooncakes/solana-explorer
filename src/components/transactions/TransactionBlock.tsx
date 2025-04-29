import React from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils/formatDate";
import { formatSol } from "@/lib/utils/formatSol";
import { TransactionData } from "@/lib/types";
import { truncateHash } from "@/lib/utils/truncateHash";

interface TransactionBlockProps {
    transaction: TransactionData;
}

export default function TransactionBlock({
    transaction
 } : TransactionBlockProps) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Overview</h2>
      
      <div className="space-y-0 text-sm">
        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Signature:</span>
          <span className="font-mono" title={transaction.signature}>{truncateHash(transaction.signature)}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Result:</span>
          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            transaction.success ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'
          }`}>
            {transaction.success ? 'Success' : 'Failed'}
          </span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Timestamp:</span>
          <span>{formatDate(transaction.blockTime)}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Confirmation Status:</span>
          <span className="font-mono">{transaction.confirmationStatus || 'FINALIZED'}</span>
        </div>
        
        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Confirmations:</span>
          <span className="font-mono">{typeof transaction.confirmations === 'number' ? transaction.confirmations : 'MAX'}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Slot:</span>
          <Link href={`/block/${transaction.slot}`} className="font-mono text-blue-400">
              {transaction.slot.toLocaleString()}
          </Link>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Recent Blockjash:</span>
          <span className="font-mono">{transaction.recentBlockHash || 'Not Available'}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Fee (SOL)</span>
          <span className="font-mono">{formatSol(transaction.fee)}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Compute Units:</span>
          <span className="font-mono">{transaction.computeUnits?.toLocaleString() || 'N/A'}</span>
        </div>

        <div className="flex justify-between py-3">
          <span className="text-gray-500 dark:text-gray-400">VERSION:</span>
          <span className='font-mono'>{transaction.version || 'LEGACY'}</span>
        </div>
      </div>
    </div>
    )
 }