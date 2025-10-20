import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ServerProvider } from './context/ServerContext';
import { SpotifyProvider } from './context/SpotifyContext';
import { PlaylistProvider } from './context/PlaylistContext';
import { ThemeProvider } from './context/ThemeContext';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { MainApp } from './MainApp';
import { NetworkStatusProvider } from './context/NetworkStatusContext'; // Import the new provider

// This component contains the providers for the authenticated part of the app
const AuthenticatedApp: React.FC = () => {
    const { token } = useAuth();

    return (
        <ServerProvider>
            <PlaylistProvider token={token}>
                <SpotifyProvider>
                    <MainApp />
                </SpotifyProvider>
            </PlaylistProvider>
        </ServerProvider>
    );
};

// This component handles the logic for showing auth forms or the main app
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);

  if (!isAuthenticated) {
    return isLoginView 
      ? <Login onSwitch={() => setIsLoginView(false)} />
      : <Signup onSwitch={() => setIsLoginView(true)} />;
  }

  return <AuthenticatedApp />;
};

// The root App component wraps EVERYTHING in the necessary providers
function App() {
  return (
    <ThemeProvider>
      {/* --- THIS IS THE FIX --- */}
      {/* Wrap the AuthProvider with our new NetworkStatusProvider */}
      <NetworkStatusProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </NetworkStatusProvider>
    </ThemeProvider>
  );
}

export default App;
