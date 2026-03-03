import logger from '../../../helper/logger.js';
import jwt from 'jsonwebtoken';
import User from '../Models/user.js';

class AuthController {

  // ----------------------- LOGIN -----------------------
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
      }

      // Find user by email
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }

      // Simple password comparison
      const isPasswordValid = password === user.password;
      
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          name: user.name,
          role_id: user.role_id 
        },
        process.env.JWT_SECRET || 'your-secret-key-change-in-env',
        { expiresIn: '7d' }
      );

      // Update last login
      user.last_login = new Date();
      await user.save();

      return res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role_id: user.role_id
        }
      });

    } catch (error) {
      logger.error(error);
      return res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
  }
}

export default new AuthController();
