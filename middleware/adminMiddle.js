import jwt from "jsonwebtoken";
import { getTenantModels } from "../utils/getModels.js";

export const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // "Bearer token"
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get tenantId from JWT (cafeName) or from request
    const tenantId = decoded.cafeName || req.tenantId || 'tastoria';
    const { Admin } = getTenantModels(tenantId);
    
    const admin = await Admin.findById(decoded.id);

    if (!admin) return res.status(403).json({ message: "Admin not found" });

    req.admin = admin; // now has cafeName (which is tenantId)
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized", error: error.message });
  }
};
