import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function RoleGate({ children, allowedRoles, fallback = null }) {
  const { user } = useContext(AuthContext);

  if (!user || !allowedRoles.includes(user.role)) {
    return fallback;
  }

  return <>{children}</>;
}
