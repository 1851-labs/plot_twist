import { api } from '@/convex/_generated/api';
import { preloadQuery } from 'convex/nextjs';
import { getAuthToken } from '@/app/auth';
import RecordingPage from './recording';

const Page = async ({ params }: { params: { id: string } }) => {
  const id = params.id as any;
  const token = await getAuthToken();
  const preloadedStory = await preloadQuery(
    api.stories.getStory,
    { id },
    { token },
  );

  return <RecordingPage preloadedStory={preloadedStory} />;
};

export default Page;
