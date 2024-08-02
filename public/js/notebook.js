import { getDatabase, ref, set, onValue, push, query, orderByChild, equalTo, get } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
import {auth} from"./index.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {displayNotes, addNote, hideForm} from "./note.js";

const database = getDatabase();

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('name').innerText = user?.displayName || '';
    } else {
        window.location.href = 'index.html';
    }
});

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

function logout()
{
    signOut(auth).catch((error) => console.log(error));
}

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('toggleBtn').addEventListener('click', toggle);
    document.getElementById('addNotebookBtn').addEventListener('click', addNotebook);
    document.getElementById('noteForm').addEventListener('submit', (event) => addNote(event));
    document.getElementById('back').addEventListener('click', hideForm);
    document.getElementById('notebookSelect').addEventListener('change', (event) => displayNotes(event.target.value));
    document.getElementById("out").addEventListener("click", logout);

    // Listen for changes in the database
    onValue(ref(database, 'notebooks'), displayNotebooks);
});
