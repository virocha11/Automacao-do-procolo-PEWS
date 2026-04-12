import { AppDataSource } from "../config/database";
import { User } from "../entities/User";

const userRepository = AppDataSource.getRepository(User);

export async function getUsers(): Promise<User[]> {
    return userRepository.find();
}

export async function createUser(userData: Partial<User>): Promise<User> {
  const user = userRepository.create(userData);
  return userRepository.save(user);
}

export async function getUserById(id: number): Promise<User | null> {
  return userRepository.findOneBy({ id });
}