(function(){
  let notes = [];
  let draftNote = null; // a new note being typed, not yet saved to the list
  let activeId = null;
  let searchTerm = "";
  let saveTimeout = null;

  const listPane = document.getElementById('listPane');
  const editorPane = document.getElementById('editorPane');
  const tally = document.getElementById('tally');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const newBtn = document.getElementById('newBtn');

  // Generates a unique ID for a new note (timestamp + random string).
  function uid(){
    return 'note_' + Date.now() + '_' + Math.random().toString(36).slice(2,8);
  }

  // Converts a timestamp into a short, human-readable date/time string.
  function formatDate(ts){
    const d = new Date(ts);
    return d.toLocaleDateString(undefined,{month:'short', day:'numeric'}) + ' · ' +
           d.toLocaleTimeString(undefined,{hour:'2-digit', minute:'2-digit'});
  }

  const STORAGE_KEY = 'notesAppData';

  // Reads saved notes out of localStorage on startup and renders the app.
  function loadNotes(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      notes = raw ? JSON.parse(raw) : [];
    }catch(e){
      notes = [];
    }
    render();
  }

  // Writes the current notes array to localStorage.
  function persist(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }catch(e){
      console.error('Could not save notes', e);
    }
  }

  // Returns the notes that match the current search term, newest first.
  function getFiltered(){
    const term = searchTerm.trim().toLowerCase();
    let list = notes;
    if(term){
      list = notes.filter(n =>
        n.title.toLowerCase().includes(term) ||
        n.body.toLowerCase().includes(term)
      );
    }
    return [...list].sort((a,b) => b.updatedAt - a.updatedAt);
  }

  // Redraws the whole UI: the note list, the editor, and the note count.
  function render(){
    renderList();
    renderEditor();
    tally.textContent = notes.length + (notes.length === 1 ? ' note' : ' notes');
  }

  // Builds the list of note cards on the left, or an empty-state message.
  function renderList(){
    const filtered = getFiltered();
    listPane.innerHTML = '';

    if(notes.length === 0){
      listPane.innerHTML = '<div class="empty-hint">No notes yet.<br>Start your first one on the right.</div>';
      return;
    }
    if(filtered.length === 0){
      listPane.innerHTML = '<div class="empty-hint">No notes match your search.</div>';
      return;
    }

    filtered.forEach(note => {
      const card = document.createElement('div');
      card.className = 'note-card' + (note.id === activeId ? ' active' : '');
      const title = note.title.trim() || 'Untitled';
      const preview = note.body.trim() || 'No additional text';
      card.innerHTML = `
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(preview)}</p>
        <div class="meta">
          <span>${formatDate(note.updatedAt)}</span>
          <button class="del-btn" data-id="${note.id}">Delete</button>
        </div>
      `;
      card.addEventListener('click', (e) => {
        if(e.target.classList.contains('del-btn')) return;
        draftNote = null; // discard any unsaved blank draft
        activeId = note.id;
        render();
      });
      card.querySelector('.del-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNote(note.id);
      });
      listPane.appendChild(card);
    });
  }

  // Fills the editor pane with either the open note, the current draft,
  // or a placeholder message if nothing is selected.
  function renderEditor(){
    // The active note may be an already-saved note, or the current draft
    // (a note being typed that hasn't earned a spot in the list yet).
    const note = notes.find(n => n.id === activeId) ||
                 (draftNote && draftNote.id === activeId ? draftNote : null);

    if(!note){
      editorPane.innerHTML = `
        <div class="editor-empty">
          Select a note to read or edit it,<br>or start a fresh page.
          <button id="emptyNewBtn">+ New note</button>
        </div>`;
      document.getElementById('emptyNewBtn').addEventListener('click', createNote);
      return;
    }

    editorPane.innerHTML = `
      <div class="editor-inner">
        <div class="editor-top">
          <input type="text" class="title" id="titleInput" placeholder="Untitled" value="${escapeAttr(note.title)}">
          <button class="close-btn" id="closeBtn" title="Close note" aria-label="Close note">&times;</button>
        </div>
        <textarea id="bodyInput" placeholder="Write something…">${escapeHtml(note.body)}</textarea>
        <div class="status-row" id="statusRow"></div>
      </div>
    `;

    document.getElementById('closeBtn').addEventListener('click', () => {
      draftNote = null; // discard an unsaved blank draft, if any
      activeId = null;
      render();
    });

    const titleInput = document.getElementById('titleInput');
    const bodyInput = document.getElementById('bodyInput');
    const statusRow = document.getElementById('statusRow');

    // Updates the small status line under the editor (e.g. "saved").
    function showStatus(msg, cls){
      statusRow.innerHTML = `<span class="${cls||''}">${msg}</span>`;
    }
    showStatus(note.id === (draftNote && draftNote.id) ? 'not saved yet — start typing' : 'saved',
               note.id === (draftNote && draftNote.id) ? 'warn' : 'saved');

    // Runs on every keystroke: promotes an empty draft into a real note
    // once it has content, then saves after a short pause.
    function handleChange(){
      const title = titleInput.value;
      const body = bodyInput.value;
      const hasContent = title.trim() || body.trim();

      if(!hasContent){
        // Still empty: keep it as an unsaved draft, don't add to the list yet.
        if(draftNote && draftNote.id === note.id){
          draftNote.title = title;
          draftNote.body = body;
        }
        showStatus('a note needs a title or some text before it can be saved', 'warn');
        return;
      }

      // First keystroke with real content: promote draft into a real,
      // listed note (or just update it if it was already a saved note).
      note.title = title;
      note.body = body;
      note.updatedAt = Date.now();

      if(draftNote && draftNote.id === note.id){
        notes.unshift(note);
        draftNote = null;
      }

      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        persist();
        showStatus('saved', 'saved');
        renderList();
        tally.textContent = notes.length + (notes.length === 1 ? ' note' : ' notes');
      }, 350);
    }

    titleInput.addEventListener('input', handleChange);
    bodyInput.addEventListener('input', handleChange);
  }

  // Starts a new, unsaved draft note and opens it in the editor.
  function createNote(){
    draftNote = {
      id: uid(),
      title: '',
      body: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    activeId = draftNote.id;
    render();
    // Not added to `notes` and not persisted until it actually has content.
  }

  // Removes a note by ID, saves the change, and re-renders.
  function deleteNote(id){
    notes = notes.filter(n => n.id !== id);
    if(activeId === id) activeId = null;
    persist();
    render();
  }

  newBtn.addEventListener('click', createNote);
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    renderList();
  });
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchTerm = '';
    renderList();
    searchInput.focus();
  });

  // Escapes text before inserting it into innerHTML, so note content can
  // never be interpreted as HTML/script (prevents injection bugs).
  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  // Escapes text before inserting it into an HTML attribute (e.g. value="...").
  function escapeAttr(str){
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  }

  // Kick off the app: load any saved notes and draw the initial screen.
  loadNotes();
})();