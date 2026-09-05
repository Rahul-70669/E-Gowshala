import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export type UserRole =
  | 'admin'
  | 'veterinarian'
  | 'caretaker'
  | 'donor'
  | 'volunteer'
  | 'government';

/**
 * Factory function to create role-based access control middleware.
 * Pass in the roles that ARE allowed to access the route.
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
};
