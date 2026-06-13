import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

async function getCurrentPlan() {
    const { sessionClaims } = await auth();

    const plan = sessionClaims?.pla;

    switch (plan) {
        case "u:starter":
            return "starter";

        case "u:pro":
            return "pro";

        case "u:premium":
            return "premium";

        default:
            return "free";
    }
};

function shouldAllocateCredits(user, currentPlan) {
    // Allocate credits if the user has changed their plan
    if (user.currentPlan !== currentPlan) return true;

    // Allocate credits if the user has never been allocated credits before
    if (!user.creditsLastAllocatedAt) return true;

    // Allocate credits if it's been more than 30 days since the last allocation
    const now = new Date();
    const lastAllocated = new Date(user.creditsLastAllocatedAt);

    const isNewMonth = now.getFullYear() > lastAllocated.getFullYear() || now.getMonth() > lastAllocated.getMonth();

    return isNewMonth;
};

const PLAN_CREDITS = {
    "free": 1,
    "starter": 5,
    "pro": 15,
    "premium": 50,
    "enterprise": 100
};

export const checkUser = async () => {
    const user = await currentUser();
    if (!user) {
        return null;
    }

    // Get the current plan of the user
    try {
        const currentPlan = await getCurrentPlan();

        const credits = PLAN_CREDITS[currentPlan] || 0;

        const loggedInUser = await db.user.findUnique({
            where: {
                clerkUserId: user.id
            },
            // select: {
            //     id: true,
            //     email: true,
            //     name: true,
            //     currentPlan: true,
            //     credits: true,
            //     role: true,
            //     creditsLastAllocatedAt: true
            // }
        });


        // console.log("Current Plan:", currentPlan);
        // console.log("DB Plan:", loggedInUser.currentPlan);

        if (loggedInUser) {
            // Interviewers don't have a credit subscription, so skip allocating credits to them
            if (loggedInUser.role === "INTERVIEWER") return loggedInUser;

            if (shouldAllocateCredits(loggedInUser, currentPlan)) {
                // Interviewers don't have a credit subscription, so skip allocating credits to them

                // If logged in user is an interviewer, skip allocating credits to them and return logged in user
                if (loggedInUser.role === "INTERVIEWER") return loggedInUser;


                return await db.user.update({
                    where: {
                        id: loggedInUser.id
                    },
                    data: {
                        currentPlan,
                        credits,
                        creditsLastAllocatedAt: new Date()
                    }
                });
            };

            return loggedInUser;
        }

        // If user doesn't exist in our database, create a new user with the current plan and credits
        const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

        return await db.user.create({
            data: {
                clerkUserId: user.id,
                email: user.emailAddresses[0].emailAddress,
                name,
                currentPlan,
                credits,
                creditsLastAllocatedAt: new Date()
            }
        });
    } catch (error) {
        console.error("Error checking user:", error);
        return null;
    }
};