export const verifyApiToken = (req, res, next) => {
  const token = req.headers["x-api-token"];

  if (!token || token !== process.env.WHATSAPP_API_TOKEN) {
    return res.status(401).json({
      success: false,
      message: "Invalid API token"
    });
  }

  // Attach SYSTEM USER
  req.user = {
    id: 4,                 // system / bot user
    role: "system",
    name: "WhatsApp Bot"
  };

  next();
};
