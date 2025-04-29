'use client'

import { SolanaService } from "@/services/solanaService";
import React, { useEffect, useState } from "react";
import { BlockData } from "@/lib/types";
import BlockSummary from "./BlockSummary";
import { useParams } from 'next/navigation';
import SearchBar from "../search/SearchBar";
import TransactionSummary from "./TransactionSummary";


export default function BlockDetailPage() {
    const params = useParams();
    const solanaService = new SolanaService();
    const slot = parseInt(params.slot as string, 10);

    const [block, setBlock] = useState<BlockData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBlockData = async () => {
            setLoading(true);
            setError(null);
            try {
                if (isNaN(slot)) {
                    throw new Error('Invalid slot number')
                }
                const blockData = await solanaService.getBlockDetails(slot)

                if (!blockData) {
                    throw new Error(`Block #${slot} not found`)
                }
                setBlock(blockData)
            } catch (error) {
                console.error('Error fetching block', error)
                setError(error instanceof Error ? error.message : 'An error occurred while fetching the block');
            } finally {
                setLoading(false)
            }
        }
        fetchBlockData();
    }, [slot])

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <SearchBar />
            </div>
            <div>
                <h1 className="text-xs text-gray-500 font-bold">DETAILS</h1>
                <p className="text-2xl mb-6">Block</p>
            </div>

            {loading && (
                <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-center items-center p-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            )}
            
            {error && (
                <div className="bg-red-900 border border-red-800 text-red-200 px-6 py-4 rounded-lg mb-6">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            
            {!loading && !error && block && (
                <>
                    <BlockSummary block={block} />
                    <TransactionSummary block={block} />
                </>
            )}
        </div>
    );
}