// Fix for user permissions issue
// This script should be run in browser console to fix the white screen issue

console.log('Fixing user permissions...');

// Get current users from localStorage
let users = JSON.parse(localStorage.getItem('users') || '[]');
console.log('Current users:', users);

// Fix any users without proper permissions
users = users.map(user => {
    if (!user.permissions || typeof user.permissions !== 'object') {
        console.log('Fixing permissions for user:', user.name);
        user.permissions = {
            0: true,  // Dashboard
            1: true,  // Products  
            2: true,  // Pos
            3: true,  // Customers
            4: true,  // Invoices
            5: user.id === 'u1' ? true : false  // Settings (only admin)
        };
    }
    return user;
});

// Save back to localStorage
localStorage.setItem('users', JSON.stringify(users));
console.log('Fixed users:', users);

console.log('User permissions fixed! Please refresh the page.');