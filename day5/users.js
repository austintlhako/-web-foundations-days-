const loadBtn = document.getElementById('load-users');
const filterInput = document.getElementById('filter-input');
const statusMsg = document.getElementById('status');
const usersList = document.getElementById('users-list');

// Array to store the fetched users
let allUsers = [];

// Function to draw any array of users
function renderUsers(list) {
  // Clear the current list
  usersList.textContent = '';

  // Handle empty results
  if (list.length === 0 && allUsers.length > 0) {
    statusMsg.textContent = 'No users match your filter.';
    return;
  }

  // Draw the items
  list.forEach(user => {
    const li = document.createElement('li');
    
    // Combining name, email, city, and company name safely
    li.textContent = `Name: ${user.name} | Email: ${user.email} | City: ${user.address.city} | Company: ${user.company.name}`;
    
    usersList.appendChild(li);
  });
}

// Async function to fetch and load users
async function loadUsers() {
  statusMsg.textContent = 'Loading users...';
  loadBtn.disabled = true;
  filterInput.value = ''; 
  allUsers = [];
  usersList.textContent = ''; 

  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    allUsers = await response.json();
    statusMsg.textContent = 'Users loaded successfully!';
    renderUsers(allUsers);
    
  } catch (error) {
    statusMsg.textContent = `Error loading users: ${error.message}`;
  } finally {
    loadBtn.disabled = false;
  }
}

// Event Listeners
loadBtn.addEventListener('click', loadUsers);

// Filter array based on input
filterInput.addEventListener('input', (event) => {
  if (allUsers.length === 0) return; // Do nothing if users aren't loaded

  const searchTerm = event.target.value.toLowerCase();
  
  const filteredUsers = allUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm)
  );

  // Clear success/error message and render new list
  if (filteredUsers.length > 0) {
    statusMsg.textContent = ''; 
  }
  renderUsers(filteredUsers);
});