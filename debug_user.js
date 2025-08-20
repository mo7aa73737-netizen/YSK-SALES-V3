// Debug script to check user permissions
console.log('Testing user permissions...');

// Check localStorage for users
const users = JSON.parse(localStorage.getItem('users') || '[]');
console.log('Users in localStorage:', users);

// Check current user
const currentUser = JSON.parse(localStorage.getItem('rememberedUser') || 'null');
console.log('Current user:', currentUser);

if (currentUser) {
    const user = users.find(u => u.name === currentUser);
    console.log('Found user:', user);
    if (user && user.permissions) {
        console.log('User permissions:', user.permissions);
        Object.entries(user.permissions).forEach(([page, hasAccess]) => {
            console.log(`Page ${page}: ${hasAccess}`);
        });
    }
}