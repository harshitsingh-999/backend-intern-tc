export const isValidEmail = (email) => {
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  if (!phone) return false;

  // Remove spaces, dashes
  const normalized = phone.toString().replace(/[\s-]/g, '');

  // Allow:
  // 10 digits
  // 91XXXXXXXXXX
  // +91XXXXXXXXXX
  const phoneRegex = /^(?:\+91|91)?[6-9][0-9]{9}$/;

  return phoneRegex.test(normalized);
};

export const isValidPassword = (password) => {
  // must contain @ ! 1 2
  return (
    password.includes('@') &&
    password.includes('!') &&
    password.includes('1') &&
    password.includes('2')
  );
};
