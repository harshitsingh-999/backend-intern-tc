// import logger from '../../../helper/logger.js';

// class AuthController {

//   // ----------------------- LOGIN -----------------------
//   async login(req, res) {
//     try {


//     } catch (error) {
//       logger.error(error);
//       return res.status(500).json({ message: "Internal Server Error" });
//     }
//   }
// }

// export default new AuthController();


import logger from '../../../helper/logger.js';

class AuthController {

  // ----------------------- LOGIN -----------------------
  async login(req, res) {
    try {

      // get data from request body
      const { email, password } = req.body;

      // check if fields are empty
      if (!email || !password) {
        return res.status(400).json({
          status: false,
          message: "Email and Password are required"
        });
      }

      // temporary login check (for testing)
      if (email === "admin@gmail.com" && password === "123456") {
        return res.status(200).json({
          status: true,
          message: "Login Successful",
          user: {
            email: email
          }
        });
      }

      // if credentials wrong
      return res.status(401).json({
        status: false,
        message: "Invalid email or password"
      });

    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        status: false,
        message: "Internal Server Error"
      });
    }
  }
}

export default new AuthController();