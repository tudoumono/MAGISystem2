'use client';

/**
 * Models Check Page - Quick verification that Amplify models are working
 */

import { useEffect, useState } from 'react';
import { getAmplifyClient } from '@/lib/amplify/client';

export default function ModelsCheckPage() {
    const [status, setStatus] = useState<string>('Checking...');
    const [models, setModels] = useState<string[]>([]);

    useEffect(() => {
        async function checkModels() {
            try {
                const client = getAmplifyClient();

                if (!client) {
                    setStatus('❌ Client is null (server-side execution)');
                    return;
                }

                if (!client.models) {
                    setStatus('❌ No models property');
                    return;
                }

                const modelNames = Object.keys(client.models);
                setModels(modelNames);

                if (modelNames.length === 0) {
                    setStatus('❌ No models available');
                } else {
                    setStatus(`✅ ${modelNames.length} models available`);

                    // Test a simple API call
                    try {
                        const result = await client.models.Conversation.list({ limit: 1 });
                        setStatus(prev => prev + ` | API test: ${result.data ? 'Success' : 'No data'}`);
                    } catch (apiError) {
                        setStatus(prev => prev + ` | API test: Error - ${apiError instanceof Error ? apiError.message : 'Unknown'}`);
                    }
                }
            } catch (error) {
                setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        checkModels();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Amplify Models Check</h1>

                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-lg mb-4">{status}</p>

                    {models.length > 0 && (
                        <div>
                            <h2 className="font-semibold mb-2">Available Models:</h2>
                            <ul className="list-disc list-inside space-y-1">
                                {models.map(model => (
                                    <li key={model} className="text-green-600">
                                        {model}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}