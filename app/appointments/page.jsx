"use server";


import { getIntervieweeAppointments } from '@/actions/appointment'
import { getCurrentUser } from '@/actions/user';
import AppointmentCard from '@/components/AppointmentCard';
import { PageHeader } from '@/components/Reusables';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';
import Link from 'next/link';
import React from 'react'

const MyAppointmentsPage = async () => {
    const dbUser = await getCurrentUser();
    const appointments = await getIntervieweeAppointments({ dbUser });
    // const appointments = [];

    const now = new Date();

    const scheduled = appointments.filter(app => app.status === "SCHEDULED" && new Date(app.startTime) > now);

    const past = appointments.filter(app => app.status !== "SCHEDULED" || new Date(app.endTime) <= now);

    return (
        <main className='min-h-screen bg-black pt-16'>
            <PageHeader
                label="My Appointments"
                gray="Your interviews"
                gold="sessions"
                description="All your upcoming and past mock interviews in one place."
            />

            <div className='max-w-6xl mx-auto px-8 lg:px-0 py-8 flex flex-col gap-14'>
                {appointments.length === 0 && (
                    <div className='flex flex-col items-center justify-center py-28 gap-5 text-center'>
                        <span className='w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-3xl'>
                            <CalendarDays size={28} className='text-amber-400' />
                        </span>

                        <div>
                            <p className='text-base text-stone-400 font-light'>
                                No session booked yet.
                            </p>
                            <p className='text-sm text-stone-600 mt-1'>
                                Browse expert interviewers and book your first session.
                            </p>
                        </div>

                        <Button
                            variant="gold"
                            asChild
                        >
                            <Link href="/explore">Browse Interviewers</Link>
                        </Button>
                    </div>
                )}


                {/* Upcoming Sessions */}
                {scheduled.length > 0 && (
                    <div className='flex flex-col gap-5'>
                        <div className='flex items-center gap-4'>
                            <p className='text-xs font-semibold text-stone-500 tracking-widest uppercase'>Upcoming ({scheduled.length})</p>
                        </div>

                        <div className='flex-1 h-px bg-white/5' />

                        {/* Cards for Upcoming Sessions */}
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                            {
                                scheduled.map(b => (
                                    <AppointmentCard key={b.id} booking={b} mode="interviewee" />
                                ))
                            }
                        </div>
                    </div>
                )}

                {/* Past Sessions */}
                {past.length > 0 && (
                    <div className='flex flex-col gap-5'>
                        <div className='flex items-center gap-4'>
                            <p className='text-xs font-semibold text-stone-500 tracking-widest uppercase'>Past ({past.length})</p>
                        </div>

                        <div className='flex-1 h-px bg-white/5' />

                        {/* Cards for Past Sessions */}
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                            {past.map(b => (
                                <AppointmentCard key={b.id} booking={b} mode="interviewee" isPast={true} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}

export default MyAppointmentsPage
