import express from "express"

const router = express.Router();

router.get("/basic-info", (req, res) => {
    
    res.json({ message: "User basic info endpoint" });
});

export default router;