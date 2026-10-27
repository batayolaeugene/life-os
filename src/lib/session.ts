import { db } from "@/db";
import { users, type User } from "@/db/schema";

export async function requireAuthUser(): Promise<User> {
  const activeUser = await db.query.users.findFirst();

  if (activeUser) {
    return activeUser;
  }

  const [createdUser] = await db
    .insert(users)
    .values({
      name: "LifeOS Owner",
      email: "owner@lifeos.local",
      passwordHash: "$2a$12$e8Y6W/XUeWJnXf9H751Ccu6uB1qF1rJq/dF/XG0l5M3zCkWk7P6qS",
    })
    .returning();

  return createdUser;
}
