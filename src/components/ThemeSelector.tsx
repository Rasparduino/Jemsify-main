import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface ThemeSelectorProps {
  onClose: () => void;
}

const themes = [
    { id: 'cyan', name: 'Cyber Cyan', gradient: 'from-[#0B0C10] to-[#1F2833]' },
    { id: 'synthwave', name: 'Synthwave', gradient: 'from-[#2A1B3D] to-[#4A3267]' },
    { id: 'dracula', name: 'Dracula', gradient: 'from-[#282a36] to-[#44475a]' },
    { id: 'nord', name: 'Nordic Night', gradient: 'from-[#2E3440] to-[#3B4252]' },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onClose }) => {
  const { theme: activeTheme, setTheme } = useTheme();

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
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-secondary rounded-xl w-full max-w-md p-6 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-text-primary">Choose a Theme</h2>
            <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-white/10"><X size={24} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
              {themes.map((themeOption) => (
                  <div key={themeOption.id} onClick={() => setTheme(themeOption.id as any)} className="cursor-pointer group">
                      <div className={`relative aspect-video rounded-lg bg-gradient-to-br ${themeOption.gradient} flex items-center justify-center p-2 border-2 transition-all ${activeTheme === themeOption.id ? 'border-accent' : 'border-transparent group-hover:border-white/20'}`}>
                          {activeTheme === themeOption.id && (
                              <motion.div initial={{scale:0}} animate={{scale:1}} className="absolute top-2 right-2 bg-accent text-primary rounded-full p-1">
                                  <Check size={16}/>
                              </motion.div>
                          )}
                          <span className="text-sm font-semibold text-white/80">{themeOption.name}</span>
                      </div>
                  </div>
              ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};