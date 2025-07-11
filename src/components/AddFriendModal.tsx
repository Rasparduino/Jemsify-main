import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader, Check, AlertCircle } from 'lucide-react';

interface AddFriendModalProps {
  onClose: () => void;
  onAddFriend: (email: string) => Promise<string>;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({ onClose, onAddFriend }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleAdd = async () => {
    if (!email.trim()) return;
    setStatus('loading');
    setMessage('');
    const resultMessage = await onAddFriend(email.trim());
    if (resultMessage === 'success') {
      setStatus('success');
      setMessage('Friend added successfully!');
      setTimeout(() => onClose(), 1500);
    } else {
      setStatus('error');
      setMessage(resultMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  const renderStatusIcon = () => {
    switch (status) {
      case 'loading': return <Loader className="animate-spin text-accent" />;
      case 'success': return <Check className="text-green-500" />;
      case 'error': return <AlertCircle className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-secondary rounded-xl w-full max-w-sm p-5 shadow-lg flex flex-col gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-text-primary">Add Friend</h2>
            <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-white/10"><X size={20} /></button>
          </div>
          <div>
            <label htmlFor="friendEmail" className="text-sm font-medium text-text-secondary mb-2 block">
              Enter your friend's email
            </label>
            <input
              id="friendEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="friend@example.com"
              className="w-full px-4 py-3 bg-primary text-text-primary rounded-lg border-2 border-transparent outline-none focus:ring-2 focus:ring-accent transition-all"
              autoFocus
            />
          </div>
          {message && (
            <div className="flex items-center gap-2 text-sm">
                {renderStatusIcon()}
                <p className={`${status === 'error' ? 'text-red-400' : 'text-text-secondary'}`}>{message}</p>
            </div>
          )}
          <div className="flex justify-end items-center gap-3 mt-2">
             <button onClick={onClose} className="px-4 py-2 rounded-full text-text-secondary hover:bg-white/10 transition-colors">Cancel</button>
            <button
                onClick={handleAdd}
                disabled={!email.trim() || status === 'loading'}
                className="px-6 py-2 rounded-full bg-accent text-primary font-bold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-secondary"
            >
                Add
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};