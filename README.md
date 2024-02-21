<a href="https://usenotesgpt.com/">
  <img alt="PlotTwist - A fun, lighthearted way to share stories and laugh at themselves" src="/public/images/cyclone.svg">
  <h1 align="center">PlotTwist</h1>
</a>

<p align="center">
</p>

<p align="center">
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
</p>
<br/>

## Tech Stack

- [Convex](https://convex.dev/) for the database and cloud functions
- Next.js [App Router](https://nextjs.org/docs/app) for the framework
- [Together Inference](https://dub.sh/together-ai) for the LLM (Mixtral)
- [Together Embeddings](https://dub.sh/together-ai) for the embeddings for search
- [Convex File Storage](https://docs.convex.dev/file-storage) for storing voice notes
- [Convex Vector search](https://docs.convex.dev/vector-search) for vector search
- [Replicate](https://replicate.com/) for Whisper transcriptions
- [Clerk](https://clerk.dev/) for user authentication
- [Tailwind CSS](https://tailwindcss.com/) for styling

## Local "deployment"

You can deploy this template by setting up the following services and adding their environment variables:

1. Run `npm install` to install dependencies.
2. Run `npm run dev`. It will prompt you to log into [Convex](https://convex.dev) and create a project.
3. It will then ask you to supply the `CLERK_ISSUER_URL`. To do this:
   1. Make a [Clerk](https://clerk.dev) account.
   2. Copy the [API keys](https://dashboard.clerk.com/last-active?path=api-keys) into `.env.local`.
   3. Do steps 1-3 [here](https://docs.convex.dev/auth/clerk) and copy the Issuer URL.
      It should look something like `https://some-animal-123.clerk.accounts.dev`.
   4. Add `CLERK_ISSUER_URL` to your [Convex Environment Variables](https://dashboard.convex.dev/deployment/settings/environment-variables?var=CLERK_ISSUER_URL)
      (deep link also available in your terminal). Paste the Issuer URL as the value and click "Save".
4. Now your frontend and backend should be running and you should be able to log in but not record.
5. Make a [Together](https://dub.sh/together-ai) account to get your [API key](https://api.together.xyz/settings/api-keys).
6. Make a [Replicate](https://replicate.com) account to get your [API key](https://replicate.com/account/api-tokens).
7. Save your environment variables in Convex [as `REPLICATE_API_KEY` and `TOGETHER_API_KEY`](https://dashboard.convex.dev/deployment/settings/environment-variables?var=REPLICATE_API_KEY&var=TOGETHER_API_KEY).

# TODO
[ ] Deploy for external usage under 1851labs domain
[ ] Revamp UX to store "stories"
[ ] Add button to turn story into joke
[ ] Add button to turn story into limrick (poem)


# Dev Notes
- Step #1 - Local setup following `Local "deployment"` above
- Step #2 - AWS Amplify Deployment
  - Follow Amplify "Existing App" flow to connect to repo
  - Set `Build Settings` image to Linux2023
  - Setup the environment variables so the build works: https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html
    - Grab from .env.local
  - Setup the environment variables so deployed app has access to them: https://docs.aws.amazon.com/amplify/latest/userguide/ssr-environment-variables.html
    - This will pull the env vars set during build and write them to .env.production before running the app