'use client'

import { SolanaService } from "@/services/solanaService";
import React, { useEffect, useState } from "react";
import { TransactionData } from "@/lib/types";
import TransactionBlock from "./TransactionBlock";
import { useParams } from 'next/navigation';
import SearchBar from "../search/SearchBar";
import AccountView from "./AccountView";
import LogView from "./LogView";

export default function TransactionDetailPage() {
    const params = useParams();
    const solanaService = new SolanaService();
    console.log("params", params)
    const signature = params.signature as string;
    console.log("signature is:", signature)

    const [transaction, setTransaction] = useState<TransactionData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTransactionData = async () => {
            setLoading(true);
            setError(null);
            try {
                if (!signature) {
                    throw new Error('Invalid transaction signature')
                }
                const txData = await solanaService.getTransaction(signature)

                if (!txData) {
                    throw new Error(`Transaction ${signature.substring(0, 8)}... not found`)
                }
                setTransaction(txData)
            } catch (error) {
                console.error('Error fetching transaction', error)
                setError(error instanceof Error ? error.message : 'An error occurred while fetching the transaction');
            } finally {
                setLoading(false)
            }
        }
        fetchTransactionData();
    }, [signature])

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <SearchBar />
            </div>
            <div>
                <h1 className="text-xs text-gray-500 font-bold">DETAILS</h1>
                <p className="text-2xl mb-6">Transaction</p>
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
            
            {!loading && !error && transaction && (
                <>
                    <TransactionBlock transaction={transaction} />
                    {transaction.accounts && <AccountView accounts={transaction.accounts} />}
                    {transaction.logs && <LogView logs={transaction.logs} />}
                </>
            )}
        </div>
    );
}