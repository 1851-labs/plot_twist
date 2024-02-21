'use client';

import Header from '@/components/ui/Header';
import RecordingDesktop from '@/components/pages/recording/RecordingDesktop';
import RecordingMobile from '@/components/pages/recording/RecordingMobile';
import { api } from '@/convex/_generated/api';
import { Preloaded } from 'convex/react';
import AuthenticatedPreload from '@/components/preloading';
import { FunctionReturnType } from 'convex/server';

const PreloadedRecordingPage = ({
  preloadedStory,
}: {
  preloadedStory: Preloaded<typeof api.stories.getStory>;
}) => {
  return (
    <AuthenticatedPreload preload={preloadedStory}>
      <RecordingPage preloaded={undefined} />
    </AuthenticatedPreload>
  );
};

const RecordingPage = ({
  preloaded,
}: {
  preloaded: FunctionReturnType<typeof api.stories.getStory> | undefined;
}) => {
  const currentStory = preloaded!;

  return (
    <div className="">
      <Header />
      <div className="mx-auto max-w-[1500px]">
        <RecordingDesktop {...currentStory} />
        <RecordingMobile {...currentStory} />
      </div>
    </div>
  );
};

export default PreloadedRecordingPage;
