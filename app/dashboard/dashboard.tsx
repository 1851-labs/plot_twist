'use client';

import AuthenticatedPreload from '@/components/preloading';
import Image from 'next/image';
import Link from 'next/link';
import RecordedfileItemCard from '@/components/pages/dashboard/RecordedfileItemCard';
import { FunctionReturnType } from 'convex/server';
import { Preloaded, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePreloadedQueryWithAuth } from '@/lib/hooks';
import { useState } from 'react';


/*
const PreloadedDashboardHomePage = ({
  preloadedStories,
}: {
  preloadedStories: Preloaded<typeof api.stories.getStories>;
}) => {
  return (
    <AuthenticatedPreload preload={preloadedStories}>
      <DashboardHomePage preloadedStories={undefined} />
    </AuthenticatedPreload>
  );
};
*/

const DashboardHomePage = ({
  preloadedStories,
}: {
  preloadedStories:  Preloaded<typeof api.stories.getStories>;
}) => {
  const allStories = usePreloadedQueryWithAuth(preloadedStories);
  const [searchQuery, setSearchQuery] = useState('');
  const [relevantStories, setRelevantStories] =
    useState<FunctionReturnType<typeof api.stories.getStories>>();

  const searchForSimilarStories = useAction(api.stories.findSimilarStories);

  const handleSearch = async (e: any) => {
    e.preventDefault();

    if (searchQuery === '') {
      setRelevantStories(undefined);
    } else {
      const scores = await searchForSimilarStories({ searchQuery: searchQuery });
      const scoreMap: Map<string, number> = new Map();
      for (const s of scores) {
        scoreMap.set(s.id, s.score);
      }
      const filteredResults = allStories.filter(
        (story) => (scoreMap.get(story._id) ?? 0) > 0.5,
      );
      setRelevantStories(filteredResults);
    }
  };

  const finalStories = relevantStories ?? allStories;

  return (
    <div suppressHydrationWarning={true} className="mt-5 min-h-[100vh] w-full">
      <div className=" w-full py-[23px] md:py-4 lg:py-[25px]">
        <h1 className="text-center text-2xl font-medium text-dark md:text-4xl">
          Your Memories
        </h1>
      </div>
      {/* search bar */}
      {finalStories && finalStories.length !== 0 && (
      <div className="mx-auto mb-10 mt-4 flex h-fit w-[90%] items-center gap-[17px] rounded border border-black bg-white px-[11px] py-[10px] sm:px-[15px] md:mb-[42px] md:w-[623px] md:px-[40px] md:py-[10px]">
        <Image
          src="/icons/search.svg"
          width={27}
          height={26}
          alt="search"
          className="h-5 w-5 md:h-6 md:w-6"
        />
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search your memories"
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
            className="w-full text-[16px] outline-none md:text-xl"
          />
        </form>
      </div>
      )}
      {/* recorded items */}
      <div className="h-fit w-full max-w-[1360px] md:px-5 xl:mx-auto">
        {finalStories &&
          finalStories.map((item, index) => (
            <RecordedfileItemCard {...item} key={index} />
          ))}
        {finalStories.length === 0 && (
          <div>
          <div className="flex h-[20vh] w-full items-center justify-center">
            <p className="text-center text-2xl text-dark">
            Record a personal story about yourself<br/> to get started
            </p>
          </div>
          <div className="flex h-[15vh] w-full items-center justify-center">
              <Image src="/images/story_telling_sticker.png" width={256} height={256} alt="storytime with grandpa" />
          </div>
          </div>
        )}
      </div>
      {/* actions button container */}
      <div className="mx-auto mt-[40px] flex h-fit w-full flex-col items-center px-5 pb-10 md:mt-[50px] lg:pb-5">
        <div className="mt-10 flex flex-col gap-6 md:flex-row">
          <Link
            className="rounded-[7px] bg-dark px-[37px] py-[15px] text-[17px] leading-[79%] tracking-[-0.75px] text-light md:text-2xl"
            style={{ boxShadow: ' 0px 4px 4px 0px rgba(0, 0, 0, 0.25)' }}
            href="/record"
          >
            { finalStories.length === 0 ? "Record A Story" : "Record a New Story" }
          </Link>
        </div>
      </div>
    </div>
  );
};

//export default PreloadedDashboardHomePage;
export default DashboardHomePage;
