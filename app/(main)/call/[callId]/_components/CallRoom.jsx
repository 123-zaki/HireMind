"use client";

import { StreamCall, StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react'
// some css files for the video call UI
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/v2/index.css";
import CallUI from './CallUI';

const CallRoom = ({ currentUser, callId, apiKey, token, isInterviewer, booking }) => {
    const [videoClient, setVideoClient] = useState(null);
    const [call, setCall] = useState(null);

    const joinedRef = useRef(false);
    const clientRef = useRef(null);

    const router = useRouter();

    useEffect(() => {
        if (joinedRef.current) return;
        joinedRef.current = true;

        const client = new StreamVideoClient({
            apiKey,
            user: {
                id: currentUser.id,
                name: currentUser.name,
                image: currentUser.imageUrl
            },
            token
        });

        const callInstance = client.call("default", callId);

        callInstance.join({ create: false })
            .then(() => {
                clientRef.current = client;
                setVideoClient(client);
                setCall(callInstance);
            })
            .catch(console.error);


        // Cleanup function to leave the call and disconnect the client when the component unmounts
        return () => {
            callInstance.leave().catch(console.error);
            client.disconnectUser().catch(console.error);
            clientRef.current = null;
            joinedRef.current = false;
        }
    }, [
        apiKey,
        callId,
        currentUser.id,
        currentUser.imageUrl,
        currentUser.name,
        token
    ]);

    const handleLeave = useCallback(() => {
        router.push(isInterviewer ? "/dashboard" : "/appointments");
    }, [isInterviewer, router]);

    if (!videoClient || !call) {
        return (
            <div className='min-h-screen bg-[#0a0a0b] flex justify-center items-center flex-col gap-3'>
                <Loader2 size={28} className='text-amber-400 animate-spin' />
                <p className='text-stone-500 text-sm font-light animate-pulse'>Connecting to call...</p>
            </div>
        )
    }
    return (
        <StreamVideo client={videoClient}>
            <StreamCall call={call}>
                <CallUI
                    callId={callId}
                    isInterviewer={isInterviewer}
                    booking={booking}
                    onLeave={handleLeave}
                    apiKey={apiKey}
                    token={token}
                    currentUser={currentUser}
                />
            </StreamCall>
        </StreamVideo>
    )
}

export default CallRoom
