// Constants & API Base URL
const API_BASE = '/api';

// Current State
let currentUser = null;
let token = localStorage.getItem('token');
let allUsersList = [];
let pendingDeleteAction = null;

// Page Elements
const authSection = document.getElementById('auth-section');
const profileSection = document.getElementById('profile-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');

// Navigation Views
const viewMyProfile = document.getElementById('view-my-profile');
const viewUserDirectory = document.getElementById('view-user-directory');
const navBtnProfile = document.getElementById('nav-btn-profile');
const navBtnDirectory = document.getElementById('nav-btn-directory');

// Profile View Elements
const viewName = document.getElementById('view-name');
const viewEmail = document.getElementById('view-email');
const viewPhone = document.getElementById('view-phone');
const viewBio = document.getElementById('view-bio');
const summaryName = document.getElementById('summary-name');
const summaryUsername = document.getElementById('summary-username');
const sidebarJoined = document.getElementById('sidebar-joined');
const profileAvatarImg = document.getElementById('profile-avatar-img');

// Edit Form Elements
const editName = document.getElementById('edit-name');
const editPhone = document.getElementById('edit-phone');
const editEmail = document.getElementById('edit-email');
const editBio = document.getElementById('edit-bio');
const profileViewPanel = document.getElementById('profile-view-panel');
const profileEditPanel = document.getElementById('profile-edit-panel');
const avatarLoader = document.getElementById('avatar-loader');

// Default Avatar URL
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop';

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  if (token) {
    checkAuthSession();
  } else {
    showAuthView();
  }
});

// Verify token on load
async function checkAuthSession() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      currentUser = data;
      showProfileView();
      showToast('Logged in automatically', 'success');
    } else {
      handleLogout(false);
    }
  } catch (err) {
    console.error('Session authentication check failed:', err);
    showAuthView();
  }
}

// ==========================================
// AUTH VIEW LOGIC
// ==========================================
function switchTab(tab) {
  if (tab === 'login') {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  }
}

function showAuthView() {
  authSection.classList.remove('hidden');
  profileSection.classList.add('hidden');
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showToast('Please enter both email and password', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      token = data.token;
      currentUser = data.user;
      localStorage.setItem('token', token);
      showProfileView();
      showToast('Login successful! Welcome back.', 'success');
      loginForm.reset();
    } else {
      showToast(data.message || 'Login failed.', 'error');
    }
  } catch (err) {
    console.error('Login error:', err);
    showToast('Server connection failed.', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  if (!username || !email || !password) {
    showToast('Please fill out all required fields', 'error');
    return;
  }

  if (username.length < 3) {
    showToast('Username must be at least 3 characters long', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters long', 'error');
    return;
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      token = data.token;
      currentUser = data.user;
      localStorage.setItem('token', token);
      showProfileView();
      showToast('Registration successful!', 'success');
      registerForm.reset();
    } else {
      showToast(data.message || 'Registration failed.', 'error');
    }
  } catch (err) {
    console.error('Registration error:', err);
    showToast('Server connection failed.', 'error');
  }
}

function handleLogout(notify = true) {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  showAuthView();
  if (notify) {
    showToast('Logged out successfully', 'success');
  }
}

// ==========================================
// NAVIGATION & VIEWS TOGGLING
// ==========================================
function showProfileView() {
  authSection.classList.add('hidden');
  profileSection.classList.remove('hidden');
  switchNavView('profile');
  updateProfileDOM();
}

function switchNavView(view) {
  if (view === 'profile') {
    navBtnProfile.classList.add('active');
    navBtnDirectory.classList.remove('active');
    viewMyProfile.classList.remove('hidden');
    viewUserDirectory.classList.add('hidden');
  } else if (view === 'directory') {
    navBtnProfile.classList.remove('active');
    navBtnDirectory.classList.add('active');
    viewMyProfile.classList.add('hidden');
    viewUserDirectory.classList.remove('hidden');
    fetchUsersDirectory();
  }
}

function updateProfileDOM() {
  if (!currentUser) return;

  viewName.textContent = currentUser.name || 'Not provided';
  viewEmail.textContent = currentUser.email || 'Not provided';
  viewPhone.textContent = currentUser.phone || 'Not provided';
  viewBio.textContent = currentUser.bio || 'Write something about yourself...';

  summaryName.textContent = currentUser.name || currentUser.username;
  summaryUsername.textContent = `@${currentUser.username}`;
  
  if (currentUser.createdAt) {
    const date = new Date(currentUser.createdAt);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    sidebarJoined.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }

  if (currentUser.profileImage) {
    profileAvatarImg.src = `/${currentUser.profileImage}`;
  } else {
    profileAvatarImg.src = DEFAULT_AVATAR;
  }

  editName.value = currentUser.name || '';
  editPhone.value = currentUser.phone || '';
  editEmail.value = currentUser.email || '';
  editBio.value = currentUser.bio || '';
}

function enableEditMode() {
  profileViewPanel.classList.add('hidden');
  profileEditPanel.classList.remove('hidden');
}

function disableEditMode() {
  profileViewPanel.classList.remove('hidden');
  profileEditPanel.classList.add('hidden');
  updateProfileDOM();
}

async function handleProfileUpdate(e) {
  e.preventDefault();

  const name = editName.value.trim();
  const phone = editPhone.value.trim();
  const email = editEmail.value.trim();
  const bio = editBio.value.trim();

  if (!email) {
    showToast('Email address is required', 'error');
    return;
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/profile/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, phone, email, bio })
    });

    const data = await res.json();

    if (res.ok) {
      currentUser = data;
      updateProfileDOM();
      disableEditMode();
      showToast('Profile updated successfully!', 'success');
    } else {
      showToast(data.message || 'Profile update failed.', 'error');
    }
  } catch (err) {
    console.error('Update profile error:', err);
    showToast('Server connection failed.', 'error');
  }
}

// ==========================================
// IMAGE UPLOAD LOGIC
// ==========================================
function triggerImageUpload() {
  document.getElementById('profile-image-input').click();
}

async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('Image size limit is 5MB', 'error');
    e.target.value = '';
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    showToast('Only JPEG, PNG, GIF, and WEBP images are allowed', 'error');
    e.target.value = '';
    return;
  }

  avatarLoader.classList.remove('hidden');

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch(`${API_BASE}/profile/upload-image`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      currentUser.profileImage = data.profileImage;
      profileAvatarImg.src = `/${data.profileImage}?t=${Date.now()}`;
      showToast('Profile photo updated!', 'success');
    } else {
      showToast(data.message || 'Image upload failed.', 'error');
    }
  } catch (err) {
    console.error('Image upload server error:', err);
    showToast('Failed to upload image.', 'error');
  } finally {
    avatarLoader.classList.add('hidden');
    e.target.value = '';
  }
}

// ==========================================
// USER DIRECTORY & MANAGEMENT CRUD
// ==========================================
async function fetchUsersDirectory() {
  try {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      allUsersList = await res.json();
      document.getElementById('users-count-num').textContent = allUsersList.length;
      renderUsersGrid(allUsersList);
    } else {
      showToast('Failed to load user directory.', 'error');
    }
  } catch (err) {
    console.error('Fetch users error:', err);
    showToast('Error loading user list.', 'error');
  }
}

function renderUsersGrid(users) {
  const container = document.getElementById('users-grid');
  container.innerHTML = '';

  if (users.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3rem;">
        <i class="fa-solid fa-users-slash" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
        <p>No users found matching your criteria.</p>
      </div>
    `;
    return;
  }

  users.forEach(user => {
    const userCard = document.createElement('div');
    userCard.className = 'user-card fade-in';

    const avatarSrc = user.profileImage ? `/${user.profileImage}` : DEFAULT_AVATAR;
    const isCurrent = currentUser && (currentUser.id === user._id || currentUser._id === user._id);

    userCard.innerHTML = `
      <img src="${avatarSrc}" alt="${user.username}" class="user-card-avatar">
      <h3 class="user-card-name">${user.name || user.username} ${isCurrent ? '<span class="badge badge-active" style="font-size:0.65rem">YOU</span>' : ''}</h3>
      <p class="user-card-username">@${user.username}</p>
      
      <div class="user-card-details">
        <div><i class="fa-regular fa-envelope"></i> ${user.email}</div>
        <div><i class="fa-solid fa-phone"></i> ${user.phone || 'No phone'}</div>
      </div>

      <div class="user-card-actions">
        <button onclick="openEditUserModal('${user._id}')" class="btn btn-secondary btn-sm">
          <i class="fa-regular fa-pen-to-square"></i> Edit
        </button>
        <button onclick="confirmDeleteUser('${user._id}', '${user.username}')" class="btn btn-danger btn-sm">
          <i class="fa-solid fa-trash-can"></i> Delete
        </button>
      </div>
    `;

    container.appendChild(userCard);
  });
}

function handleUserSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  if (!query) {
    renderUsersGrid(allUsersList);
    return;
  }

  const filtered = allUsersList.filter(user => 
    (user.name && user.name.toLowerCase().includes(query)) ||
    (user.username && user.username.toLowerCase().includes(query)) ||
    (user.email && user.email.toLowerCase().includes(query))
  );

  renderUsersGrid(filtered);
}

// ADD USER MODAL LOGIC
function openAddUserModal() {
  document.getElementById('add-user-form').reset();
  document.getElementById('modal-add-user').classList.remove('hidden');
}

async function handleAddUserSubmit(e) {
  e.preventDefault();

  const username = document.getElementById('add-username').value.trim();
  const password = document.getElementById('add-password').value;
  const name = document.getElementById('add-name').value.trim();
  const email = document.getElementById('add-email').value.trim();
  const phone = document.getElementById('add-phone').value.trim();
  const bio = document.getElementById('add-bio').value.trim();

  try {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username, password, name, email, phone, bio })
    });

    const data = await res.json();

    if (res.status === 201) {
      showToast(`User @${username} added successfully!`, 'success');
      closeModal('modal-add-user');
      fetchUsersDirectory();
    } else {
      showToast(data.message || 'Failed to add user', 'error');
    }
  } catch (err) {
    console.error('Add user error:', err);
    showToast('Server connection failed.', 'error');
  }
}

// EDIT USER MODAL LOGIC
function openEditUserModal(userId) {
  const targetUser = allUsersList.find(u => u._id === userId || u.id === userId);
  if (!targetUser) {
    showToast('User data not found.', 'error');
    return;
  }

  document.getElementById('manage-edit-user-id').value = targetUser._id || targetUser.id;
  document.getElementById('manage-edit-username').value = targetUser.username || '';
  document.getElementById('manage-edit-email').value = targetUser.email || '';
  document.getElementById('manage-edit-name').value = targetUser.name || '';
  document.getElementById('manage-edit-phone').value = targetUser.phone || '';
  document.getElementById('manage-edit-bio').value = targetUser.bio || '';

  document.getElementById('modal-edit-user').classList.remove('hidden');
}

async function handleManageEditUserSubmit(e) {
  e.preventDefault();

  const userId = document.getElementById('manage-edit-user-id').value;
  const username = document.getElementById('manage-edit-username').value.trim();
  const email = document.getElementById('manage-edit-email').value.trim();
  const name = document.getElementById('manage-edit-name').value.trim();
  const phone = document.getElementById('manage-edit-phone').value.trim();
  const bio = document.getElementById('manage-edit-bio').value.trim();

  try {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username, email, name, phone, bio })
    });

    const data = await res.json();

    if (res.ok) {
      showToast(`User @${data.username} updated!`, 'success');
      closeModal('modal-edit-user');
      
      // If we updated our own profile, update local currentUser
      if (currentUser && (currentUser._id === userId || currentUser.id === userId)) {
        currentUser = data;
        updateProfileDOM();
      }

      fetchUsersDirectory();
    } else {
      showToast(data.message || 'Update failed.', 'error');
    }
  } catch (err) {
    console.error('Update user error:', err);
    showToast('Server error during update.', 'error');
  }
}

// DELETE USER LOGIC
function confirmDeleteUser(userId, username) {
  document.getElementById('delete-confirm-message').textContent = `Are you sure you want to delete user "@${username}"? All profile data and uploaded photos will be permanently removed.`;
  
  pendingDeleteAction = () => executeDeleteUser(userId);
  document.getElementById('modal-confirm-delete').classList.remove('hidden');
}

async function executeDeleteUser(userId) {
  try {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();

    if (res.ok) {
      showToast('User deleted successfully.', 'success');
      closeModal('modal-confirm-delete');

      // If user deleted themselves from directory, log out
      if (currentUser && (currentUser._id === userId || currentUser.id === userId)) {
        handleLogout(false);
      } else {
        fetchUsersDirectory();
      }
    } else {
      showToast(data.message || 'Deletion failed.', 'error');
    }
  } catch (err) {
    console.error('Delete user error:', err);
    showToast('Server connection failed.', 'error');
  }
}

// DELETE ACCOUNT (SELF) LOGIC
function promptDeleteAccount() {
  document.getElementById('delete-confirm-message').textContent = 'Are you sure you want to delete your account? This action is permanent and cannot be undone.';
  pendingDeleteAction = executeDeleteAccount;
  document.getElementById('modal-confirm-delete').classList.remove('hidden');
}

async function executeDeleteAccount() {
  try {
    const res = await fetch(`${API_BASE}/profile/delete`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();

    if (res.ok) {
      closeModal('modal-confirm-delete');
      showToast('Your account has been deleted.', 'success');
      handleLogout(false);
    } else {
      showToast(data.message || 'Failed to delete account.', 'error');
    }
  } catch (err) {
    console.error('Account deletion error:', err);
    showToast('Server error.', 'error');
  }
}

// MODAL UTILITIES
function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

// Attach listener to confirm delete button
document.addEventListener('DOMContentLoaded', () => {
  const confirmBtn = document.getElementById('confirm-delete-action-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (pendingDeleteAction) {
        pendingDeleteAction();
        pendingDeleteAction = null;
      }
    });
  }
});

// ==========================================
// TOAST SYSTEM
// ==========================================
function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toast-container');
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' 
    ? '<i class="fa-solid fa-circle-check"></i>' 
    : '<i class="fa-solid fa-triangle-exclamation"></i>';
    
  toast.innerHTML = `${icon} <span>${message}</span>`;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3500);
}
