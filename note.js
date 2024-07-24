import { getDatabase, ref, set, onValue, push, query, orderByChild, equalTo, get, remove, update }
    from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
import "./index.js"

const database = getDatabase();

function toggle() {
    const selectElement = document.getElementById('notebookSelect');
    const selected = selectElement.options[selectElement.selectedIndex].text;
    if (!(selected === null || selected === ''))
    {
        document.getElementById("one").classList.add('d-none');
        document.getElementById("two").classList.remove('d-none');
        document.getElementById('chosen').textContent = selected;
    }
}

// Function to add a new notebook if the name doesn't already exist
async function addNotebook() {
    const title = document.getElementById('newNotebookName').value;
    if (title) {
        const notebooksRef = ref(database, 'notebooks');
        const notebookQuery = query(notebooksRef, orderByChild('title'), equalTo(title));
        try {
            const snapshot = await get(notebookQuery);
            if (!snapshot.exists()) {
                const newNotebookRef = push(notebooksRef);
                await set(newNotebookRef, { title: title, notes: [] });
                document.getElementById('newNotebookName').value = '';
                // Update the select element and set the new notebook as selected
                updateNotebookSelect(newNotebookRef.key, title);
                document.getElementById('notebookSelect').value = newNotebookRef.key; // Set the new notebook as selected
                displayNotes(newNotebookRef.key); // Display notes for the new notebook
            } else {
                alert('A notebook with this title already exists.');
            }
        } catch (error) {
            console.error('Error checking for existing notebooks:', error);
        }
    }
}

// Function to add a note to the selected notebook
async function addNote() {
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
        document.getElementById("one").classList.remove('d-none');
        document.getElementById("two").classList.add('d-none');
        
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
                <button class="btn btn-info history-note-btn" data-id="${childSnapshot.key}">History</button>
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
            <input type="text" class="form-control mb-2" value="${title}" id="editTitle-${noteId}">
            <textarea class="form-control mb-2" rows="3" id="editContent-${noteId}">${content}</textarea>
            <button class="btn btn-success save-note-btn" data-id="${noteId}">Save</button>
            <button class="btn btn-secondary cancel-edit-btn" data-id="${noteId}">Cancel</button>
          </div>
        `;
    // Add event listener for save button
    noteCard.querySelector('.save-note-btn').addEventListener('click', () => {
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
    const noteSnapshot = await get(noteRef);
    const note = noteSnapshot.val();
    const versionHistory = note?.versionHistory || [];
    versionHistory.push({ title: oldTitle, content: oldContent, timestamp: new Date().toISOString() });

    try {
        await update(noteRef, {
            title: newTitle,
            content: newContent,
            versionHistory: versionHistory
        });
        displayNotes(notebookId); // Update the displayed notes
    } catch (error) {
        console.error('Error saving edited note:', error);
    }
}


// Function to display the version history of a note
function displayNoteHistory(notebookId, noteId) {
    const historyContainer = document.getElementById('historyContainer');
    historyContainer.innerHTML = ''; // Clear current history

    const noteRef = ref(database, `notebooks/${notebookId}/notes/${noteId}`);
    onValue(noteRef, (snapshot) => {
        const note = snapshot.val();
        const versionHistory = note.versionHistory || [];

        versionHistory.forEach((version, index) => {
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
                revertNoteVersion(notebookId, noteId, version.title, version.content);
            });
        });
    });

    // Show the history modal
    const historyModal = new bootstrap.Modal(document.getElementById('historyModal'));
    historyModal.show();
}

// Function to revert to a previous version of a note
async function revertNoteVersion(notebookId, noteId, title, content) {
    const noteRef = ref(database, `notebooks/${notebookId}/notes/${noteId}`);
    try {
        await update(noteRef, { title: title, content: content });
        displayNotes(notebookId); // Update the displayed notes
        const historyModal = bootstrap.Modal.getInstance(document.getElementById('historyModal'));
        historyModal.hide();
    } catch (error) {
        console.error('Error reverting note version:', error);
    }
}

// Function to update the notebook select element
function updateNotebookSelect(notebookId, title) {
    const notebookSelect = document.getElementById('notebookSelect');
    const existingOption = notebookSelect.querySelector(`option[value="${notebookId}"]`);
    if (!existingOption) {
        const option = document.createElement('option');
        option.value = notebookId;
        option.textContent = title;
        notebookSelect.appendChild(option);
    }
}

// Function to display notebooks in the select element
function displayNotebooks(snapshot) {
    const notebookSelect = document.getElementById('notebookSelect');
    const currentSelection = notebookSelect.value; // Store current selection
    notebookSelect.innerHTML = ''; // Reset select options

    snapshot.forEach((childSnapshot) => {
        const notebookId = childSnapshot.key;
        const notebook = childSnapshot.val();
        const option = document.createElement('option');
        option.value = notebookId;
        option.textContent = notebook.title;
        notebookSelect.appendChild(option);
    });

    // Restore previous selection if it exists
    if (currentSelection && notebookSelect.querySelector(`option[value="${currentSelection}"]`)) {
        notebookSelect.value = currentSelection;
        displayNotes(currentSelection); // Display notes for the current selection
    } else {
        // If the previous selection does not exist, select the first notebook
        const firstOption = notebookSelect.querySelector('option');
        if (firstOption) {
            notebookSelect.value = firstOption.value;
            displayNotes(firstOption.value);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('toggleBtn').addEventListener('click', toggle);
    document.getElementById('addNotebookBtn').addEventListener('click', addNotebook);
    document.getElementById('noteForm').addEventListener('submit', (event) => {
        event.preventDefault();
        addNote();
    });

    document.getElementById('back').addEventListener('click', () => {
        document.getElementById("one").classList.remove('d-none');
        document.getElementById("two").classList.add('d-none');
    });

    document.getElementById('notebookSelect').addEventListener('change', (event) => {
        displayNotes(event.target.value);
    });

    // Listen for changes in the database
    onValue(ref(database, 'notebooks'), displayNotebooks);
});

