import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Signup: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signup, error } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }
    setLocalError(null);
    signup(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center mb-6">Create an account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            required
            minLength={6}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          {/* Display server error or local validation error */}
          {(error || localError) && <p className="text-red-500 text-sm">{error || localError}</p>}
          <button type="submit" className="w-full p-3 bg-green-500 text-black font-bold rounded-full hover:bg-green-400">
            Sign Up
          </button>
        </form>
        <p className="text-center mt-4 text-gray-400">
          Already have an account?{' '}
          <button onClick={onSwitch} className="text-green-500 hover:underline">
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};