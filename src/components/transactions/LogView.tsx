import React from "react";

interface LogViewProps {
    logs: string[];
}

export default function LogView({ logs }: LogViewProps) {
    return (
        <div className="bg-gray-800 rounded-lg shadow-md mb-6">
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold">Program Instruction Logs</h2>
            </div>
            {/* Adding proper padding to match the AccountView component's structure */}
            <div className="p-6">
                <div className="bg-black p-6 rounded">
                    <pre className="text-white font-mono whitespace-pre overflow-x-auto">
                        {logs.length > 0 ? (
                            <>
                                [
                                {logs.map((log, index) => (
                                    <div key={index} className="ml-2">
                                        {log}
                                    </div>
                                ))}
                                ]
                            </>
                        ) : (
                            <p className="text-gray-400">No logs found.</p>
                        )}
                    </pre>
                </div>
            </div>
        </div>
    );
};