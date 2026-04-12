import { Router } from "express";
import { listUsers, addUser, listUsersById } from "../controllers/userController";

const router = Router();

router.get("/users", listUsers);
router.post("/users", addUser);
router.get("/userById/:id", listUsersById);

export default router;