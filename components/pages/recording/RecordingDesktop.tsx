import { formatTimestamp } from '@/lib/utils';
import { useState } from 'react';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { v } from 'convex/values';

export default function RecordingDesktop({
  jokes, // from stories.getStory
  summary,
  transcription,
  title,
  _creationTime,
  generatingTitle,
  generatingJoke,
  images, // from stories.getStory
  _id
}: {
  jokes?: any;
  summary?: string;
  transcription?: string;
  title?: string;
  _creationTime?: number;
  generatingTitle?: boolean;
  generatingJoke?: boolean;
  images?: any,
  _id?: any;
}) {
  const [originalIsOpen, setOriginalIsOpen] = useState<boolean>(true);

  // Trigger a mutation to add a new joke to the story
  const createNewJokeAction = useAction(api.jokes.createJokeFromStory);
  const handleCreateJoke = () => {
    createNewJokeAction({ id:_id });
  };

  // Trigger a mutation to create a new image for the story
  const createNewImageAction = useAction(api.stories.createAndSaveImage);
  const handleCreateNewImage = () => {
    createNewImageAction({ id: _id });
  }

  // Trigger a mutation to remove a joke from the story
  const removeMutateJoke = useMutation(api.jokes.removeJoke);
  function removeJoke(jokeId: any) {
    removeMutateJoke({ id: jokeId.id });
  }

  return (
    <div className="hidden md:block">
      <div className="max-width mt-5 flex items-center justify-between">
        <div />
        <h1
          className={`leading text-center text-xl font-medium leading-[114.3%] tracking-[-0.75px] text-dark md:text-[35px] lg:text-[43px] ${
            generatingTitle && 'animate-pulse'
          }`}
        >
          {generatingTitle ? 'Generating Title...' : title ?? 'Untitled Story'}
        </h1>
        <div className="flex items-center justify-center">
          <p className="text-lg opacity-80">
            {formatTimestamp(Number(_creationTime))}
          </p>
        </div>
      </div>
      <div className="mt-[18px] grid h-fit w-full grid-cols-2 px-[30px] py-[19px] lg:px-[45px]">
        <div className="flex w-full items-center justify-center gap-[50px] border-r  lg:gap-[70px]">
          <div className="flex items-center gap-4">
            <button
              className={`text-xl leading-[114.3%] tracking-[-0.6px] text-dark lg:text-2xl ${
                originalIsOpen ? 'opacity-100' : 'opacity-40'
              } transition-all duration-300`}
            >
              Transcript
            </button>
            <div
              onClick={() => setOriginalIsOpen(!originalIsOpen)}
              className="flex h-[20px] w-[36px] cursor-pointer items-center rounded-full bg-dark px-[1px]"
            >
              <div
                className={`h-[18px] w-4 rounded-[50%] bg-light ${
                  originalIsOpen ? 'translate-x-0' : 'translate-x-[18px]'
                } transition-all duration-300`}
              />
            </div>
            <button
              className={`text-xl leading-[114.3%] tracking-[-0.6px] text-dark lg:text-2xl ${
                !originalIsOpen ? 'opacity-100' : 'opacity-40'
              } transition-all duration-300`}
            >
              Summary
            </button>
          </div>
        </div>
        {
        <div className="text-center">
          <h1 className="text-xl leading-[114.3%] tracking-[-0.75px] text-dark lg:text-2xl xl:text-[30px]">
            Jokes
          </h1>
        </div> 
        }
      </div>
      <div className="grid h-full w-full grid-cols-2 px-[30px] lg:px-[45px]">
        <div className="relative min-h-[70vh] w-full border-r px-5 py-3 text-justify text-xl font-[300] leading-[114.3%] tracking-[-0.6px] lg:text-2xl">
          {transcription ? (
            <div className="">{originalIsOpen ? transcription : summary}</div>
          ) : (
            // Loading state for transcript
            <ul className="animate-pulse space-y-3">
              <li className="h-6 w-full rounded-full bg-gray-200 dark:bg-gray-700"></li>
              <li className="h-6 w-full rounded-full bg-gray-200 dark:bg-gray-700"></li>
              <li className="h-6 w-full rounded-full bg-gray-200 dark:bg-gray-700"></li>
              <li className="h-6 w-full rounded-full bg-gray-200 dark:bg-gray-700"></li>
              <li className="h-6 w-full rounded-full bg-gray-200 dark:bg-gray-700"></li>
            </ul>
          )}

          { 
            images?.map((image: any, idx: number) => (
              <img src={image.imageFileUrl} height="256px" width="auto" />
            )) 
          }

          <button
            onClick={handleCreateNewImage}
            className="rounded-[7px] bg-dark px-5 py-[15px] text-[17px] leading-[79%] tracking-[-0.75px] text-light md:text-xl lg:px-[37px]"
            style={{ boxShadow: ' 0px 4px 4px 0px rgba(0, 0, 0, 0.25)' }}
          >
            New Image
          </button>

        </div>
        <div className="relative mx-auto mt-[27px] w-full max-w-[900px] px-5 md:mt-[45px]">
          {generatingJoke || !jokes
            ? [0].map((item: any, idx: number) => (
                <div
                  className="animate-pulse border-[#00000033] py-1 md:border-t-[1px] md:py-2"
                  key={idx}
                >
                  <div className="flex w-full justify-center">
                    <div className="group w-full items-center rounded p-2 text-lg font-[300] text-dark transition-colors duration-300 checked:text-gray-300 hover:bg-gray-100 md:text-2xl">
                      <div className="flex items-center">
                        <label className="h-5 w-full rounded-full bg-gray-200" />
                      </div>
                      <div className="flex justify-between md:mt-2">
                        <p className="ml-9 text-[15px] font-[300] leading-[249%] tracking-[-0.6px] text-dark opacity-60 md:inline-block md:text-xl lg:text-xl">
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            : jokes?.map((item: any, idx: number) => (
                <div
                  className="border-[#00000033] py-1 md:border-t-[1px] md:py-2"
                  key={idx}
                >
                  <div className="flex w-full justify-center">
                    <div className="group w-full items-center rounded p-2 text-lg font-[300] text-dark transition-colors duration-300 checked:text-gray-300 hover:bg-gray-100 md:text-2xl">
                      <div className="flex items-center">
                       <label className="">{item?.joke}</label>
                      </div>
                      <div className="flex justify-between md:mt-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            removeJoke({ id: item._id });
                          }}
                            className="flex cursor-pointer items-center justify-center gap-5 bg-transparent p-2 transition hover:scale-125"
                        >
                          <img src={'/icons/delete.svg'} alt="delete" width={20} height={20} />
                        </button>
                        <p className="ml-9 text-[15px] font-[300] leading-[249%] tracking-[-0.6px] text-dark opacity-60 md:inline-block md:text-xl lg:text-xl">
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
          }
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center justify-center">
            <button
              onClick={handleCreateJoke}
              className="rounded-[7px] bg-dark px-5 py-[15px] text-[17px] leading-[79%] tracking-[-0.75px] text-light md:text-xl lg:px-[37px]"
              style={{ boxShadow: ' 0px 4px 4px 0px rgba(0, 0, 0, 0.25)' }}
            >
              Generate New Joke
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
