import React, { useState } from "react";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";
import { School } from "lucide-react";

export default function LoginForm({ redirectTo, role }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isInvalidEmail, setIsInvalidEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const nav = useNavigate();

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    setIsInvalidEmail(!isValid);
    return isValid;
  };

  // Form validation
  const validateForm = () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return false;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Form validation
    if (!validateForm()) {
      setSubmitAttempts(prev => prev + 1);
      return;
    }

    // Rate limiting with role-specific limits
    const maxAttempts = role === 'ministry' ? 3 : 5; // Stricter for ministry
    if (submitAttempts >= maxAttempts) {
      const waitTime = role === 'ministry' ? '30 minutes' : '15 minutes';
      setError(`Too many attempts. Please try again in ${waitTime}.`);
      return;
    }

    setLoading(true);
    try {
      // Role-specific email domain validation
      if (role === 'ministry' && !email.toLowerCase().endsWith('@edo.gov.ng')) {
        setError('Ministry login requires an official @edo.gov.ng email');
        return;
      }
      if (role === 'student' && !email.toLowerCase().endsWith('.edu.ng')) {
        setError('Student login requires a school email (@*.edu.ng)');
        return;
      }

      const user = await login(email.toLowerCase().trim(), password);
      
      // Enhanced role validation
      if (role && user.role !== role) {
        setError(`Access denied. This login is for ${role}s only.`);
        setSubmitAttempts(prev => prev + maxAttempts); // Immediate lockout for role mismatch
        return;
      }

      // Check approval status for students
      if (user.role === 'student' && !user.approved) {
        setError('Your account is pending ministry approval.');
        return;
      }

      nav(redirectTo || `/${user.role}`);
    } catch (err) {
      setSubmitAttempts(prev => prev + 1);
      const errorMessage = err.response?.data?.message || "Login failed. Please check your credentials.";
      setError(errorMessage);

      // Show lockout message if detected
      if (errorMessage.includes("locked")) {
        setSubmitAttempts(5); // Prevent further attempts
      }
    } finally {
      setLoading(false);
    }
  };

  const roleTitle = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Login";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <School className="text-edoBlue" size={48} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {roleTitle} Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Access your portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (isInvalidEmail) validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-edoBlue focus:border-edoBlue sm:text-sm ${
                    isInvalidEmail ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {isInvalidEmail && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {isInvalidEmail && (
                <p className="mt-1 text-sm text-red-600">
                  Please enter a valid email address
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-edoBlue focus:border-edoBlue sm:text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || submitAttempts >= 5}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading || submitAttempts >= 5
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-edoBlue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-edoBlue'
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>

            {submitAttempts >= 5 && (
              <div className="text-sm text-center text-red-600">
                Too many login attempts. Please try again later.
              </div>
            )}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-edoBlue focus:ring-edoBlue border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="/forgot-password" className="font-medium text-edoBlue hover:text-blue-700">
                  Forgot your password?
                </a>
              </div>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Need help?
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="text-center space-y-2">
                <p className="text-xs text-gray-500">
                  Having trouble logging in? Contact your administrator or:
                </p>
                <a href="/help" className="text-sm text-edoBlue hover:text-blue-700">
                  View Help Guide
                </a>
                <a href="/" className="text-sm text-gray-500 hover:text-gray-700 block">
                  Return to Login Selection
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
