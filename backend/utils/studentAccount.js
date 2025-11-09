// Utility functions for student account creation
export function generateSecurePassword(studentId) {
  // Create a password that includes:
  // - First 4 chars of student ID
  // - Random 2-digit number
  // - Special character
  // - Random uppercase letter
  // - Random lowercase letter
  // - Additional random letter
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = Math.floor(Math.random() * 90 + 10); // 10-99
  const specialChars = '!@#$%^&*';
  const special = specialChars[Math.floor(Math.random() * specialChars.length)];
  const upperLetter = upperChars[Math.floor(Math.random() * upperChars.length)];
  const lowerLetter = lowerChars[Math.floor(Math.random() * lowerChars.length)];
  const randomLetter = Math.random() < 0.5 
    ? upperChars[Math.floor(Math.random() * upperChars.length)]
    : lowerChars[Math.floor(Math.random() * lowerChars.length)];
  
  return `${studentId.substr(0, 4)}${numbers}${special}${upperLetter}${lowerLetter}${randomLetter}`;
}

export function generateStudentEmail(studentId, firstName, lastName, domain = 'edo-rms.com') {
  // Create email using:
  // firstname.lastname.XXXX@domain
  // where XXXX is last 4 chars of student ID
  const sanitize = (str) => str.toLowerCase().replace(/[^a-z]/g, '');
  const firstPart = sanitize(firstName);
  const lastPart = sanitize(lastName);
  const idPart = studentId.slice(-4);
  
  return `${firstPart}.${lastPart}.${idPart}@${domain}`;
}