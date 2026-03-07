export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { model = 'gemini-3.1-pro-preview', contents, systemInstruction, generationConfig, safetySettings } = req.body;

    // Check if the user provided their own API key via headers
    const userApiKey = req.headers['x-gemini-api-key'];
    // Fallback to the secure environment variable stored on Vercel
    const apiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const payload = { contents };
        if (systemInstruction) payload.systemInstruction = systemInstruction;
        if (generationConfig) payload.generationConfig = generationConfig;
        if (safetySettings) payload.safetySettings = safetySettings;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
