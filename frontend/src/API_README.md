# Mock API Integration

This application now uses mock API calls instead of direct state management. All data operations go through the API layer in `/services/mockApi.ts`.

## What Changed

### Before
- Components managed data directly in React state
- Data operations were synchronous
- No API layer

### After
- Components load data from mock API on mount
- All data operations are asynchronous (using async/await)
- Mock API simulates network delays (200-1500ms)
- All data persists in the mock API store during the session

## API Endpoints

### User Chat API (`userChatAPI`)

```typescript
// Get all conversations
await userChatAPI.getConversations()

// Get messages for a conversation
await userChatAPI.getConversationMessages(conversationId)

// Create new conversation
await userChatAPI.createConversation()

// Send message and get bot response
await userChatAPI.sendMessage(conversationId, message)

// Delete conversation
await userChatAPI.deleteConversation(conversationId)
```

### Lawyer Document API (`lawyerDocumentAPI`)

```typescript
// Get all documents
await lawyerDocumentAPI.getDocuments()

// Upload new document
await lawyerDocumentAPI.uploadDocument(document)

// Review document
await lawyerDocumentAPI.reviewDocument(documentId, reviewStatus, feedback)

// Remove document
await lawyerDocumentAPI.removeDocument(documentId)
```

### Data Scientist API (`dataScientistAPI`)

```typescript
// Get retrieval matches
await dataScientistAPI.getRetrievalMatches()

// Get database documents
await dataScientistAPI.getDatabaseDocuments()

// Update document status
await dataScientistAPI.updateDocumentStatus(documentId, dsApproved, appliedToDatabase)

// Remove document from database
await dataScientistAPI.removeDocument(documentId)

// Batch process documents
await dataScientistAPI.batchProcessDocuments(documentIds, action)

// Export retrieval data as JSON
await dataScientistAPI.exportRetrievalData()
```

## How It Works

1. **Mock Data Store**: All data is stored in memory within `/services/mockApi.ts`
2. **Simulated Network Delays**: Each API call has a delay (200-1500ms) to simulate real API behavior
3. **Data Persistence**: Data changes persist during the session (until page refresh)
4. **Error Handling**: All API calls are wrapped in try-catch blocks

## Example: UserChatView

```typescript
// Load conversations on mount
useEffect(() => {
  loadConversations();
}, []);

const loadConversations = async () => {
  try {
    setIsLoading(true);
    const convs = await userChatAPI.getConversations();
    // Convert API data to component format
    const convertedConvs = convs.map(c => ({
      id: c.id,
      timestamp: new Date(c.timestamp),
    }));
    setConversations(convertedConvs);
  } catch (error) {
    console.error('Error loading conversations:', error);
  } finally {
    setIsLoading(false);
  }
};
```

## To Connect to Real API

To connect to a real backend API:

1. **Update API Base URL**: In `/services/mockApi.ts`, replace mock implementations with fetch calls:

```typescript
// Instead of:
export const userChatAPI = {
  getConversations: async (): Promise<Conversation[]> => {
    await delay(300);
    return [...mockConversations];
  },
  // ...
}

// Use:
const API_BASE_URL = 'http://localhost:8000/api';

export const userChatAPI = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await fetch(`${API_BASE_URL}/conversations`);
    return response.json();
  },
  // ...
}
```

2. **Keep Type Definitions**: The interfaces at the top of `/services/mockApi.ts` define the API contract
3. **No Component Changes Needed**: Components already use async/await and handle errors

## Benefits

- ✅ **Realistic behavior**: Components now handle loading states and async operations
- ✅ **Easy testing**: Mock data is centralized and easy to modify
- ✅ **Production-ready**: Simple to swap mock API for real API calls
- ✅ **Type-safe**: Full TypeScript support with interfaces
- ✅ **Maintainable**: Clear separation between UI and data layer

## Files Modified

- `/components/UserChatView.tsx` - Uses userChatAPI
- `/components/LawyerDocumentView.tsx` - Uses lawyerDocumentAPI
- `/components/DataScientistView.tsx` - Uses dataScientistAPI

## Files Added

- `/services/mockApi.ts` - Complete mock API implementation with types and data
