import type { Request, Response, NextFunction } from "express";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!(req as Request & { userId?: string }).userId) {
     (req as Request & { userId?: string }).userId = "mocked_user_123";
  }
  next();
};
