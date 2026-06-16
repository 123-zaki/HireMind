"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CATEGORIES } from '@/lib/data';
import { Search } from 'lucide-react';
import React, { useMemo, useState } from 'react'
import InterviewerCard from './InterviewerCard';

const ExploreGrid = ({ interviewers }) => {
    const [activeCategory, setActiveCategory] = useState(null);
    const [search, setSearch] = useState('');


    const filtered = useMemo(() => {
        return interviewers.filter(interviewer => {
            const matchesCategory = activeCategory === null || interviewer.categories?.includes(activeCategory);


            const q = search.toLowerCase().trim();
            const matchesSearch = !q || interviewer.name.toLowerCase().includes(q) || interviewer.title.toLowerCase().includes(q) || interviewer.company.toLowerCase().includes(q);


            return matchesCategory && matchesSearch;
        });
    }, [interviewers, activeCategory, search]);


    return (
        <div className='flex flex-col gap-8'>
            <div className='flex flex-col gap-4'>
                <div className='relative max-w-sm'>
                    <Search
                        size={14}
                        className='absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-600 pointer-events-none'
                    />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, title, or company..."
                        className={`pl-9 bg-[#0f0f11] border-white/10 text-stone-100 placeholder:text-stone-600 text-sm`}
                    />
                </div>

                <div className='flex flex-wrap gap-2'>
                    {
                        CATEGORIES.map(cat => {
                            const active = cat.value === activeCategory;

                            return (
                                <button
                                    key={String(cat.value)}
                                    type='button'
                                    onClick={() => setActiveCategory(cat.value)}
                                    className={`text-xs px-4 py-2  rounded-lg border transition-all duration-200 ${active ? "border-amber-400/40 bg-amber-400/10 text-amber-400" : "border-white/10 text-stone-500 hover:border-white/20 hover:text-stone-400"}`}
                                >
                                    {cat.label}
                                </button>
                            );
                        })
                    }
                </div>
            </div>

            {/* Results count */}
            <p className='text-xs text-stone-600'>
                {filtered.length === 0 ? "No interviewers found" : `${filtered.length} interviewer${filtered.length > 1 ? "s" : ""} found`}
            </p>


            {/* Interviewers Cards */}
            {
                filtered.length === 0 ?
                    (<div className='py-20 text-center'>
                        <p className='text-stone-600 text-sm'>No interviewers match your filters</p>
                        <Button
                            variant='link'
                            onClick={() => {
                                setActiveCategory(null);
                                setSearch('');
                            }}
                            className={`cursor-pointer`}
                        >
                            Clear Filter
                        </Button>
                    </div>) :

                    (<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {
                            filtered.map(interviewer => (
                                <InterviewerCard key={interviewer.id} interviewer={interviewer} />
                            ))
                        }
                    </div>)
            }
        </div>
    )
}

export default ExploreGrid
