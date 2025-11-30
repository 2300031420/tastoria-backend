import express from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs";
import { getModelsFromRequest } from '../utils/getModels.js';

const router = express.Router();

//Login 
router.post("/login", async (req, res) => {
  const { userEmail, password, tenantId } = req.body;

  try {
    // Use tenantId from request body or from middleware
    const finalTenantId = tenantId || req.tenantId || 'tastoria';
    const { Admin } = getModelsFromRequest({ tenantId: finalTenantId });
    
    const admin = await Admin.findOne({ userEmail });
    if (!admin) return res.status(401).json({ message: "Invalid Email" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // JWT includes cafeName (tenantId)
    const token = jwt.sign(
      {
        id: admin._id,
        userEmail: admin.userEmail,
        cafeName: finalTenantId, // Use tenantId as cafeName
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      message: `Login Successful for ${finalTenantId}`,
    });
  } catch (error) {
    res.status(500).json({ message: "Login Failed", error: error.message });
  }
});

router.post("/create-admin", async (req, res) => {
  try {
    const { userEmail, password, tenantId } = req.body;

    // Use tenantId from request body or from middleware
    const finalTenantId = tenantId || req.tenantId || 'tastoria';
    const { Admin } = getModelsFromRequest({ tenantId: finalTenantId });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      userEmail,
      password: hashedPassword,
      cafeName: finalTenantId, // Store tenantId as cafeName for backward compatibility
    });

    await newAdmin.save();
    res.status(201).json({ message: `Admin for ${finalTenantId} created successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;