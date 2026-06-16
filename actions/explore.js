import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export const getInterviewers = async () => {
    const user = await currentUser();

    try {
        const interviewers = await db.user.findMany({
            where: {
                role: "INTERVIEWER",
                ...(user && {id: {not: user.id}}),
            },
            select: {
                id: true,
                name: true,
                imageUrl: true,
                title: true,
                company: true,
                yearsExp: true,
                bio: true,
                categories: true,
                creditRate: true,
                availabilities: {
                    where: {status: "AVAILABLE"},
                    select: {startTime: true, endTime: true},
                    take: 1,
                }
            },
            orderBy: {createdAt: "desc"},
        });

        return interviewers;
    } catch (error) {
        console.error("Error fetching interviewers: ", error);
        return [];
    }
};