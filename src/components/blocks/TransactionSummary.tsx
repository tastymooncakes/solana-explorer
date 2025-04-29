import Link from "next/link";
import React, { useState } from "react";
import { BlockData, TransactionData } from "@/lib/types";
import { formatSol } from "@/lib/utils/formatSol";
import { truncateHash } from "@/lib/utils/truncateHash";

interface TransactionSectionProps {
    block: BlockData
}

export default function TransactionSummary({
    block
}: TransactionSectionProps) {

    const [showAll, setShowAll] = useState(false);

    if (!block.transaction || block.transaction.length === 0) {
        return (
          <div className="bg-gray-800 rounded-lg shadow-md mb-6 p-6">
            <h2 className="text-xl font-semibold mb-4">Transactions</h2>
            <div className="text-center text-gray-400 py-8">
              No transactions in this block
            </div>
          </div>
        );
    }

    const displayTransactions = showAll ? block.transaction : block.transaction.slice(0, 10)

    return (
    <div className="bg-gray-800 rounded-lg shadow-md mb-6">
        <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold">Transactions ({block.transaction.length})</h2>
        </div>
          
        <div className="overflow-x-auto text-sm">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Signature
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Fee
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Compute
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {displayTransactions.map((tx: TransactionData, index: number) => (
                  <tr key={tx.signature} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                        {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tx.success ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'
                      }`}>
                        {tx.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/tx/${tx.signature}`} className="text-blue-400 hover:text-blue-300 font-mono">
                        {truncateHash(tx.signature)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatSol(tx.fee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {tx.computeUnits}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.transaction.length > 10 && (
            <div className="px-6 py-4 border-t border-gray-700 flex justify-center">
              {showAll ? (
                <button 
                  onClick={() => setShowAll(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm w-full"
                >
                  Show Less
                </button>
              ) : (
                <button 
                  onClick={() => setShowAll(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm w-full"
                >
                  Load More
                </button>
              )}
            </div>
          )}
        </div>
    );
}