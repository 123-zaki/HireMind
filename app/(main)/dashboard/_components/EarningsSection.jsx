"use client";

import { creditPayout } from '@/actions/dashboard';
import { GrayTitle } from '@/components/Reusables';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFetch } from '@/hooks/use-fetch';
import { CircleCheck, TrendingUp, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';

const EarningsSection = ({ stats, history }) => {
  console.log("History: ", history);
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState(false);


  // Payment method states
  const [paypal, setPaypal] = useState("");
  const [upi, setUpi] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    bankName: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("paypal");

  const isPaypalValid = paypal.trim() !== "";

  const isUpiValid = upi.trim() !== "";

  const isBankValid =
    bankDetails.accountHolderName.trim() !== "" &&
    bankDetails.accountNumber.trim() !== "" &&
    bankDetails.confirmAccountNumber.trim() !== "" &&
    bankDetails.accountNumber === bankDetails.confirmAccountNumber &&
    bankDetails.ifscCode.trim() !== "" &&
    bankDetails.bankName.trim() !== "";

  let isDisabled = false;
  if (paymentMethod === "paypal") {
    isDisabled = !isPaypalValid;
  } else if (paymentMethod === "bank") {
    isDisabled = !isBankValid;
  } else if (paymentMethod === "upi") {
    isDisabled = !isUpiValid;
  }

  const balance = (stats?.creditBalance ?? 0) * 5;
  const totalEarnedDollars = (stats?.totalCreditsEarned ?? 0) * 5;

  const { loading, error, data, fn: requestWithdrawal } = useFetch(creditPayout);

  const router = useRouter();

  const handleWithdrawalRequest = async () => {
    if (!paymentMethod || (!isBankValid && !isPaypalValid && !isUpiValid)) {
      console.log("Returing from handle withdrawal request");
      return;
    }

    try {
      await requestWithdrawal({
        paymentMethod,
        paymentDetails: paymentMethod === "bank" ? bankDetails : (paymentMethod === "upi" ? { upi } : { paypal }),
        data: {
          credits: balance,
          platformFee: (0.2 * balance),
          netAmount: (balance - 0.2 * balance)
        },
      });

      router.refresh();          // refreshes the server component to show the updated balance and history
    } catch (error) {
      toast.error(error);
    }
  };


  useEffect(() => {
    if (data?.success) {
      setUpi("");
      setPaypal("");
      setBankDetails({
        accountNumber: "",
        confirmAccountNumber: "",
        ifscCode: "",
        accountHolderName: "",
        bankName: "",
      });
      setCreated(true);

      const t = setTimeout(() => setCreated(false), 3000);
      return () => clearTimeout(t);
    }
  }, [data]);

  function formatLocalDate(date = new Date()) {
    const d = new Date(date);

    const day = d.getDate();
    const month = d.toLocaleString("en-IN", { month: "short" });
    const weekday = d.toLocaleString("en-IN", { weekday: "long" });
    const year = d.getFullYear();

    return `${day} ${month} ${weekday} ${year}`;
  }

  console.log(formatLocalDate());

  return (
    <section className='flex flex-col gap-6'>
      {/* Withdrwal pop-up */}
      {/* Withdrawal pop-up */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="min-h-[350px] min-w-[550px]">
          <DialogHeader>
            <DialogTitle className="mb-2 font-semibold tracking-tighter text-xl font-serif">
              <GrayTitle>Request Withdrawal</GrayTitle>
            </DialogTitle>

            {/* CHANGE: DialogDescription should contain ONLY text */}
            <DialogDescription>
              Your full balance of{" "}
              <span className="bg-linear-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent">
                {stats?.creditBalance ?? 0} credits
              </span>{" "}
              will be withdrawn.
            </DialogDescription>
          </DialogHeader>

          {/* CHANGE: Everything below is moved OUTSIDE DialogDescription */}
          <div className="flex flex-col gap-4 justify-center mt-2">

            {/* Balance Card */}
            <div className="border border-white/10 p-3 rounded-xl gap-2 flex flex-col bg-[#1f1f17]">
              <div className="flex justify-between">
                <p className="text-stone-400 text-xs">Balance (1 Cr = $5)</p>
                <span className="text-green-400 text-xs">${balance}</span>
              </div>

              <div className="flex justify-between">
                <p className="text-stone-400 text-xs">Platform fee (20%)</p>
                <span className="text-red-400 text-xs">
                  -${0.2 * balance}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between">
                <p className="text-stone-300 font-semibold text-xs">
                  You will get
                </p>

                <span className="text-amber-400 text-xs">
                  ${balance - 0.2 * balance}
                </span>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <h2 className="text-xs tracking-tighter text-stone-400 font-semibold mb-2">
                Payment method
              </h2>

              <Tabs
                defaultValue="paypal"
                onValueChange={setPaymentMethod}
              >
                <TabsList className="w-full bg-[#1f1f17]">
                  <TabsTrigger value="paypal">PayPal</TabsTrigger>
                  <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
                  <TabsTrigger value="upi">UPI</TabsTrigger>
                </TabsList>

                <TabsContent value="paypal" className="mt-2">
                  <h2 className="text-xs tracking-tighter text-stone-400 font-semibold mb-2">
                    PayPal details
                  </h2>

                  <Input
                    placeholder="your@paypal.com"
                    value={paypal}
                    onChange={(e) => setPaypal(e.target.value)}
                  />
                </TabsContent>

                <TabsContent value="bank" className="mt-2">
                  <h2 className="text-xs tracking-tighter text-stone-400 font-semibold mb-2">
                    Bank details
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Account number"
                      className="text-xs text-stone-200"
                      value={bankDetails.accountNumber}
                      onChange={(e) =>
                        setBankDetails((prev) => ({
                          ...prev,
                          accountNumber: e.target.value,
                        }))
                      }
                    />

                    <Input
                      placeholder="Confirm account number"
                      className="text-xs text-stone-200"
                      value={bankDetails.confirmAccountNumber}
                      onChange={(e) =>
                        setBankDetails((prev) => ({
                          ...prev,
                          confirmAccountNumber: e.target.value,
                        }))
                      }
                    />

                    <Input
                      placeholder="Account holder name"
                      className="text-xs text-stone-200"
                      value={bankDetails.accountHolderName}
                      onChange={(e) =>
                        setBankDetails((prev) => ({
                          ...prev,
                          accountHolderName: e.target.value,
                        }))
                      }
                    />

                    <Input
                      placeholder="IFSC code"
                      className="text-xs text-stone-200"
                      value={bankDetails.ifscCode}
                      onChange={(e) =>
                        setBankDetails((prev) => ({
                          ...prev,
                          ifscCode: e.target.value,
                        }))
                      }
                    />

                    <Input
                      placeholder="Bank name"
                      className="text-xs text-stone-200"
                      value={bankDetails.bankName}
                      onChange={(e) =>
                        setBankDetails((prev) => ({
                          ...prev,
                          bankName: e.target.value,
                        }))
                      }
                    />
                  </div>
                </TabsContent>

                <TabsContent value="upi" className="mt-2">
                  <h2 className="text-xs tracking-tighter text-stone-400 font-semibold mb-2">
                    UPI details
                  </h2>

                  <Input
                    placeholder="upi id"
                    value={upi}
                    onChange={(e) => setUpi(e.target.value)}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <Button
                variant="gold"
                disabled={loading || isDisabled}
                onClick={handleWithdrawalRequest}
              >
                {loading ? "Confirming..." : created ? "✓ Withdrawal created!" : "Confirm withdrawal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      <div className='grid grid-cols-3 gap-4'>
        {[
          {
            label: "Credit balance",
            value: stats?.creditBalance ?? 0,
            unit: "credits",
            gold: true,
            icon: <Wallet size={16} className='text-amber-400' />,
            dollarValue: balance
          },
          {
            label: "Total earned",
            value: stats?.totalCreditsEarned ?? 0,
            unit: "credits",
            gold: false,
            icon: <TrendingUp size={16} className='text-stone-400' />,
            dollarValue: totalEarnedDollars
          },
          {
            label: "Session done",
            value: stats?.completedSessions ?? 0,
            unit: "completed",
            gold: false,
            icon: <CircleCheck size={16} className='text-stone-400' />
          }
        ].map((stat) => (
          <div key={stat.label} className='flex flex-col gap-2 rounded-2xl p-6 border border-white/10 bg-[#0f0f11]'>
            <span className='text-lg'>
              {stat.icon}
            </span>

            <p className={`font-serif text-4xl leading-none tracking-tight ${stat.gold ? "bg-linear-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent" : "bg-linear-to-br from-stone-100 to-stone-400 bg-clip-text  text-transparent"}`}>
              {stat.value}
            </p>

            <p className='text-xs text-stone-600'>{stat.unit}</p>

            <p className='text-xs text-stone-500'>
              {stat.label}{" "}{stat.dollarValue !== undefined ? `($${stat.dollarValue?.toFixed(2)})` : ""}
            </p>
          </div>
        ))}
      </div>

      {/* Withdrawal */}
      <div className='rounded-2xl flex justify-between items-center bg-[#0f0f11] p-6 border border-white/10'>
        {/* Left */}
        <div className='flex flex-col gap-2'>
          <h2 className='tracking-tight text-2xl font-serif font-medium'>
            <GrayTitle>Withdraw Earnings</GrayTitle>
          </h2>

          <p className='text-stone-500 text-xs font-light'>20% platform fee applies. Processed within 2-3 business days.</p>
        </div>

        {/* Button to withdraw */}
        <Button
          variant='gold'
          className={``}
          onClick={() => setOpen(true)}
          disabled={balance === 0}
        >
          Request withdrawal
        </Button>
      </div>

      {/* Withdrawal History */}
      {(history ?? []).length ? (
        <div className='flex flex-col border border-white/10 p-6 bg-[#0f0f11] rounded-2xl'>
          <h2 className='text-stone-600 uppercase font-semibold tracking-tighter'>Withdrawal History</h2>
          <div className='flex flex-col gap-2 mt-4'>
            {history.map((h) => (
              <div className='flex justify-between items-center p-4 border border-white/10 rounded-xl bg-[#1f1f17]'>
                <div className='flex flex-col gap-2'>
                  <p className='text-stone-200 text-sm'>{h.credits} credits {"->"} ${h.netAmount}</p>
                  <p className='text-stone-300 text-xs'><span className='uppercase'>{h.paymentMethod}</span> {"."} {formatLocalDate(h.createdAt)}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-2xl ${h.status === "PROCESSING" ? "bg-yellow-500/10 text-yellow-400" : h.status === "PROCESSED" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className='w-full min-h-50 border border-white/10 p-6 bg-[#0f0f11] rounded-2xl flex justify-center items-center'>
          <p className='text-stone-400 font-medium text-lg tracking-tighter'>Your withdrawal history will be shown here</p>
        </div>
      )}
    </section>
  )
}

export default EarningsSection
