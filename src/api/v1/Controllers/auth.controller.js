import logger from '../../../helper/logger.js';

class AuthController {

  // ----------------------- LOGIN -----------------------
  async login(req, res) {
    try {


    } catch (error) {
      logger.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
}

export default new AuthController();
