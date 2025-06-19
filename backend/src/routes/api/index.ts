import express from "express";

const router = express.Router();

import hook from "./hook";
router.use("/hook", hook);

import card from "./card";
router.use("/card", card);

import user from "./user";
router.use("/user", user);

import pack from "./pack";
router.use("/pack", pack);

import session from "./session";
router.use("/session", session);

export default router;
