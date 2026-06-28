import AppointmentCard from '@/components/AppointmentCard';
import { GrayTitle } from '@/components/Reusables';
import { Clipboard } from 'lucide-react';
import React from 'react'

const AppointmentsSection = ({ appointments }) => {
    const now = new Date();
    const scheduled = appointments.filter((app) => app.status === "SCHEDULED" && new Date(app.startTime) > now);
    const past = appointments.filter((app) => app.status !== "SCHEDULED" || new Date(app.endTime) <= now);
    return (
        <section className='flex flex-col gap-6'>
            {/* Page Header */}
            <div className="border border-white/10 bg-[#0f0f11] rounded-2xl p-8">
                <span className='w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-4'>
                    <Clipboard size={18} className='text-amber-400' />
                </span>

                <h2 className='font-serif  text-xl tracking-tight'>
                    <GrayTitle>Appointments</GrayTitle>
                </h2>

                <p className='text-xs text-stone-500 font-light mt-1'>
                    All your scheduled and past sessions.
                </p>
            </div>

            {/* If there is no appointment */}
            {appointments.length === 0 ? (
                <div className='bg-[#0f0f11] border border-white/10 rounded-2xl py-20 text-center'>
                    <p className='text-stone-600 text-sm'>No appointmnets yet.</p>
                    <p className='text-stone-700 text-xs mt-1'>
                        Once interviewees book your slots, they&apos;ll appear here
                    </p>
                </div>
            ) : (
                <div className='flex flex-col gap-10'>
                    {/* Upcoming Sessions */}
                    {scheduled.length > 0 && (
                        <div className='flex flex-col gap-4'>
                            <p className='text-xs font-semibold text-stone-500 tracking-widest uppercase'>Upcoming ({scheduled.length})</p>

                            <div className='flex-1 h-px bg-white/5' />

                            {/* Cards for Upcoming Sessions */}
                            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                                {
                                    scheduled.map(b => (
                                        <AppointmentCard key={b.id} booking={b} mode="interviewer" />
                                    ))
                                }
                            </div>
                        </div>
                    )}

                    {/* Past Sessions */}
                    {past.length > 0 && (
                        <div className='flex flex-col gap-4'>
                            <p className='text-xs font-semibold text-stone-500 tracking-widest uppercase'>Past ({past.length})</p>

                            <div className='flex-1 h-px bg-white/5' />

                            {/* Cards for Past Sessions */}
                            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                                {past.map(b => (
                                    <AppointmentCard key={b.id} booking={b} mode="interviewer" isPast={true} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}


        </section>
    )
}

export default AppointmentsSection
