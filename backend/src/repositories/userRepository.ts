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

export async function updateUser(id: number, userData: Partial<User>): Promise<User | null> {
  const user = await userRepository.findOneBy({ id });

  if (!user) {
    return null;
  }

  user.name = userData.name ?? user.name;
  user.email = userData.email ?? user.email;

  return userRepository.save(user);
}

export async function deleteUser(id: number): Promise<boolean> {
  const result = await userRepository.delete(id);
  return !!result.affected && result.affected > 0;
}   
