'use client';

import { useEffect, useState } from 'react';
import { SolanaService } from '@/services/solanaService';
import { BlockData } from '@/lib/types';
import SearchBar from '@/components/search/SearchBar';
import Link from 'next/link';

export default function Dashboard() {
  const [recentBlocks, setRecentBlocks] = useState<BlockData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    slotHeight: 0,
    transactionCount: 0,
    averageBlockTime: 0,
  });

  const solanaService = new SolanaService();

  useEffect(() => {
    const fetchRecentBlocks = async () => {
      setLoading(true);
      try {
        // Get recent block slots
        const slots = await solanaService.getRecentBlocks(10);
        
        // Fetch details for each block
        const blocksPromises = slots.map(slot => solanaService.getBlockDetails(slot));
        const blocksData = await Promise.all(blocksPromises);
        
        // Filter out null values (blocks that couldn't be fetched)
        const validBlocks = blocksData.filter((block): block is BlockData => block !== null);
        
        setRecentBlocks(validBlocks);
        
        // Calculate some basic stats
        if (validBlocks.length > 0) {
          const latestSlot = validBlocks[0].slot;
          let totalTxCount = 0;
          let totalBlockTime = 0;
          let prevBlockTime = 0;
          
          validBlocks.forEach((block, index) => {
            totalTxCount += block.transaction?.length || 0;
            
            if (index > 0 && prevBlockTime && block.blockTime) {
              totalBlockTime += prevBlockTime - block.blockTime;
            }
            
            if (block.blockTime) {
              prevBlockTime = block.blockTime;
            }
          });
          
          setStats({
            slotHeight: latestSlot,
            transactionCount: totalTxCount,
            averageBlockTime: validBlocks.length > 1 ? totalBlockTime / (validBlocks.length - 1) : 0,
          });
        }
      } catch (error) {
        console.error('Error fetching recent blocks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentBlocks();
    
    // Set up an interval to periodically refresh the data
    const interval = setInterval(fetchRecentBlocks, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  // Format timestamp to readable date
  const formatDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  // Format seconds to readable time
  const formatSeconds = (seconds: number) => {
    return `${seconds.toFixed(2)}s`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      
      <div className="mb-8">
        <SearchBar />
      </div>
      
      {/* Network Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Network Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">Latest Slot</h3>
            <p className="text-2xl font-bold">{stats.slotHeight.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">Recent Transactions</h3>
            <p className="text-2xl font-bold">{stats.transactionCount.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">Avg. Block Time</h3>
            <p className="text-2xl font-bold">{formatSeconds(stats.averageBlockTime)}</p>
          </div>
        </div>
      </div>
      
      {/* Recent Blocks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Blocks</h2>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Slot</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Block Hash</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Transactions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {recentBlocks.map((block) => (
                  <tr key={block.slot} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/block/${block.slot}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        {block.slot.toLocaleString()}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm">{block.blockhash.substring(0, 12)}...</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(block.blockTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {block.transaction?.length || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-4 text-right">
          <Link href="/blocks" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            View All Blocks →
          </Link>
        </div>
      </div>
    </div>
  );
}