import React from 'react';
import { Home, Search, Library, Users } from 'lucide-react'; // Import Users icon

interface BottomNavigationProps {
  currentView: 'home' | 'search' | 'library' | 'friends' | 'sub-page';
  onViewChange: (view: 'home' | 'search' | 'library' | 'friends') => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'friends', label: 'Friends', icon: Users }, // New Friends Item
    { id: 'library', label: 'Your Library', icon: Library },
  ];

  const getActiveState = (itemId: string) => {
    if (itemId === currentView) return true;
    if (currentView === 'sub-page' && itemId === 'library') return true;
    return false;
  };

  return (
    <div className="bg-primary border-t border-secondary/50 px-2 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as any)}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors w-1/4 ${
              getActiveState(item.id)
                ? 'text-accent' 
                : 'text-text-secondary'
            }`}
          >
            <item.icon size={20} fill={getActiveState(item.id) ? 'currentColor' : 'none'}/>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};