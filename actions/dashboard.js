"use server";

import { db } from "@/lib/prisma";
import { sendPayoutEmail } from "@/lib/sendGrid";
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

        return { success: true, withdrawalHistory };
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
                    // paymentDetail is a json object with payment details
                    paymentDetail: JSON.stringify(paymentDetails),
                    status: "PROCESSING",
                }
            }),

            db.user.update({
                where: { id: dbUser.id },
                data: { creditBalance: { decrement: data.credits } }
            }),
        ]);

        // send email to admin about the payout request
        const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payout/${payout.id}`;

        console.log("Review URL:", reviewUrl);
        const response = await sendPayoutEmail({
            to: process.env.ADMIN_EMAIL, subject: "New Payout Request",

            text: `A new payout request has been submitted and is awaiting your review.

            Interviewer: ${dbUser.name}
            Email: ${dbUser.email}
            Credits Requested: ${data.credits}
            Gross Amount: $${((data.netAmount + data.platformFee) * 5).toFixed(2)}
            Platform Fee: $${(data.platformFee * 5).toFixed(2)}
            Net Payout: $${(data.netAmount * 5).toFixed(2)}
            Payment Method: ${paymentMethod.toUpperCase()}

            Please review the payout details and process or reject the request from the admin dashboard.

            Thank you,
            Skiller`,

            html: `<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e5e5; border-radius: 10px; overflow: hidden;">
            <div style="background:#111827;padding:20px;text-align:center;">
            <h2 style="color:#fbbf24;margin:0;">New Payout Request</h2>
            </div>

            <div style="padding:24px;color:#333;">
            <p>Hello Admin,</p>

            <p>
            A new interviewer payout request has been submitted and is awaiting your
            approval.
            </p>

            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr>
                <td style="padding:8px 0;"><strong>Interviewer</strong></td>
                <td style="padding:8px 0;">${dbUser.name}</td>
            </tr>

            <tr>
                <td style="padding:8px 0;"><strong>Email</strong></td>
                <td style="padding:8px 0;">${dbUser.email}</td>
            </tr>

            <tr>
                <td style="padding:8px 0;"><strong>Credits</strong></td>
                <td style="padding:8px 0;">${data.credits}</td>
            </tr>

            <tr>
                <td style="padding:8px 0;"><strong>Gross Amount</strong></td>
                <td style="padding:8px 0;">$${((data.netAmount + data.platformFee) * 5).toFixed(2)}</td>
            </tr>

            <tr>
                <td style="padding:8px 0;"><strong>Platform Fee (20%)</strong></td>
                <td style="padding:8px 0;">$${(data.platformFee * 5).toFixed(2)}</td>
            </tr>

            <tr>
                <td style="padding:8px 0;"><strong>Net Payout</strong></td>
                <td style="padding:8px 0;color:#16a34a;font-weight:bold;">
                $${(data.netAmount * 5).toFixed(2)}
                </td>
            </tr>

            <tr>
                <td style="padding:8px 0;"><strong>Payment Method</strong></td>
                <td style="padding:8px 0;">${paymentMethod.toUpperCase()}</td>
            </tr>
            </table>

            <p>
            Please log in to the admin dashboard to review the payment details and
            either approve or reject this payout request.
            </p>

            <div style="margin-top:30px;text-align:center;">
            <a href=${reviewUrl}
                style="background:#f59e0b;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">
                Review Payout Request
            </a>
            </div>

            <p style="margin-top:30px;color:#777;font-size:13px;">
            This is an automated notification from the Skiller platform.
            </p>
        </div>
        </div>`
        });

        return { payout, success: true };
    } catch (error) {
        console.error("Error while payout: ", error);
        throw error;
    }
}


// for admin dashboard
export const getPayoutRequest = async ({ payoutId }) => {
    if (!payoutId) {
        throw new Error("Payout id is required");
    }

    try {
        const payoutRequest = await db.payout.findUnique({
            where: { id: payoutId },
            include: {
                interviewer: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });
        return { payoutRequest, success: true };
    } catch (error) {
        console.error("Error while fetching payout requests: ", error);
        throw error;
    }
};

export const approvePayout = async ({ id, status, adminNote, adminPassword }) => {
    console.log("Payout id: ", id);

    // match admin password with env variable
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
        throw new Error("Invalid admin password");
    }

    try {
        const payoutRequest = await db.payout.findUnique({
            where: { id },
        });

        if (!payoutRequest) {
            throw new Error("Payout request not found");
        }

        if (payoutRequest.status !== "PROCESSING") {
            throw new Error("Payout request is not in processing state");
        }

        const [updatedPayout, paymentResponse] = await db.$transaction([
            db.payout.update({
                where: { id },
                data: {
                    status,
                    adminNote
                }
            }),

            // Here you can add logic to actually process the payment using the payment details
        ]);
        return { result: updatedPayout, success: true };
    } catch (error) {
        console.error("Error while approving payout: ", error);
        throw error;
    }
};