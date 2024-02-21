import { auth } from '@clerk/nextjs';

export async function getAuthToken() {
  return (await auth().getToken({ template: 'plot_twist_dev_v001' })) ?? undefined;
}
