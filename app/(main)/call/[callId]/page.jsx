import { notFound, redirect } from 'next/navigation';
import React from 'react'
import { toast } from 'sonner';
import CallRoom from './_components/CallRoom';
import { getCallData } from '@/actions/call';

const CallPage = async ({ params }) => {
    const { callId } = await params;

    const result = await getCallData(callId);
    if (result.error === "Unauthorized") {
        // Handle unauthorized access, e.g., redirect to login
        toast.error("You must be signed in to access this call.")
        redirect("/");
    }
    if (result.error === "Forbidden") {
        // Handle forbidden access, e.g., show an error message or redirect
        toast.error("You do not have permission to access this call.")
        redirect("/");
    }
    if (result.error === "Call not found") {
        // Handle call not found, e.g., show an error message or redirect
        toast.error("This call does not exist.")
        notFound();
    }

    console.log("CALL DATA:", result);

    const { token, isInterviewer, currentUser, booking } = result;
    return (
        <CallRoom
            isInterviewer={isInterviewer}
            token={token}
            currentUser={currentUser}
            booking={booking}
            apiKey={process.env.NEXT_PUBLIC_STREAM_API_KEY}
            callId={callId}
        />
    )
}

export default CallPage
