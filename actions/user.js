import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export const getCurrentUser = async() => {
    const user = await currentUser();
    if(!user) return null;

    try {
        const dbUser = await db.user.findUnique({
            where: {clerkUserId: user.id},
            select: {
                role: true,
                credits: true,
                name: true,
                imageUrl: true,
                title: true,
                company: true,
            }
        })
        return dbUser;
    } catch (error) {
        console.error("Error fetching current user:", error);
        return null;
    }
}