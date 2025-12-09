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

export const lawyerDocumentAPI = {
    getDocuments: async () => {
        const response = await fetch(`${API_URL}/documents/list`, {
            headers: { ...getAuthHeader() },
        });
        const data = await handleResponse(response);
        return data.documents;
    },

    reviewDocument: async (docId: string, status: 'reviewed' | 'approved' | 'rejected', feedback: string) => {
        const response = await fetch(`${API_URL}/documents/${docId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ status, feedback }),
        });
        const data = await handleResponse(response);
        return {
            reviewStatus: data.status,
            feedback: data.feedback,
            reviewDate: new Date().toISOString() // API might not return date, assume now
        };
    },

    removeDocument: async (docId: string) => {
        const response = await fetch(`${API_URL}/documents/${docId}`, {
            method: 'DELETE',
            headers: { ...getAuthHeader() },
        });
        return handleResponse(response);
    },

    uploadDocument: async (formData: FormData) => {
        const response = await fetch(`${API_URL}/documents/create`, {
            method: 'POST',
            headers: { ...getAuthHeader() }, // Content-Type is auto-set for FormData
            body: formData,
        });
        return handleResponse(response);
    },

    downloadDocument: async (docId: string, filename: string) => {
        const response = await fetch(`${API_URL}/documents/${docId}/file`, {
            headers: { ...getAuthHeader() },
        });
        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename; // This might be overridden by Content-Disposition if present, but good fallback
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
};

export const dataScientistAPI = {
    getRetrievalMatches: async () => {
        const response = await fetch(`${API_URL}/retrieval/list`, {
            headers: { ...getAuthHeader() },
        });
        return handleResponse(response);
    },

    getDatabaseDocuments: async () => {
        // Re-use document list, which now supports DS seeing all (if we rely on admin permissions, or if DS role is treated same)
        // Actually document list for non-lawyer returns all?
        // Let's check backend list_documents. It filters if role=='lawyer'. Else returns all.
        // So this is correct for DS.
        const response = await fetch(`${API_URL}/documents/list`, {
            headers: { ...getAuthHeader() },
        });
        const data = await handleResponse(response);
        return data.documents;
    },

    exportRetrievalData: async () => {
        const response = await fetch(`${API_URL}/retrieval/list`, {
            headers: { ...getAuthHeader() },
        });
        const data = await handleResponse(response);
        return JSON.stringify(data, null, 2);
    },

    removeDocument: async (docId: string) => {
        const response = await fetch(`${API_URL}/documents/${docId}`, {
            method: 'DELETE',
            headers: { ...getAuthHeader() },
        });
        return handleResponse(response);
    },

    updateDocumentStatus: async (docId: string, approved: boolean) => {
        // If approved=true, call /approve endpoint which also indexes to vector DB
        // If approved=false, call /reject endpoint to set status to 'rejected'

        if (approved) {
            const response = await fetch(`${API_URL}/documents/${docId}/approve`, {
                method: 'POST',
                headers: { ...getAuthHeader() },
            });
            return handleResponse(response);
        } else {
            const response = await fetch(`${API_URL}/documents/${docId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify({ status: 'rejected', feedback: 'Rejected by Data Scientist' }),
            });
            return handleResponse(response);
        }
    },

    getSimilarityDistribution: async () => {
        const response = await fetch(`${API_URL}/retrieval/stats/similarity_distribution`, {
            headers: { ...getAuthHeader() },
        });
        return handleResponse(response);
    }
}
