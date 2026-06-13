
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { Show, UserButton } from '@clerk/nextjs'
import React from 'react'
import { Button } from './ui/button'
import Link from "next/link"
import Image from 'next/image'
import { checkUser } from '@/lib/checkUser'

async function Header() {
    const user = await checkUser();

    console.log("CHECK USER RUNNING");
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
                    {/* Links */}

                    {/* Credits */}


                    <SignInButton>
                        <Button variant='ghost'>Sign In</Button>
                    </SignInButton>
                    <SignUpButton>
                        <Button variant='gold'>Get Stated </Button>
                    </SignUpButton>
                </Show>
                <Show when="signed-in">
                    <UserButton />
                </Show>
            </div>
        </nav>
    )
}

export default Header
