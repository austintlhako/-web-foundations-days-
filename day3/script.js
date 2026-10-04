// Starting Data
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

/**
 * Searches notes matching query against text using filter, toLowerCase, and includes.
 */
function searchNotes(notesArray, query) {
  const lowerQuery = query.toLowerCase();
  return notesArray.filter(note => note.text.toLowerCase().includes(lowerQuery));
}

/**
 * Returns the longest note object. Handles empty array first, then compares lengths.
 */
function longestNote(notesArray) {
  if (!notesArray || notesArray.length === 0) {
    return null;
  }

  return notesArray.reduce((longest, current) => {
    return current.text.length > longest.text.length ? current : longest;
  });
}

/**
 * Counts notes by category by looping over the notes and increasing a counter in an object.
 */
function countByCategory(notesArray) {
  const counts = {};

  for (const note of notesArray) {
    const category = note.category;
    if (counts[category]) {
      counts[category] += 1;
    } else {
      counts[category] = 1;
    }
  }

  return counts;
}

/**
 * Returns summary using countByCategory and a template literal.
 * Uses "note" for exactly one note and "notes" otherwise.
 */
function getSummary(notesArray) {
  const total = notesArray.length;
  const word = total === 1 ? "note" : "notes";
  const counts = countByCategory(notesArray);

  const breakdown = Object.entries(counts)
    .map(([cat, count]) => `${cat}: ${count}`)
    .join(", ");

  return `You have ${total} ${word}${breakdown ? ` (${breakdown})` : ""}.`;
}

/**
 * Checks if note text already exists using some, comparing trimmed lower-case text.
 */
function isDuplicate(notesArray, text) {
  const cleanText = text.trim().toLowerCase();
  return notesArray.some(note => note.text.trim().toLowerCase() === cleanText);
}

/**
 * Adds a note, calling isDuplicate and checking length and category before adding.
 */
function addNote(notesArray, text, category) {
  if (!text || text.trim().length === 0) {
    return { success: false, reason: "Text cannot be empty." };
  }

  if (!category || category.trim().length === 0) {
    return { success: false, reason: "Category cannot be empty." };
  }

  if (isDuplicate(notesArray, text)) {
    return { success: false, reason: "Duplicate note detected." };
  }

  const nextId = notesArray.length > 0 ? Math.max(...notesArray.map(n => n.id)) + 1 : 1;
  const newNote = {
    id: nextId,
    text: text.trim(),
    category: category.trim().toLowerCase()
  };

  notesArray.push(newNote);
  return { success: true, note: newNote };
}