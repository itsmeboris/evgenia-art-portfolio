// Utility script to generate bcrypt hash for admin password
const bcrypt = require('bcrypt');

const password = 'ENTER_YOUR_PASSWORD'; // Your current password
const saltRounds = 12; // High security level

bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error generating hash:', err);
        return;
    }

    console.log('Password:', password);
    console.log('Hashed password:');
    console.log(hash);
    console.log('\nCopy the hash above and put it in your .env file as ADMIN_PASSWORD_HASH');
    console.log('Then remove this script for security.');
});