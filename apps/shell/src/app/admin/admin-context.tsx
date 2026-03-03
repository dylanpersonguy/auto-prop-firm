'use client';

import { createContext, useContext } from 'react';

interface AdminCtx {
  email: string;
  loading: boolean;
}

export const AdminContext = createContext<AdminCtx>({ email: '', loading: true });
export const useAdmin = () => useContext(AdminContext);
