"use server";

import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";


export const setAvailability = async ({ startTime, endTime }) => {
    const user = await currentUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
    if (!dbUser || dbUser.role !== "INTERVIEWER") {
        throw new Error("Forbidden");
    }

    if (!startTime || !endTime) {
        throw new Error("Start and end time are required");
    }

    if (new Date(startTime) >= new Date(endTime)) {
        throw new Error("Start time must be before end time");
    }

    try {
        const existing = await db.availability.findFirst({
            where: {
                interviewerId: dbUser.id,
                status: "AVAILABLE",
            },
        });

        if (existing) {
            await db.availability.update({
                where: {
                    id: existing.id,
                },
                data: {
                    startTime,
                    endTime,
                },
            });
        } else {
            await db.availability.create({
                data: {
                    interviewerId: dbUser.id,
                    startTime,
                    endTime,
                    status: "AVAILABLE",
                },
            });
        }

        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("Error setting availability:", error);
        throw new Error("Failed to set availability");
    }
};

export const getAvailability = async () => {
    const user = await currentUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    try {
        const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
        if (!dbUser || dbUser.role !== "INTERVIEWER") {
            throw new Error("Interviewer not found or unauthorized");
        }

        const availability = await db.availability.findFirst({
            where: { interviewerId: dbUser.id, status: "AVAILABLE" }
        });

        return availability;
    } catch (error) {
        console.error("Error fetching availability:", error);
        throw new Error("Failed to fetch availability");
    }
};

export const getInterviewerAppointments = async () => {
    const user = await currentUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    try {
        const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
        if (!dbUser || dbUser.role !== "INTERVIEWER") {
            throw new Error("Interviewer not found or unauthorized");
        }

        const appointments = await db.booking.findMany({
            where: { interviewerId: dbUser.id },
            include: {
                interviewee: {
                    select: { name: true, imageUrl: true, email: true }
                },
                feedback: true
            },
            orderBy: { startTime: 'desc' }
        });

        return appointments;
    } catch (error) {
        console.error("Error fetching appointments:", error);
        throw new Error("Failed to fetch appointments");
    }
};

export const getInterviewerStats = async () => {
    const user = await currentUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    const dbUser = await db.user.findUnique({
        where: { clerkUserId: user.id },
        select: {
            creditBalance: true,
            creditRate: true,
            bookingsAsInterviewer: {
                where: { status: "COMPLETED" },
                select: { creditsCharged: true }
            }
        }
    });

    if (!dbUser) {
        throw new Error("User not found");
    }

    const totalCreditsEarned = dbUser.bookingsAsInterviewer.reduce((acc, booking) => acc + booking.creditsCharged, 0);

    return {
        creditBalance: dbUser.creditBalance,
        creditRate: dbUser.creditRate,
        totalCreditsEarned,
        completedSessions: dbUser.bookingsAsInterviewer.length,
    }
};

export const getWithdrawalHistory = async () => {
    const user = await currentUser();
    if (!user) {
        throw new Error("Unauthorized");
    }
    const dbUser = await db.user.findUnique({
        where: { clerkUserId: user.id },
    });
    if (!dbUser || dbUser.role !== "INTERVIEWER") {
        throw new Error("Forbidden");
    }

    try {
        const withdrawalHistory = await db.payout.findMany({
            where: { interviewerId: dbUser.id },
            select: {
                credits: true,
                platformFee: true,
                netAmount: true,
                paymentMethod: true,
                status: true,
                createdAt: true,
                adminNote: true,
                id: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return {success: true, withdrawalHistory};
    } catch (error) {
        console.error("Error fetching withdrawal history:", error);
        throw new Error("Failed to fetch withdrawal history");
    }
};

export const creditPayout = async ({ paymentDetails, paymentMethod, data }) => {
    const user = await currentUser();
    const dbUser = await db.user.findUnique({
        where: { clerkUserId: user.id },
    });

    if (!dbUser || dbUser.role !== "INTERVIEWER") {
        throw new Error("Forbidden");
    }

    if (!["paypal", "upi", "bank"].includes(paymentMethod)) {
        throw new Error("Invalid payment method");
    }

    // payment method = paypal => paymentDetails: {paypal}
    if (paymentMethod === "paypal" && !paymentDetails.paypal) {
        throw new Error("If payment method is paypal then payment details must have paypal detail");
    }

    // payment method = upi => paymentDetails: {upi}
    if (paymentMethod === "upi" && !paymentDetails.upi) {
        throw new Error("If payment method is upi then payment details must have upi id");
    }

    // payment method = bank => paymentDetails: {accountNumber, confirmAccountNumber, ifscCode, accountHolderName, bankName}
    if (paymentMethod === "bank" && (!paymentDetails.accountNumber || !paymentDetails.confirmAccountNumber || !paymentDetails.ifscCode || !paymentDetails.accountHolderName || !paymentDetails.bankName)) {
        throw new Error("If payment method is bank then payment details must have all the required fields");
    }

    try {
        const existing = await db.payout.findFirst({
            where: { interviewerId: dbUser.id, status: "PROCESSING" }
        });
        if (existing) {
            throw new Error("A request for you is already processing. Please try after sometime");
        }

        const [payout, updatedInterviewer] = await db.$transaction([
            db.payout.create({
                data: {
                    interviewerId: dbUser.id,
                    credits: data.credits,
                    platformFee: data.platformFee,
                    netAmount: data.netAmount,
                    paymentMethod,
                    paymentDetail: `You have withdrawn ${data.netAmount} dollars`,
                    status: "PROCESSING",
                }
            }),

            db.user.update({
                where: {id: dbUser.id},
                data: {creditBalance: 0}
            })
        ]);

        return {payout, success: true};
    } catch (error) {
        console.error("Error while payout: ", error);
        throw error;
    }
}


// for admin dashboard
export const getPayoutRequests = async () => {
    const user = await currentUser();
    if (!user) {
        throw new Error("Unauthorized");
    }
    const dbUser = await db.user.findUnique({
        where: { clerkUserId: user.id },
    });
    if (!dbUser || dbUser.role !== "UNASSIGNED") {
        throw new Error("Forbidden");
    }

    try {
        const payoutRequests = await db.payout.findMany({
            where: { status: "PROCESSING" },
            include: {
                interviewer: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });
        return {payoutRequests, success: true};
    } catch (error) {
        console.error("Error while fetching payout requests: ", error);
        throw error;
    }
};

export const processPayout = async ({id, status, adminNote}) => {
    console.log("Payout id: ", id);
    const user = await currentUser();
    if (!user) {
        throw new Error("Unauthorized");
    }
    const dbUser = await db.user.findUnique({
        where: { clerkUserId: user.id },
    });
    if (!dbUser || dbUser.role !== "UNASSIGNED") {
        throw new Error("Forbidden");
    }

    try {
        const payout = await db.payout.update({
            where: { id },
            data: { status: status, adminNote }
        });
        return {payout, success: true};
    } catch (error) {
        console.error("Error while processing payout: ", error);
        throw error;
    }
};