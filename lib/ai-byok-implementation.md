# AI Integration - BYOK Implementation

Complete client-side AI integration using only user-provided API keys. Zero server storage, zero backend involvement.

## Features

✅ **Multiple Provider Support**
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3)
- Groq (Fast Inference)
- Generic OpenAI-Compatible (custom baseURL)

✅ **Unified AI Client**
- Single `aiClient.send()` interface
- Automatic provider routing
- Streaming support
- Error handling

✅ **Editor Actions**
- Explain code
- Refactor selection
- Fix error
- Generate function
- Generate file
- Document code

✅ **Privacy First**
- API keys stored only in localStorage
- All requests browser → AI provider
- No prompts/code stored
- No logging
- No backend

## Implementation

### Unified AI Client

```tsx
import { getAIClient } from '@/lib/ai-client';

const client = getAIClient();

// Configure provider
client.setConfig({
  id: 'openai',
  name: 'OpenAI',
  apiKey: 'sk-...',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2000,
});

// Send prompt
const response = await client.send('Explain this code', {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 1000,
});

console.log(response.content);
```

### Editor Actions Hook

```tsx
import { useAIEditorActions } from '@/hooks/use-ai-editor-actions';

function MyEditor() {
  const {
    explainCode,
    refactorSelection,
    fixError,
    generateFunction,
    generateFile,
    documentCode,
    loading,
    error,
  } = useAIEditorActions();

  const handleExplain = async () => {
    const explanation = await explainCode({
      selectedText: 'const x = 1;',
      language: 'javascript',
    });
    // Show explanation
  };
}
```

### Context Menu Integration

```tsx
import { AIEditorContextMenu } from '@/components/ai-editor-context-menu';

<AIEditorContextMenu
  selectedText={selectedCode}
  fullFileContent={fileContent}
  fileName="index.js"
  language="javascript"
  onCodeGenerated={(code) => {
    // Insert generated code
  }}
  onCodeReplaced={(code) => {
    // Replace selection with refactored code
  }}
>
  <MonacoEditor />
</AIEditorContextMenu>
```

## Provider Configuration

### OpenAI
```tsx
{
  id: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4o-mini',
}
```

### Anthropic
```tsx
{
  id: 'anthropic',
  apiKey: 'sk-ant-...',
  model: 'claude-3-5-sonnet-20241022',
}
```

### Groq
```tsx
{
  id: 'groq',
  apiKey: 'gsk_...',
  model: 'llama-3.1-8b-instant',
}
```

### Generic OpenAI-Compatible
```tsx
{
  id: 'generic',
  apiKey: 'your-key',
  baseURL: 'https://api.example.com',
  model: 'custom-model',
}
```

## Storage

Only stored in localStorage:

```json
{
  "byok-ai-provider": {
    "id": "openai",
    "name": "OpenAI",
    "apiKey": "sk-...",
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "maxTokens": 2000,
    "baseURL": null
  }
}
```

**Never stored:**
- Prompts
- Code
- Responses
- History
- Any user data

## Error Handling

### Authentication Errors
- Shows toast with "Open Settings" action
- Allows user to update API key

### Rate Limit Errors
- Shows toast with "Switch Provider" action
- Suggests trying different provider

### Model Errors
- Shows toast with "Open Settings" action
- Allows user to change model

### Generic Errors
- Shows error message
- Provides "Open Settings" action

## API Calls

All requests go directly from browser → AI provider:

### OpenAI
```
POST https://api.openai.com/v1/chat/completions
Headers: Authorization: Bearer {apiKey}
```

### Anthropic
```
POST https://api.anthropic.com/v1/messages
Headers: x-api-key: {apiKey}
```

### Groq
```
POST https://api.groq.com/openai/v1/chat/completions
Headers: Authorization: Bearer {apiKey}
```

### Generic
```
POST {baseURL}/v1/chat/completions
Headers: Authorization: Bearer {apiKey}
```

## Editor Actions

### Explain Code
```tsx
const explanation = await explainCode({
  selectedText: code,
  language: 'javascript',
});
// Returns: Explanation text
```

### Refactor Selection
```tsx
const refactored = await refactorSelection({
  selectedText: code,
  language: 'javascript',
});
// Returns: Refactored code
```

### Fix Error
```tsx
const fixed = await fixError({
  selectedText: code,
  language: 'javascript',
  errorMessage: 'TypeError: ...',
});
// Returns: Fixed code
```

### Generate Function
```tsx
const functionCode = await generateFunction({
  selectedText: 'requirements',
  language: 'javascript',
}, 'myFunction');
// Returns: Generated function code
```

### Generate File
```tsx
const fileCode = await generateFile({
  selectedText: 'requirements',
  language: 'typescript',
}, 'utils.ts');
// Returns: Complete file code
```

### Document Code
```tsx
const documented = await documentCode({
  selectedText: code,
  language: 'javascript',
});
// Returns: Code with documentation
```

## Usage Example

```tsx
'use client';

import { useAIEditorActions } from '@/hooks/use-ai-editor-actions';
import { AIEditorContextMenu } from '@/components/ai-editor-context-menu';
import MonacoEditor from '@monaco-editor/react';

export function CodeEditor() {
  const [code, setCode] = useState('');
  const [selectedText, setSelectedText] = useState('');
  
  const { explainCode, refactorSelection, loading } = useAIEditorActions();

  return (
    <AIEditorContextMenu
      selectedText={selectedText}
      fullFileContent={code}
      language="javascript"
      onCodeReplaced={(newCode) => setCode(newCode)}
    >
      <MonacoEditor
        value={code}
        onChange={(value) => setCode(value || '')}
        onSelectionChange={(selection) => {
          // Extract selected text
        }}
      />
    </AIEditorContextMenu>
  );
}
```

## Privacy & Security

✅ **All operations client-side**
- No backend endpoints
- No token proxying
- No server logs

✅ **Minimal storage**
- Only provider config in localStorage
- Never prompts or code
- Never responses or history

✅ **Direct API calls**
- Browser → AI provider
- Using user's API key
- No intermediate servers

## Success Criteria ✅

- ✅ User can select provider (OpenAI, Anthropic, Groq, Generic)
- ✅ User enters API key (stored in localStorage only)
- ✅ Unified `aiClient.send()` interface
- ✅ Editor actions work (explain, refactor, fix, generate, document)
- ✅ All requests browser → AI provider
- ✅ No backend involvement
- ✅ No prompts/code stored
- ✅ Error handling with provider switching
- ✅ Toast notifications for errors
