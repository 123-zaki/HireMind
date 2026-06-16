"use server";

import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export const completeOnboarding = async (data) => {
    const user = await currentUser();
    console.log("User: ", user);
    

    if(!user) {
        throw new Error("Unauthorised");
    }

    const {role, title, company, yearsExp, bio, categories} = data;

    if(!role || !["INTERVIEWER", "INTERVIEWEE"].includes(role)) {
        throw new Error("Invalid role");
    }

    if(role === "INTERVIEWER" && (!title || !company || !yearsExp || !bio || !categories?.length)) {
        throw new Error("Please fill in all required fields");
    }

    try {
        await db.user.update({
            where: {clerkUserId: user.id},
            data: {
                role,
                ...(role === "INTERVIEWER" && {
                    title,
                    company,
                    yearsExp,
                    bio,
                    categories,
                })
            }
        });

        return {success: true};
    } catch (error) {
        console.error("Onboarding error:", error);
        throw new Error("Something went wrong. Please try again.");
    }
};