import React from 'react'

function AuthLayout({children}) {
  return (
    <div className='flex items-center justify-center min-h-screen'>
      {children}
    </div>
  )
}

export default AuthLayout
