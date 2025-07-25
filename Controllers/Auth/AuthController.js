export const authValidator = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    return res.status(200).json({ success: true, message: "Authorized" });
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
