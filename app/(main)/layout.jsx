import React from 'react'

function MainLayout({children}) {
  return (
    <div className='container mx-auto pt-32'>
      {children}
    </div>
  )
}

export default MainLayout
