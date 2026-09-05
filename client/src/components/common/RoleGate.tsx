import React from 'react';
import { useAuthStore } from '../../store/authStore';

interface RoleGateProps {
  roles: Array<'admin' | 'veterinarian' | 'caretaker' | 'volunteer'>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGate: React.FC<RoleGateProps> = ({ roles, children, fallback = null }) => {
  const user = useAuthStore((s) => s.user);

  if (!user || !roles.includes(user.role as any)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleGate;
