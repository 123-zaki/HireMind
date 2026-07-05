
import { getPayoutRequest } from '@/actions/dashboard';
import { PageHeader } from '@/components/Reusables';
import { Separator } from '@/components/ui/separator';
import PayoutButton from './_components/PayoutButton';

const PayoutPage = async ({ params }) => {
    const { id } = await params;

    const { payoutRequest } = await getPayoutRequest({ payoutId: id });
    console.log("Payout id: ", id);
    console.log("Payment details: ", JSON.parse(payoutRequest.paymentDetail));
    return (
        <div className='min-h-[90vh] flex items-center justify-center bg-black'>
            <div className='flex flex-col'>
                <PageHeader
                    gold={"Withdrawal"}
                    gray={"Review"}
                    label={"Admin"}
                />
                <div className='p-6 bg-[#1A1A1A] border border-white/10 rounded-2xl flex flex-col gap-6'>
                    <div className='bg-[#161616] border border-white/10 rounded-2xl p-4 flex flex-col gap-2'>
                        <div className='flex justify-between items-center'>
                            <span className='text-stone-400 text-sm font-semibold tracking-tighter'>Interviewer</span>
                            <span className='text-sm text-stone-200'>{payoutRequest?.interviewer?.name || "N/A"}</span>
                        </div>
                        <div className='flex justify-between items-center'>
                            <span className='text-stone-400 text-sm font-semibold tracking-tighter'>Email</span>
                            <span className='text-sm text-stone-200'>{payoutRequest?.interviewer?.email || "N/A"}</span>
                        </div>
                        <div className='flex justify-between items-center'>
                            <span className='text-stone-400 text-sm font-semibold tracking-tighter'>Credits</span>
                            <span className='text-sm text-stone-200'>{payoutRequest?.credits || "N/A"}</span>
                        </div>
                        <div className='flex justify-between items-center'>
                            <span className='text-stone-400 text-sm font-semibold tracking-tighter'>Platform Fee(20%)</span>
                            <span className='text-sm text-red-400'>-${payoutRequest?.platformFee || "N/A"}</span>
                        </div>

                        <Separator />

                        <div className='flex justify-between items-center'>
                            <span className='text-stone-200 text-md font-bold tracking-tighter'>Pay out</span>
                            <span className='text-md text-amber-400'>${payoutRequest?.netAmount || "N/A"}</span>
                        </div>

                        <div className='flex justify-between items-center'>
                            <span className='text-stone-400 text-sm font-semibold tracking-tighter'>Send to</span>
                            <span className='text-sm text-stone-200 uppercase'>{payoutRequest?.paymentMethod || "N/A"}</span>
                        </div>

                        <Separator />

                        {/* Payment details */}
                        <div className='flex justify-between items-center flex-col gap-2'>
                            <span className='text-stone-400 text-sm font-semibold tracking-tighter'>Payment Details</span>
                            <div className='flex flex-col gap-2'>
                                {payoutRequest?.paymentDetail ? (
                                    Object.entries(JSON.parse(payoutRequest.paymentDetail)).map(([key, value]) => (
                                        <div key={key} className='flex justify-between items-center'>
                                            <span className='text-stone-400 text-sm font-semibold tracking-tighter uppercase mr-2'>{key} : </span>
                                            <span className='text-sm text-stone-200'>{value}</span>
                                        </div>
                                    ))
                                ) : (
                                    <span className='text-sm text-stone-200'>N/A</span>
                                )}
                            </div>
                        </div>

                        {/* Separator */}
                        <Separator />

                        {/* Approve Payout Input and Button Component */}
                        <PayoutButton payoutRequest={payoutRequest} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PayoutPage
