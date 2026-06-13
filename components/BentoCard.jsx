import React, { Children } from 'react'

const BentoCard = ({icon, title, description, children, classname = ""}) => {
  return (
    <div className={`bg-[#0f0f11] border border-white/10 hover:border-amber-400/20 rounded-2xl p-9 h-full transition duration-300 overflow-hidden ${classname}`}>
      <span className='w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-xl mb-5'>{icon}</span>

      <h3 className='font-serif tracking-tight text-xl mb-2'>{title}</h3>

      <p className='text-sm text-stone-400 leading-relaxed'>{description}</p>

      {children}
    </div>
  )
}

export default BentoCard
