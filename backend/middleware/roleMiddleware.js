// backend/middleware/roleMiddleware.js
import asyncHandler from "express-async-handler";

export const authorizeRoles = (...allowedRoles) =>
  asyncHandler((req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error("Not authenticated");
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error("Not authorized");
    }
    next();
  });
