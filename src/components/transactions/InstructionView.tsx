import React, { useState } from "react";
import { InstructionData } from "@/lib/types";

interface InstructionViewProps {
    instructions: InstructionData[];
}

export default function InstructionView({ instructions }: InstructionViewProps) {
    const [expandedInstructions, setExpandedInstructions] = useState<{[key: number]: boolean}>({});

    const toggleExpand = (index: number) => {
        setExpandedInstructions(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // Recursive function to render an instruction and its children
    const renderInstruction = (instruction: InstructionData, index: number, level: number = 0) => {
        const hasChildren = instruction.childInstructions && instruction.childInstructions.length > 0;
        const isExpanded = expandedInstructions[index];
        
        return (
            <div 
                key={index} 
                className={`mb-4 border border-gray-700 rounded-lg ${level > 0 ? 'ml-6 border-l-4 border-l-purple-700' : ''}`}
            >
                <div 
                    className="flex justify-between items-center p-4 cursor-pointer bg-gray-750 hover:bg-gray-700 rounded-t-lg"
                    onClick={() => toggleExpand(index)}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-gray-300 text-sm font-medium">
                            {level === 0 ? `Instruction #${index + 1}` : `Inner #${index + 1}`}
                        </span>
                        {instruction.isInner && (
                            <span className="bg-purple-700 text-xs px-2 py-1 rounded-full">
                                Inner
                            </span>
                        )}
                        {hasChildren && (
                            <span className="bg-blue-700 text-xs px-2 py-1 rounded-full">
                                Has Inner Instructions ({instruction.childInstructions!.length})
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                            Program: 
                        </span>
                        <span className="text-xs text-gray-300 font-mono">
                            {instruction.programId && instruction.programId.length > 16 
                                ? `${instruction.programId.slice(0, 8)}...${instruction.programId.slice(-8)}`
                                : instruction.programId}
                        </span>
                        <svg 
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </div>
                
                {isExpanded && (
                    <div className="border-t border-gray-700 bg-gray-800">
                        <div className="p-4">
                            <div className="mb-4">
                                <h3 className="text-sm font-medium text-gray-300 mb-2">Program ID</h3>
                                <div className="bg-gray-900 p-2 rounded-md text-sm font-mono text-gray-300 overflow-x-auto">
                                    {instruction.programId}
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <h3 className="text-sm font-medium text-gray-300 mb-2">Accounts ({instruction.accounts.length})</h3>
                                <div className="bg-gray-900 p-2 rounded-md overflow-x-auto">
                                    <table className="min-w-full text-sm text-gray-300 font-mono">
                                        <thead>
                                            <tr className="text-xs text-gray-400">
                                                <th className="py-1 px-2 text-left">#</th>
                                                <th className="py-1 px-2 text-left">Address</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {instruction.accounts.map((account, accountIndex) => (
                                                <tr key={accountIndex} className="border-t border-gray-800">
                                                    <td className="py-1 px-2">{accountIndex}</td>
                                                    <td className="py-1 px-2">{account}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <h3 className="text-sm font-medium text-gray-300 mb-2">Data (Hex)</h3>
                                <div className="bg-gray-900 p-2 rounded-md text-sm font-mono text-gray-300 overflow-x-auto">
                                    {instruction.data && instruction.data.length > 0 ? (
                                        <div className="break-all whitespace-pre-wrap">{instruction.data}</div>
                                    ) : (
                                        <span className="text-gray-500">No data</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Render child instructions if any */}
                        {hasChildren && (
                            <div className="pt-2 pb-4 px-4">
                                <h3 className="text-sm font-medium text-gray-300 mb-2">Inner Instructions</h3>
                                <div className="border-l-4 border-purple-700 pl-2">
                                    {instruction.childInstructions!.map((childInstruction, childIndex) => 
                                        renderInstruction(childInstruction, index * 100 + childIndex + 1, level + 1)
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-md mb-6">
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold">Instructions</h2>
            </div>
            {instructions.length > 0 ? (
                <div className="p-4">
                    {instructions.map((instruction, index) => renderInstruction(instruction, index))}
                </div>
            ) : (
                <p className="p-4 text-gray-400">No instructions found.</p>
            )}
        </div>
    );
}