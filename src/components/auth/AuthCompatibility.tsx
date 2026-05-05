'use client';

import React from 'react';
import Link from 'next/link';

export const LoginLink = ({ children, className, ...props }: any) => {
  return (
    <a href="/api/auth/login" className={className} {...props}>
      {children}
    </a>
  );
};

export const RegisterLink = ({ children, className, ...props }: any) => {
  return (
    <a href="/api/auth/signup" className={className} {...props}>
      {children}
    </a>
  );
};

export const LogoutLink = ({ children, className, ...props }: any) => {
  return (
    <a href="/api/auth/logout" className={className} {...props}>
      {children}
    </a>
  );
};
