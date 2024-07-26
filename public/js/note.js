import { getDatabase, ref, set, onValue, push, get, remove, update } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

const database = getDatabase();

// Function to add a note to the selected notebook
async function addNote(event) {
    event.preventDefault();
    const noteTitle = document.getElementById('noteTitle').value;
    const noteContent = document.getElementById('noteContent').value;
    const selectedNotebookId = document.getElementById('notebookSelect').value;

    if (noteTitle && noteContent) {
        const notesRef = ref(database, `notebooks/${selectedNotebookId}/notes`);
        const newNoteRef = push(notesRef);
        await set(newNoteRef, {
            title: noteTitle,
            content: noteContent,
            versionHistory: []
        });

        // Clear the note form
        document.getElementById('noteForm').reset();
        displayNotes(selectedNotebookId); // Update the displayed notes
        hideForm()
    } else {
        alert('Please fill in both note fields.');
    }
}

// Function to display notes for the selected notebook
function displayNotes(notebookId) {
    const notesContainer = document.getElementById('notesContainer');
    notesContainer.innerHTML = ''; // Clear current notes
    const notesRef = ref(database, `notebooks/${notebookId}/notes`);
    onValue(notesRef, (snapshot) => {
        notesContainer.innerHTML = ''; // Clear notes again to avoid duplication
        snapshot.forEach((childSnapshot, index) => {
            const note = childSnapshot.val();
            const noteCard = document.createElement('div');
            noteCard.className = 'col-md-4';
            noteCard.innerHTML = `<div class="card note-card">
              <div class="card-body">
                <h5 class="card-title">${note.title}</h5>
                <p class="card-text">${note.content}</p>
                <button class="btn btn-primary edit-note-btn" data-id="${childSnapshot.key}">Edit</button>
                <button class="btn btn-danger delete-note-btn" data-id="${childSnapshot.key}">Delete</button>
                <button class="btn btn-info history-note-btn" data-bs-toggle="modal" data-bs-target="#historyModal" data-id="${childSnapshot.key}">History</button>
              </div> </div>
            `;
            notesContainer.appendChild(noteCard);

            // Add event listener for delete button
            noteCard.querySelector('.delete-note-btn').addEventListener('click', () => {
                deleteNote(notebookId, childSnapshot.key);
            });

            noteCard.querySelector('.history-note-btn').addEventListener('click', () => {
                displayNoteHistory(notebookId, childSnapshot.key);
            });

            // Add event listener for edit button
            noteCard.querySelector('.edit-note-btn').addEventListener('click', () => {
                enterEditMode(noteCard, notebookId, childSnapshot.key, note.title, note.content);
            });
        });
    });
}

// Function to delete a note from the selected notebook
async function deleteNote(notebookId, noteId) {
    const noteRef = ref(database, `notebooks/${notebookId}/notes/${noteId}`);
    try {
        await remove(noteRef);
        displayNotes(notebookId); // Update the displayed notes
    } catch (error) {
        console.error('Error deleting note:', error);
    }
}

// Function to enter edit mode for a note
function enterEditMode(noteCard, notebookId, noteId, title, content) {
    noteCard.innerHTML = `
          <div class="card-body">
          <form class="save-note-btn">
            <input type="text" class="form-control mb-2" value="${title}" id="editTitle-${noteId}" required>
            <textarea class="form-control mb-2" rows="3" id="editContent-${noteId}" required>${content}</textarea>
            <button class="btn btn-success"  type="submit" data-id="${noteId}">Save</button>
            <button class="btn btn-secondary cancel-edit-btn" type="button" data-id="${noteId}">Cancel</button>
            </form>
          </div>
        `;
    // Add event listener for save button
    noteCard.querySelector('.save-note-btn').addEventListener('submit', () => {
        saveNoteEdit(notebookId, noteId , title, content);
    });
    // Add event listener for cancel button
    noteCard.querySelector('.cancel-edit-btn').addEventListener('click', () => {
        displayNotes(notebookId);
    });
}

// Function to save the edited note
async function saveNoteEdit(notebookId, noteId, oldTitle, oldContent) {
    const newTitle = document.getElementById(`editTitle-${noteId}`).value;
    const newContent = document.getElementById(`editContent-${noteId}`).value;
    const noteRef = ref(database, `notebooks/${notebookId}/notes/${noteId}`);
    // Update version history

    try {

        if (!(oldTitle === newTitle && oldContent === newContent)) {
            const noteSnapshot = await get(noteRef);
            const note = noteSnapshot.val();
            const versionHistory = note?.versionHistory || [];
            versionHistory.push({ title: oldTitle, content: oldContent, timestamp: new Date().toISOString() });
            await update(noteRef, {
                title: newTitle,
                content: newContent,
                versionHistory: versionHistory
            });
        }
        displayNotes(notebookId); // Update the displayed notes
    } catch (error) {
        console.error('Error saving edited note:', error);
    }
}

function displayNoteHistory(notebookId, noteId) {

    const historyContainer = document.getElementById('historyContainer');
    historyContainer.innerHTML = ''; // Clear current history

    const noteRef = ref(database, `notebooks/${notebookId}/notes/${noteId}`);
    onValue(noteRef, (snapshot) => {
        const note = snapshot.val();
        const versionHistory = note?.versionHistory || [];

        // Filter out duplicate versions
        const uniqueVersions = versionHistory.filter((version, index, self) =>
                index === self.findIndex((v) => (
                    v.title === version.title && v.content === version.content && v.timestamp === version.timestamp
                ))
        );

        historyContainer.innerHTML = '';

        uniqueVersions.forEach((version, index) => {
            const historyCard = document.createElement('div');
            historyCard.className = 'card history-card';
            historyCard.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">Version ${index + 1}</h5>
          <p class="card-text">Title: ${version.title}</p>
          <p class="card-text">Content: ${version.content}</p>
          <p class="card-text">Timestamp: ${new Date(version.timestamp).toLocaleString()}</p>
          <button class="btn btn-secondary revert-note-btn" data-id="${noteId}" data-index="${index}">Revert</button>
        </div>
      `;
            historyContainer.appendChild(historyCard);

            // Add event listener for revert button
            historyCard.querySelector('.revert-note-btn').addEventListener('click', () => {
                const historyModal = bootstrap.Modal.getInstance(document.getElementById('historyModal'));
                historyModal.hide();
                revertNoteVersion(notebookId, noteId, version.title, version.content);
            });
        });
    });
}


// Function to revert to a previous version of a note
async function revertNoteVersion(notebookId, noteId, title, content) {

    const noteRef = ref(database, `notebooks/${notebookId}/notes/${noteId}`);

    try {
        const noteSnapshot = await get(noteRef);
        const note = noteSnapshot.val();

        // Ensure versionHistory exists
        const versionHistory = note?.versionHistory || [];
        const currentNoteVersion = {
            title: note.title,
            content: note.content,
            timestamp: new Date().toISOString()
        };

        // Check if the current version is already in the history
        const isAlreadyInHistory = versionHistory.some(version =>
            version.title === currentNoteVersion.title &&
            version.content === currentNoteVersion.content
        );

        // Add the current version to the history if it's not already there
        if (!isAlreadyInHistory) {
            versionHistory.push(currentNoteVersion);
        }

        await update(noteRef, {
            title: title,
            content: content,
            versionHistory: versionHistory
        });

        displayNotes(notebookId); // Update the displayed notes

    } catch (error) {
        console.error('Error reverting note version:', error);
    }
}

function hideForm(){
    document.getElementById("one").classList.remove('d-none');
    document.getElementById("two").classList.add('d-none');
}

export {addNote , displayNotes, hideForm};

