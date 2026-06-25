"use server";

import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { StreamClient } from "@stream-io/node-sdk";

export const getCallData = async (callId) => {
    const user = await currentUser();
    if (!user) {
        return { error: "Unauthorized" }
    }

    try {
        const booking = await db.booking.findUnique({
            where: { streamCallId: callId },
            include: {
                interviewee: {
                    select: {
                        id: true,
                        clerkUserId: true,
                        name: true,
                        imageUrl: true,
                    }
                },
                interviewer: {
                    select: {
                        id: true,
                        clerkUserId: true,
                        name: true,
                        imageUrl: true,
                        categories: true,
                    }
                }
            }
        });

        if (!booking) {
            return { error: "Call not found" }
        }

        const isInterviewee = booking.interviewee.clerkUserId === user.id;
        const isInterviewer = booking.interviewer.clerkUserId === user.id;

        if (!isInterviewee && !isInterviewer) {
            return { error: "Forbidden" }
        }

        const streamClient = new StreamClient(
            process.env.NEXT_PUBLIC_STREAM_API_KEY,
            process.env.STREAM_SECRET_KEY,
        );

        const token = streamClient.generateUserToken({
            user_id: user.id,
            validity_in_seconds: 3600, // Token valid for 1 hour
        });

        return {
            token,
            isInterviewee,
            isInterviewer,
            currentUser: {
                id: user.id,
                name: `${user.firstName} ${user.lastName}`.trim(),
                imageUrl: user.imageUrl,
            },
            booking: {
                id: booking.id,
                interviewee: booking.interviewee,
                interviewer: booking.interviewer,
                categories: booking.interviewer.categories,
                startTime: booking.startTime,
                endTime: booking.endTime,
            }
        }
    } catch (error) {
        return { error: error.message || "Internal Server Error" }
    }
};