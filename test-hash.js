import bcrypt from 'bcrypt';

const password = 'temp123';
const hash = '$2b$10$brezoBLK/qCzENMU5jpPKOa/xwzN33eaN2Ivh1AcOZV2wLcaZeVNC';

const isValid = await bcrypt.compare(password, hash);
console.log('Does password match hash?', isValid);

// Generate a new hash
const newHash = await bcrypt.hash(password, 10);
console.log('New hash:', newHash);

// Test the new hash
const isValidNew = await bcrypt.compare(password, newHash);
console.log('Does password match new hash?', isValidNew);