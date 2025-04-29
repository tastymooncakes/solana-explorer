import React from "react";
import { AccountData } from "@/lib/types";
import {formatSol} from "@/lib/utils/formatSol";

interface AccountViewProps {
    accounts: AccountData[];
}

export default function AccountView ({ accounts } : AccountViewProps) {
    return (
        <div className="bg-gray-800 rounded-lg shadow-md mb-6">
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold">Account Input(s)</h2>
            </div>
            {accounts.length > 0 ? (
            <div className="overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            #
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Address
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            CHANGE (SOL)
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            POST BALANCE (SOL)
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {accounts.map((account, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{account.pubKey}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{account.change !== null ? formatSol(account.change) : 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{account.balance !== null ? formatSol(account.balance) : 'N/A'}</td>
                            </tr>
                    ))}
                </tbody>
                </table>
            </div>
            ) : (
                <p className="p-4 text-gray-400">No accounts found.</p>
            )}
        </div>
    );
};