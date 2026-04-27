import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import OwnerNavigator from './OwnerNavigator';
import MechanicNavigator from './MechanicNavigator';
import AdminNavigator from './AdminNavigator';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner fullScreen message="Starting up..." />;

  return (
    <NavigationContainer>
      {!user && <AuthNavigator />}
      {user?.role === 'CAR_OWNER' && <OwnerNavigator />}
      {user?.role === 'MECHANIC' && <MechanicNavigator />}
      {user?.role === 'ADMIN' && <AdminNavigator />}
    </NavigationContainer>
  );
}
