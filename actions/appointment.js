import { db } from "@/lib/prisma";

export const getIntervieweeAppointments = async ({dbUser}) => {
    if(!dbUser) return [];

    try {
        const appointments = await db.booking.findMany({
            where: {intervieweeId: dbUser.id},
            include: {
                interviewer: {
                    select: {
                        name: true,
                        imageUrl: true,
                        email: true,
                        title: true,
                        company: true,
                        categories: true
                    }
                },
                feedback: true,
            },
            orderBy: {startTime: "desc"},
        });

        return appointments;
    } catch (error) {
        console.error('Error fetching interviewee appointments:', error);
        return [];
    }
};