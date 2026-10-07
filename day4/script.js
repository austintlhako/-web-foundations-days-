// 1. Select all elements
const noteText = document.getElementById('note-text');
const charCount = document.getElementById('char-count');
const wordCount = document.getElementById('word-count');
const clearBtn = document.getElementById('clear-btn');
const themeToggle = document.getElementById('theme-toggle');

// 2. Main update function
function updateCounts() {
  const text = noteText.value;
  const chars = text.length;
  
  // Calculate words (split by whitespace, ignore empty strings)
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

  // Update text content
  charCount.textContent = `${chars} / 200 characters`;
  wordCount.textContent = `${words} word${words === 1 ? '' : 's'}`; // Pluralizes word count

  // Reset classes
  charCount.classList.remove('warning', 'over');

  // Apply warning or over classes
  if (chars > 200) {
    charCount.classList.add('over');
  } else if (chars > 180) {
    charCount.classList.add('warning');
  }
}

// 3. Clear functionality
function clearAll() {
  noteText.value = '';
  localStorage.removeItem('draft_text');
  updateCounts();
}

// 4. Event Listeners
noteText.addEventListener('input', () => {
  updateCounts();
  localStorage.setItem('draft_text', noteText.value);
});

clearBtn.addEventListener('click', clearAll);

noteText.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    clearAll();
  }
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  
  // Change button label and save to storage
  themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
  localStorage.setItem('draft_theme', isDark ? 'dark' : 'light');
});

// 5. Initialization on Page Load
function init() {
  // Restore saved text draft
  const savedText = localStorage.getItem('draft_text');
  if (savedText !== null) {
    noteText.value = savedText;
  }

  // Restore saved theme
  const savedTheme = localStorage.getItem('draft_theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = 'Light mode';
  }

  // Run initial count to reflect restored data
  updateCounts();
}

// Run init
init();