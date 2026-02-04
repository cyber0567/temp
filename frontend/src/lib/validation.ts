const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  if (!value.trim()) return "Email is required";
  if (!EMAIL_REGEX.test(value.trim())) return "Please enter a valid email address";
  return null;
}

export function validatePassword(value: string, minLength = 8): string | null {
  if (!value) return "Password is required";
  if (value.length < minLength) return `Password must be at least ${minLength} characters`;
  return null;
}

export function validateConfirmPassword(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) return "Please confirm your password";
  if (password !== confirmPassword) return "Passwords do not match";
  return null;
}
