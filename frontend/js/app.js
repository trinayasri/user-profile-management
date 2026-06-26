// Constants & API Base URL
// Since frontend is served by the backend, we use relative endpoints to ensure seamless compatibility.
const API_BASE = '/api';

// Current State
let currentUser = null;
let token = localStorage.getItem('token');

// Page Elements
const authSection = document.getElementById('auth-section');
const profileSection = document.getElementById('profile-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');

// Profile Elements (View)
const viewName = document.getElementById('view-name');
const viewEmail = document.getElementById('view-email');
const viewPhone = document.getElementById('view-phone');
const viewBio = document.getElementById('view-bio');
const summaryName = document.getElementById('summary-name');
const summaryUsername = document.getElementById('summary-username');
const sidebarJoined = document.getElementById('sidebar-joined');
const profileAvatarImg = document.getElementById('profile-avatar-img');

// Profile Elements (Edit Form)
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
      // Token invalid or expired
      handleLogout(false);
    }
  } catch (err) {
    console.error('Session authentication check failed:', err);
    // Offline or server down; fallback to showing auth screen
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
  document.body.classList.remove('dashboard-active');
}

// Handle login request
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
      headers: {
        'Content-Type': 'application/json'
      },
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
      showToast(data.message || 'Login failed. Invalid credentials.', 'error');
    }
  } catch (err) {
    console.error('Login error:', err);
    showToast('Server connection failed. Try again later.', 'error');
  }
}

// Handle registration request
async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  // Frontend Validations
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

  // Simple Email Regex Validation
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      token = data.token;
      currentUser = data.user;
      localStorage.setItem('token', token);
      showProfileView();
      showToast('Registration successful! Account created.', 'success');
      registerForm.reset();
    } else {
      showToast(data.message || 'Registration failed.', 'error');
    }
  } catch (err) {
    console.error('Registration error:', err);
    showToast('Server connection failed. Try again later.', 'error');
  }
}

// Handle user logout
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
// PROFILE VIEW LOGIC
// ==========================================
function showProfileView() {
  authSection.classList.add('hidden');
  profileSection.classList.remove('hidden');
  document.body.classList.add('dashboard-active');
  
  // Populate UI details
  updateProfileDOM();
}

function updateProfileDOM() {
  if (!currentUser) return;

  // View fields
  viewName.textContent = currentUser.name || 'Not provided';
  viewEmail.textContent = currentUser.email || 'Not provided';
  viewPhone.textContent = currentUser.phone || 'Not provided';
  viewBio.textContent = currentUser.bio || 'Write something about yourself...';

  // Sidebar fields
  summaryName.textContent = currentUser.name || currentUser.username;
  summaryUsername.textContent = `@${currentUser.username}`;
  
  // Created at date
  if (currentUser.createdAt) {
    const date = new Date(currentUser.createdAt);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    sidebarJoined.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }

  // Set Profile Image
  if (currentUser.profileImage) {
    // Relative path to backend (e.g. uploads/file.png)
    profileAvatarImg.src = `/${currentUser.profileImage}`;
  } else {
    profileAvatarImg.src = DEFAULT_AVATAR;
  }

  // Pre-populate input fields
  editName.value = currentUser.name || '';
  editPhone.value = currentUser.phone || '';
  editEmail.value = currentUser.email || '';
  editBio.value = currentUser.bio || '';
}

// Toggle edit/view panels
function enableEditMode() {
  profileViewPanel.classList.add('hidden');
  profileEditPanel.classList.remove('hidden');
}

function disableEditMode() {
  profileViewPanel.classList.remove('hidden');
  profileEditPanel.classList.add('hidden');
  
  // Reset form inputs to current user states
  updateProfileDOM();
}

// Handle profile text updates
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
// PROFILE IMAGE UPLOAD LOGIC
// ==========================================
function triggerImageUpload() {
  document.getElementById('profile-image-input').click();
}

async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // File size validation (Max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showToast('Image size limit is 5MB', 'error');
    e.target.value = ''; // Reset file input
    return;
  }

  // File type validation
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    showToast('Only JPEG, PNG, GIF, and WEBP images are allowed', 'error');
    e.target.value = ''; // Reset file input
    return;
  }

  // Show loading spinner
  avatarLoader.classList.remove('hidden');

  // Build Multipart Form Data
  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch(`${API_BASE}/profile/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      currentUser.profileImage = data.profileImage;
      // Force DOM update of avatar
      profileAvatarImg.src = `/${data.profileImage}?t=${Date.now()}`; // Add timestamp cache buster
      showToast('Profile photo updated!', 'success');
    } else {
      showToast(data.message || 'Image upload failed.', 'error');
    }
  } catch (err) {
    console.error('Image upload server error:', err);
    showToast('Failed to upload image. Server error.', 'error');
  } finally {
    // Hide loading spinner
    avatarLoader.classList.add('hidden');
    e.target.value = ''; // Reset input
  }
}

// ==========================================
// TOAST SYSTEM
// ==========================================
function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toast-container');
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Determine icon
  const icon = type === 'success' 
    ? '<i class="fa-solid fa-circle-check"></i>' 
    : '<i class="fa-solid fa-triangle-exclamation"></i>';
    
  toast.innerHTML = `${icon} <span>${message}</span>`;
  
  // Append to container
  toastContainer.appendChild(toast);
  
  // Slide out and remove after delay
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3500);
}
