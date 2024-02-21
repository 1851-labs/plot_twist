import { api } from '@/convex/_generated/api';
import { preloadQuery } from 'convex/nextjs';
import DashboardHomePage from './dashboard';
import { getAuthToken } from '../auth';

const ServerDashboardHomePage = async () => {
  const token = await getAuthToken();

  const preloadedStories = await preloadQuery(api.stories.getStories, {}, { token });

  return <DashboardHomePage preloadedStories={preloadedStories} />;
};

export default ServerDashboardHomePage;
