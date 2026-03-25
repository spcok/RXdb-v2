import React from 'react';
import { useAuthStore } from '../../store/authStore';
import LoginScreen from '../../features/auth/LoginScreen';

interface Props {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<Props> = ({ children }) => {
  const { currentUser } = useAuthStore();

  if (!currentUser) {
    return <LoginScreen />;
  }

  return <>{children}</>;
};
