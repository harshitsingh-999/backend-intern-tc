import logger from '../../../helper/logger.js';

class AuthController {

  // ----------------------- LOGIN -----------------------
  async login(req, res) {
    try {
console.log(req, "reqq")

return res.json({ success: true, message: "Login successful" });

    } catch (error) {
      logger.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
}

export default new AuthController();
