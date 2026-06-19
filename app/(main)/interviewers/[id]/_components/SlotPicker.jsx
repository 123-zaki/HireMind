"use client"

import { bookSlot } from '@/actions/booking';
import { GrayTitle } from '@/components/Reusables';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import UpgradeModal from '@/components/UpgradeModal';
import { useFetch } from '@/hooks/use-fetch';
import { formatDateFull, formatDateTab, formatTime, generateDates, generateSlots } from '@/lib/helpers';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react'

// Improvement: [User can select a slot from the available slots for the interview, and the selected slot will be highlighted. The component will also display the user's remaining credits and the interviewer's credit rate.]

const SLOT_DURATION_MINUTES = 45;
const DAYS_AHEAD = 7;

const SlotPicker = ({ interviewer, interviewerCredits, userCredits }) => {
    const router = useRouter();

    const dates = useMemo(() => generateDates(DAYS_AHEAD), []);

    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dates[0]);
    const [upgradeOpen, setUpgradeOpen] = useState(false);

    const summaryRef = useRef(null);

    const { data, loading, error, fn: bookFn } = useFetch(bookSlot);

    const availablity = interviewer.availabilities?.[0];
    const canAfford = userCredits >= interviewerCredits;

    const slots = useMemo(() => {
        if (!availablity) return [];

        return generateSlots(
            selectedDate,
            availablity.startTime,
            availablity.endTime,
            interviewer.bookingsAsInterviewer ?? [],
            SLOT_DURATION_MINUTES
        );
    }, [interviewer.bookingsAsInterviewer, selectedDate, availablity]);

    useEffect(() => {
        if(selectedSlot && summaryRef.current) {
            summaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [selectedSlot]);


    useEffect(() => {
        if(data?.success || data?.streamCallId) {
            router.push('/appointments');
        }
    }, [data, router]);

    if (!availablity) {
        return (
            <div className='bg-[#0f0f11] border border-white/10 rounded-2xl p-8 text-center flex flex-col items-center gap-2'>
                <span className='text-2xl'>🕐</span>
                <p className='text-sm text-stone-500'>No availability set yet.</p>
                <p className='text-xs text-stone-700'>Check back later.</p>
            </div>
        )
    }

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setSelectedSlot(null);
    };

    const handleSlotClick = (slot) => {
        if (!slot.available) return;
        if (!canAfford) {
            setUpgradeOpen(true);
            return;
        }

        setSelectedSlot((prev) => prev?.startTime.getTime() === slot.startTime.getTime() ? null : slot);
    };

    const handleConfirm = async () => {
        if(!selectedSlot)   return;
        bookFn({
            interviewerId: interviewer.id,
            startTime: selectedSlot.startTime.toISOString(),
            endTime: selectedSlot.endTime.toISOString(),
        });
    };

    return (
        <>
            <UpgradeModal
                open={upgradeOpen}
                onOpenChange={setUpgradeOpen}
                reason={`You need ${interviewerCredits} credits to book this session. Your current balance is ${userCredits} credits.`}
            />

            <div className='flex flex-col gap-4'>
                {/* Main picker card */}
                <div className='bg-[#0f0f11] border border-white/10 rounded-2xl p-7 flex flex-col gap-6'>
                    <div className='flex items-start justify-between gap-3'>
                        <div>
                            <h2 className='font-serif text-xl tracking-tight'>
                                <GrayTitle>Book a session</GrayTitle>
                            </h2>
                            <p className='text-xs text-stone-500 font-light mt-1'>
                                Select a date and available time slot.
                            </p>
                        </div>

                        <div className='text-right shrink-0'>
                            <p className='text-xs text-stone-600'>Cost</p>
                            <p className='font-serif text-2xl leading-none bg-linear-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent'>
                                {interviewerCredits}
                                <span className='text-xs font-sans text-stone-500 ml-1'>
                                    cr
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Date tabs */}
                    <div className='flex gap-2 overflow-x-auto pb-0.5 no-scrollbar -mx-1 px-1'>
                        {dates.map((date) => {
                            const label = formatDateTab(date);
                            const active = date.toDateString() === selectedDate.toDateString();

                            return (
                                <button
                                    key={date.toDateString()}
                                    type='button'
                                    onClick={() => handleDateChange(date)}
                                    className={`shrink-0 flex flex-col items-center px-3.5 py-2.5 rounded-xl border text-xs transition-all duration-200 ${active ? 'border-amber-400/40 bg-amber-400/10 text-amber-400' : 'border-white/10 text-stone-500 hover:border-white/20 hover:text-stone-400'}`}
                                >
                                    <span>{label.top}</span>
                                    <span className={`mt-0.5 ${active ? 'text-amber-500/70' : 'text-stone-700'}`}>{label.bottom}</span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Separator */}
                    <Separator />

                    {/* Slots */}
                    {slots.length === 0 ? (
                        <p className='text-xs text-stone-600 text-center py-4'>No slots in the availability window for this date</p>
                    ) : (
                        <div className='grid grid-cols-3 gap-2'>
                            {
                                slots.map((slot) => {
                                    const isSelected = selectedSlot?.startTime.getTime() === slot.startTime.getTime() && selectedSlot.endTime.getTime() === slot.endTime.getTime();

                                    return (
                                        <button
                                            key={slot.startTime.toISOString()}
                                            type='button'
                                            disabled={slot.isBooked}
                                            onClick={() => handleSlotClick(slot)}
                                            className={`relative text-xs px-2 py-2.5 rounded-xl border transition-all duration-200 ${isSelected ? 'border-amber-400/160 bg-amber-400/15 text-amber-300 shadow-[0_0_12px_rgba(251, 191, 36, 0.08)]' : slot.isBooked ? 'border-white/5 bg-white/2 text-stone-700 cursor-not-allowed' : 'border-white/10 text-stone-400 hover:border-amber-400/30 hover:text-amber-400 hover:bg-amber-400/5 cursor-pointer}'}`}
                                        >
                                            {formatTime(slot.startTime)}
                                            {slot.isBooked && (
                                                <span className='absolute inset-0 bottom-0.5 text-center text-stone-700 leading-none' style={{ fontSize: '9px' }}>
                                                    booked
                                                </span>
                                            )}
                                        </button>
                                    )
                                })
                            }
                        </div>
                    )}
                </div>

                {selectedSlot && (
                    <div ref={summaryRef} className='bg-[#0f0f11] border border-amber-400/20 rounded-2xl p-6 flex flex-col gap-4'>
                        <p className='text-xs font-semibold text-stone-500 tracking-widest uppercase'>
                            Your booking
                        </p>

                        <div className='flex flex-col gap-2'>
                            {/* Date */}
                            <div className='flex justify-between text-xs'>
                                <span className='text-stone-500'>Date</span>
                                <span className='text-stone-300'>{formatDateFull(selectedSlot.startTime)}</span>
                            </div>

                            {/* Time */}
                            <div className='flex justify-between text-xs'>
                                <span className='text-stone-500'>Time</span>
                                <span className='text-stone-300'>{formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}</span>
                            </div>

                            {/* Duration */}
                            <div className='flex justify-between text-xs'>
                                <span className='text-stone-500'>Duration</span>
                                <span className='text-stone-300'>{SLOT_DURATION_MINUTES} minutes</span>
                            </div>
                        </div>

                        {/* Separator */}
                        <Separator className="bg-white/8" />

                        {/* Credits Charged */}
                        <div className='flex justify-between items-center'>
                            <span className='text-stone-400 text-xs'>Credits charged</span>
                            <span className='font-serif text-lg bg-linear-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent leading-none'>
                                -{interviewerCredits}
                            </span>
                        </div>

                        {/* Remaining Credits */}
                        <div className='flex justify-between text-xs'>
                            <span className='text-stone-600'>Balance after</span>
                            <span className='text-stone-500'>
                                {userCredits - interviewerCredits} credits
                            </span>
                        </div>

                        {/* Information */}
                        <div className='flex items-start border border-white/8 bg-white/2 rounded-xl px-3.5 py-3 gap-2.5'>
                            <span className='tex-sm shrink-0'>🎥</span>
                            <p className='text-xs text-stone-500 font-light leading-relaxed'>
                                A video call room will be created and you&apos;ll be redirected
                                immediately after confirming.
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <p className='text-xs text-red-400'>{error.message || error}</p>
                        )}

                        {/*  */}
                        <div className='flex gap-2'>
                            <Button
                                variant='outline'
                                size='sm'
                                className='flex-1 cursor-pointer'
                                disabled={loading}
                                onClick={() => setSelectedSlot(null)}
                            >Change slot
                            </Button>
                            <Button
                                variant='gold'
                                size='sm'
                                className='flex-1'
                                disabled={loading}
                                onClick={handleConfirm}
                            >
                                {loading ? "Creating call..." : "Confirm →"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default SlotPicker
