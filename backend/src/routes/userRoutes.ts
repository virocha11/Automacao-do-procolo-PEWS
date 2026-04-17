import { Router } from "express";
import { listUsers, addUser, listUserById, updateUser, deleteUser} from "../controllers/userController";
//import { UpdateQueryBuilder } from "typeorm";


const router = Router();

router.get("/users", listUsers);
router.post("/users", addUser);
router.get("/users/:id", listUserById);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

export default router;