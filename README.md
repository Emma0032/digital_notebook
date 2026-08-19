# Digital Notebook

A lightweight, browser-based note-taking application that lets users create, edit, search, and manage notes efficiently. All notes are automatically saved to the browser's local storage, ensuring your work persists between sessions.

## Project Overview

Digital Notebook is a single-page application built with vanilla JavaScript, HTML5, and CSS3. It features a clean two-pane interface: a note list on the left and an editor on the right. The application emphasizes simplicity, responsiveness, and automatic persistence without requiring any backend server.

### Key Features
- **Create Notes**: Start new notes with a simple click
- **Edit & Auto-Save**: Edit notes in real-time with automatic saving after a short pause
- **Search**: Filter notes by title or content using the search bar
- **Delete**: Remove notes you no longer need
- **Persistent Storage**: Notes are automatically saved to browser localStorage
- **Formatted Timestamps**: Each note shows when it was last updated
- **Draft Management**: Notes with unsaved content are held as drafts until they contain actual text

## File Structure

```
digital_notebook/
├── index.html          # Main HTML structure
├── css/
│   └── style.css       # Styling and layout
├── js/
│   └── script.js       # Application logic
└── README.md           # This file
```

## JavaScript (script.js) - Detailed Overview

The `script.js` file contains the complete application logic and is organized around several key functions and concepts:

### Core Data Structure
- **notes**: Main array storing all saved notes
- **draftNote**: Temporary note object for unsaved content
- **activeId**: ID of the currently selected note
- **searchTerm**: Current search query
- **saveTimeout**: Timer for debounced auto-save

### Key Functions

#### Data Management
- **`uid()`**: Generates unique note IDs using timestamp + random string
- **`formatDate(ts)`**: Converts timestamps to readable date/time format (e.g., "Aug 16 · 02:45 PM")
- **`loadNotes()`**: Reads notes from localStorage on app startup
- **`persist()`**: Saves the entire notes array to localStorage with error handling
- **`getFiltered()`**: Returns notes matching the search term, sorted by newest first

#### UI Rendering
- **`render()`**: Main render function that updates the entire interface
- **`renderList()`**: Builds the note list panel on the left
  - Shows empty state when no notes exist
  - Shows "no matches" message when search finds nothing
  - Creates clickable note cards with title, preview, timestamp, and delete button
- **`renderEditor()`**: Displays the editor panel on the right
  - Shows the selected note or draft for editing
  - Displays title input and body textarea
  - Shows save status ("saved" or "not saved yet")

#### Event Handling
- **`handleChange()`**: Triggered on every keystroke
  - Promotes empty drafts into saved notes once they contain text
  - Triggers auto-save with a 350ms debounce delay
  - Updates the status message
- **`createNote()`**: Initializes a new empty draft and opens it in the editor
- **`deleteNote(id)`**: Removes a note and re-renders the interface

### Workflow
1. **Startup**: `loadNotes()` loads saved notes from localStorage
2. **User Creates Note**: `createNote()` makes a draft and sets it as active
3. **User Edits**: Each keystroke calls `handleChange()`
   - If draft becomes non-empty, it's added to the notes array
   - After a 350ms pause with no typing, `persist()` saves to localStorage
4. **User Searches**: Search input updates `searchTerm`, and `getFiltered()` filters notes
5. **User Deletes**: `deleteNote()` removes from array and persists changes
6. **User Closes**: Clears the active note and closes the editor

### Data Persistence
- Notes are stored in browser localStorage under the key `'notesAppData'`
- Storage format: JSON-stringified array of note objects
- Each note object contains: `id`, `title`, `body`, `updatedAt` (timestamp)
- Auto-save triggers 350ms after the last keystroke to avoid excessive writes

### Security Features
- **`escapeHtml()`**: Sanitizes note text to prevent XSS attacks
- **`escapeAttr()`**: Sanitizes attribute values in HTML
- Event delegation prevents unintended actions (e.g., delete while clicking a note card)

### Students
- Uche Mmesoma Ruth
- Ubosi Miracle
- Uche Favour Chiemela
- Titus Adaoma Blessing
