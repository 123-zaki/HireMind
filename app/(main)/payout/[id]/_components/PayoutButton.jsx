"use client";

import { approvePayout } from '@/actions/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFetch } from '@/hooks/use-fetch';
import React, { useState } from 'react'
import { toast } from 'sonner';

const PayoutButton = ({ payoutRequest }) => {
    const [adminPassword, setAdminPassword] = useState("");
    const [adminNote, setAdminNote] = useState("");
    const [payoutStatus, setPayoutStatus] = useState(payoutRequest?.status === "PROCESSED");
    const {data, loading, error, fn: approvePayoutFn} = useFetch(approvePayout);

    const handleApprovePayout = async () => {
        if(!adminPassword) {
            alert("Please enter admin password");
            return;
        }

        // Call the approvePayout action with the necessary parameters
        try {
            await approvePayoutFn({adminNote, adminPassword, id: payoutRequest?.id, status: "PROCESSED"});
            if(data?.success) {
                setPayoutStatus(true);
            }
            // alert("Payout approved successfully!");

            setAdminPassword("");
            setAdminNote("");
        } catch (error) {
            toast.error("Failed to approve payout. Please check the console for details.");
            console.error("Error occurred while approving payout:", error);
            // alert("Failed to approve payout.");
        }
    };
    return (
        <>
            {/* Admin password section to approve payout */}
            <div className='flex justify-between flex-col gap-2'>
                <Label className={`text-sm text-stone-400 font-semibold`}>Admin password</Label>
                <Input
                    placeholder="Enter admin password..."
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                />
            </div>
            {/* Admin note section to approve payout */}
            <div className='flex justify-between flex-col gap-2'>
                <Label className={`text-sm text-stone-400 font-semibold`}>Admin note</Label>
                <Input
                    placeholder="Enter admin note..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                />
            </div>
            <Button variant='gold' disabled={!adminPassword} onClick={handleApprovePayout}>
                {
                    loading ? "Approving..." : payoutStatus ? "Approved" : `Approve $${payoutRequest?.netAmount} ->`
                }
            </Button>
        </>
    )
}

export default PayoutButton
