let currentInput = null;
let suggestionText = ' AI generated text'; // Placeholder suggestion
let originalText = ''; // Store user's text before suggestion
let suggestionStart = -1; // Position where suggestion starts

let OPENROUTER_API_KEY = localStorage.getItem('OPENROUTER_API_KEY') || '';
let SELECTED_MODEL =
  localStorage.getItem('SELECTED_MODEL') ||
  'google/gemini-2.0-flash-thinking-exp:free';
let AI_STATUS = localStorage.getItem('Ai_status') === 'true';

async function generateAISugesstion(context, userData) {
  if (AI_STATUS) {
    if (!OPENROUTER_API_KEY) {
      console.log('Add api key!');
      return;
    }
    try {
      let response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Smart fill',
          },

          body: JSON.stringify({
            model: SELECTED_MODEL,
            messages: [
              {
                role: 'system',
                content: `Answer as quickly as possible. You are a personalized assistant helping the user complete their task of answering questions. You are provided with some context, and your task is to provide an efficient response in up to 10 words related to the provided context. If you cannot generate anything, return an empty response.`,
              },
              {
                role: 'user',
                content: `Context: ${context}\n\nText entered by user:\n${userData}`,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      let data = await response.json();
      console.log(data);
      const suggestionText = data.choices[0].message.content;
      // Handle the suggestionText, like setting it in state or displaying it
      return suggestionText;
    } catch (error) {
      console.error('Error getting suggestion:', error);
    }
  } else {
    console.log('As the extension is disabled not suggesting anything ');
  }
}

function getTextFieldContext(inputElement) {
  if (!inputElement) return null;

  let context = '';

  // 1. Check for associated label
  let label = document.querySelector(`label[for="${inputElement.id}"]`);
  if (label) context += `Label: ${label.innerText}. `;

  // 2. Check for placeholder
  if (inputElement.placeholder) {
    context += `Placeholder: ${inputElement.placeholder}. `;
  }

  // 3. Check for accessibility attributes
  if (inputElement.getAttribute('aria-label')) {
    context += `ARIA Label: ${inputElement.getAttribute('aria-label')}. `;
  }

  // 4. Check for nearby heading (h1, h2, h3, etc.)
  let closestHeading = inputElement
    .closest('form, div')
    ?.querySelector('h1, h2, h3, p');
  if (closestHeading) {
    context += `Context: ${closestHeading.innerText}. `;
  }

  return context.trim();
}

function createSuggestionOverlay(textarea) {
  // Remove existing overlay if any
  let existingOverlay = document.getElementById('ai-suggestion-overlay');
  if (existingOverlay) existingOverlay.remove();

  // Get textarea styles
  const styles = window.getComputedStyle(textarea);

  // Create a new div overlay
  let overlay = document.createElement('div');
  overlay.id = 'ai-suggestion-overlay';
  overlay.textContent = textarea.value; // Start with the current text
  overlay.style.position = 'absolute';
  overlay.style.left = `${textarea.offsetLeft}px`;
  overlay.style.top = `${textarea.offsetTop}px`;
  overlay.style.width = styles.width;
  overlay.style.height = styles.height;
  overlay.style.font = styles.font;
  overlay.style.fontSize = styles.fontSize;
  overlay.style.lineHeight = styles.lineHeight;
  overlay.style.padding = styles.padding;
  overlay.style.border = styles.border;
  overlay.style.background = 'transparent';
  overlay.style.color = 'gray'; // Suggestion color
  overlay.style.pointerEvents = 'none'; // Prevent interaction
  overlay.style.whiteSpace = 'pre-wrap'; // Preserve line breaks
  overlay.style.overflow = 'hidden';

  // Append overlay to body
  document.body.appendChild(overlay);

  // Sync overlay text with textarea
  textarea.addEventListener('input', () => {
    overlay.textContent = textarea.value + suggestionText;
  });

  // Remove overlay when focus is lost
  textarea.addEventListener('blur', () => overlay.remove());
}
// Detect when the user focuses on an input field
document.addEventListener('input', (event) => {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    createSuggestionOverlay(event.target);
    if (currentInput !== event.target) {
      currentInput = event.target;
      originalText = currentInput.value; // Store text before suggestion
      suggestionStart = -1; // Reset suggestion position
      let context = getTextFieldContext(event.target);
      console.log('Text Field Context:', context);
      currentInput.addEventListener('keydown', handleKeyEvents);
    }
    handleTyping();
  }
});

document.addEventListener('focusout', () => {
  discardSuggestion();
});

function handleTyping(event) {
  if (!currentInput) return;

  let cursorPos = currentInput.selectionStart;

  // If a suggestion isn't already shown, add it at the current cursor position
  if (suggestionStart === -1) {
    suggestionStart = cursorPos; // Store where suggestion begins
    originalText = currentInput.value; // Save user input before suggestion
    insertSuggestion(cursorPos);
  }
}

// Insert suggestion at cursor position
function insertSuggestion(cursorPos) {
  let textBeforeCursor = currentInput.value.substring(0, cursorPos);
  let textAfterCursor = currentInput.value.substring(cursorPos);

  currentInput.value = textBeforeCursor + suggestionText + textAfterCursor;
  currentInput.style.color = 'gray'; // Show suggestion in gray

  // Move cursor to the end of the original text
  currentInput.setSelectionRange(cursorPos, cursorPos);
}

// Handle Tab / Esc Key
function handleKeyEvents(event) {
  if (!currentInput) return;

  if (event.key === 'Tab') {
    event.preventDefault();
    acceptSuggestion();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    discardSuggestion();
  }
}

function acceptSuggestion() {
  if (!currentInput) return;

  currentInput.style.color = 'black'; // Make text black
  cleanup();
}

// Discard suggestion but keep user-typed content
function discardSuggestion() {
  if (!currentInput || suggestionStart === -1) return;

  // Remove only the suggestion, keep typed text
  currentInput.value = currentInput.value.replace(suggestionText, '');
  currentInput.style.color = 'black'; // Restore text color
  cleanup();
}

function cleanup() {
  if (!currentInput) return;

  currentInput.removeEventListener('keydown', handleKeyEvents);
  suggestionStart = -1; // Reset suggestion
  currentInput = null;
}
