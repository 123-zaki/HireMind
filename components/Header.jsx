
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { Show, UserButton } from '@clerk/nextjs'
import React from 'react'
import { Button } from './ui/button'
import Link from "next/link"
import Image from 'next/image'
import { checkUser } from '@/lib/checkUser'
import { CalendarDays, Users } from 'lucide-react'
import CreditButton from './CreditButton'

async function Header() {
    const user = await checkUser();

    // console.log("CHECK USER RUNNING");
    return (
        <nav className='fixed z-50 inset-x-0 py-1 px-6 flex justify-between backdrop-blur-xl border-b border-white/10'>
            {/* <Logo /> */}
            <Link href='/'>
                <Image
                    src={"/logotr.png"}
                    alt='HireMind Logo'
                    width={150}
                    height={150}
                    className='h-14 w-auto'
                />
            </Link>

            <div className='flex items-center gap-3'>
                <Show when="signed-out">

                    <SignInButton>
                        <Button variant='ghost'>Sign In</Button>
                    </SignInButton>
                    <SignUpButton>
                        <Button variant='gold'>Get Stated </Button>
                    </SignUpButton>
                </Show>
                <Show when="signed-in">
                    {/* Links */}
                    {user.role === "INTERVIEWER" && (
                        <Button variant='ghost' asChild>
                            <Link href='/dashboard'>Dashboard</Link>
                        </Button>
                    )}

                    {user.role === "INTERVIEWEE" && (
                        <>
                            <Button variant='ghost' asChild>
                                <Link href='/explore'>
                                    <Users size={16} />
                                    <span className="hidden md:inline">Explore</span>
                                </Link>
                            </Button>

                            <Button variant='default' asChild>
                                <Link href='/appointments'>
                                    <CalendarDays size={16} />
                                    <span className="hidden md:inline">My Appointments</span>
                                </Link>
                            </Button>
                        </>
                    )}
                    {/* Credits */}
                    <CreditButton
                        role={user?.role === "INTERVIEWER" ? "INTERVIEWER" : "INTERVIEWEE"}
                        credits={user?.role === "INTERVIEWER" ? user.creditBalance : (user?.credits ?? 0)}
                    />

                    <UserButton />
                </Show>
            </div>
        </nav>
    )
}

export default Header
