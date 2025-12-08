const API_URL = 'http://localhost:5000';

const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        if (response.status === 401) {
            // Handle unauthorized (e.g., redirect to login)
            // For now just throw
            throw new Error('Unauthorized');
        }
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'API Error');
    }
    return response.json();
};

export const authAPI = {
    login: async (username: string, password: string) => {
        const email = `${username}@taxlaw.vn`
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        return handleResponse(response);
    },
};

export const userChatAPI = {
    getConversations: async () => {
        const response = await fetch(`${API_URL}/conversation/`, {
            headers: { ...getAuthHeader() },
        });
        return handleResponse(response);
    },
    createConversation: async () => {
        const response = await fetch(`${API_URL}/conversation/start`, {
            method: 'POST',
            headers: { ...getAuthHeader() },
        });
        return handleResponse(response);
    },
    sendMessage: async (conversationId: string, text: string) => {
        const response = await fetch(`${API_URL}/conversation/${conversationId}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ text }),
        });
        return handleResponse(response);
    },
    deleteConversation: async (conversationId: string) => {
        const response = await fetch(`${API_URL}/conversation/${conversationId}`, {
            method: 'DELETE',
            headers: { ...getAuthHeader() },
        });
        return handleResponse(response);
    },
};
