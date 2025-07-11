import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center mb-6">Log in to μSync</h1>
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
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full p-3 bg-green-500 text-black font-bold rounded-full hover:bg-green-400">
            Log In
          </button>
        </form>
        <p className="text-center mt-4 text-gray-400">
          Don't have an account?{' '}
          <button onClick={onSwitch} className="text-green-500 hover:underline">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};