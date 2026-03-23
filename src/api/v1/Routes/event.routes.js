import express from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { getEvents } from "../Controllers/event.controller.js";

const router = express.Router();

router.get("/events", authenticate, getEvents);

export default router;