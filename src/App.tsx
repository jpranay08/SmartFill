import './App.css';
import { useState } from 'react';

function App() {
  // Load initial values from localStorage
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('OPENROUTER_API_KEY') || ''
  );
  const [selectedModel, setSelectedModel] = useState(
    localStorage.getItem('SELECTED_MODEL') ||
      'google/gemini-2.0-flash-thinking-exp:free'
  );
  const [enabled, setEnabled] = useState(
    localStorage.getItem('Ai_status') === 'true'
  );

  // Function to save the API key
  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.target.value);
  };

  const saveApiKey = () => {
    localStorage.setItem('OPENROUTER_API_KEY', apiKey);
  };

  // Function to save the selected model
  const handleModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedModel(event.target.value);
  };

  const saveModel = () => {
    localStorage.setItem('SELECTED_MODEL', selectedModel);
  };

  // Function to handle checkbox state
  const handleAiToggle = () => {
    const newStatus = !enabled;
    setEnabled(newStatus);
    localStorage.setItem('Ai_status', newStatus.toString());
  };

  return (
    <>
      <h1>Smart Fill</h1>
      <div>
        <p>Open Router API key</p>
        <input
          type="password"
          id="openrouter-api-key"
          placeholder="Enter OpenRouter API Key"
          value={apiKey}
          onChange={handleApiKeyChange}
        />
        <button id="save-api-key" onClick={saveApiKey}>
          Save Key
        </button>
      </div>

      <div>
        <p>Open Router Model</p>
        <input
          type="text"
          id="openrouter-model-name"
          placeholder="Provide your model name here..."
          value={selectedModel}
          onChange={handleModelChange}
        />
        <button id="save-model" onClick={saveModel}>
          Save Model
        </button>
      </div>

      <div style={{ padding: '10px', width: '200px' }}>
        <label>
          <input type="checkbox" checked={enabled} onChange={handleAiToggle} />
          Enable AI Suggestions
        </label>
      </div>
    </>
  );
}

export default App;
