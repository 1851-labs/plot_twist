import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/convex/_generated/api';
import toast, { Toaster } from 'react-hot-toast';
import { Sticker } from 'lucide-react';
import { useMutation, useAction } from 'convex/react';
import { set } from 'zod';


const StorySummary = ({
  summary,
  protagonist,
  conflict,
  setting,
}: {
  summary?: string;
  protagonist?: string;
  conflict?: string;
  setting?: string;
}) => {
  return (
    <div className="relative mt-2 min-h-[70vh] w-full px-4 py-3 text-justify font-light">
      <ul>
        <li key={1} className="my-5">
          <div className="my-1 text-dark text-xl">Summary</div>
          <p>{summary}</p>
        </li>
        <li key={2} className="my-5">
          <div className="my-1 text-dark text-xl">Protagonist</div>
          <p>{protagonist}</p>
        </li>
        <li key={3} className="my-5">
          <div className="my-1 text-dark text-xl">Conflict</div>
          <p>{conflict}</p>
        </li>
        <li className="my-5">
          <div className="my-1 text-dark text-xl">Setting</div>
          <p>{setting}</p>
        </li>
      </ul>
    </div>
  );
};

const StoryImages = ({
  images,
  generatingImage,
  _id,
}: {
  images?: any;
  generatingImage?: boolean;
  _id?: any;
}) => {
  // Trigger a mutation to set that we're generating an image
  const setGeneratingImage = useMutation(api.stories.setGeneratingImage);

  // Trigger an action to create a new image for the story
  const createNewImageAction = useAction(api.stories.createAndSaveImage);
  const handleCreateNewImage = () => {
    setGeneratingImage({ id: _id });
    createNewImageAction({ id: _id });
  }

  return (
      <div className="relative mx-auto mt-[27px] w-full max-w-[900px] px-5 md:mt-[45px]">

      <ul className="my-5">
        {images?.map((image: any, idx: number) => (
          <li key={idx}><img src={image.imageFileUrl} height="auto" width="100%" /></li>
        ))}
        {generatingImage && (
          <li key={100000}>
            <ul className="animate-pulse space-y-3">
              <li className="h-6 w-full rounded-full bg-gray-200 dark:bg-gray-700"></li>
              <li className="h-6 w-full rounded-full bg-gray-200 dark:bg-gray-700"></li>
              <li className="h-6 w-full rounded-full bg-gray-200 dark:bg-gray-700"></li>
              <li className="h-6 w-full rounded-full bg-gray-200 dark:bg-gray-700"></li>
              <li className="h-6 w-full rounded-full bg-gray-200 dark:bg-gray-700"></li>
            </ul>
          </li>
        )}
      </ul>

      <button
        onClick={handleCreateNewImage}
        className="rounded-[7px] bg-dark px-5 py-[15px] text-[17px] leading-[79%] tracking-[-0.75px] text-light md:text-xl lg:px-[37px]"
        disabled={generatingImage}
        style={{ boxShadow: ' 0px 4px 4px 0px rgba(0, 0, 0, 0.25)' }}
      >
        Generate New Image
      </button>
      </div>
  );
}

const StoryTranscript = ({ 
  transcription,
  images,
  _id,
  }: { 
    transcription?: string;
    images?: any;
    _id?: any;
  }) => {
  // Trigger a mutation to create a new image for the story
  const createNewImageAction = useAction(api.stories.createAndSaveImage);
  const handleCreateNewImage = () => {
    createNewImageAction({ id: _id });
  }

  return (
    <div className="relative mt-2 min-h-[70vh] w-full px-4 py-3 text-justify font-light">
      <div className="my-2 text-xl">{transcription}</div>
      {images.length > 0 && (
        <img className="text-justify" src={images[0].imageFileUrl} height="auto" width="100%" />
      )}
    </div>
  );
}

const StoryJokes = ({ 
  jokes,
  generatingJoke,
  _id,
  }: { 
    jokes?: any;
    generatingJoke?: boolean;
    _id?: any;
  }) => {
  // Set generating joke to true through a mutation
  const setGeneratingJoke = useMutation(api.stories.setGeneratingJoke);

  // Trigger an action to add a new joke to the story
  const createNewJokeAction = useAction(api.jokes.createJokeFromStory);
  const handleCreateJoke = () => {
    setGeneratingJoke({ id: _id });
    createNewJokeAction({ id:_id });
  };

  // Trigger a mutation to remove a joke from the story
  const removeMutateJoke = useMutation(api.jokes.removeJoke);
  function removeJoke(jokeId: any) {
    removeMutateJoke({ id: jokeId.id });
  }

  return (
    <div className="relative mx-auto mt-[27px] w-full max-w-[900px] px-5 md:mt-[45px]">
      {!jokes
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
                  </div>
                </div>
              </div>
            </div>
          ))
      }
      {generatingJoke && (
        <div
          className="animate-pulse border-[#00000033] py-1 md:border-t-[1px] md:py-2"
          key={100000}
        >
          <div className="flex w-full justify-center">
            <div className="group w-full items-center rounded p-2 text-lg font-[300] text-dark transition-colors duration-300 checked:text-gray-300 hover:bg-gray-100 md:text-2xl">
              <div className="flex items-center my-1">
                <label className="h-5 w-full rounded-full bg-gray-200" />
              </div>
              <div className="flex items-center">
                <label className="h-5 w-full rounded-full bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="items-center justify-center">
        <button
          onClick={handleCreateJoke}
          className="rounded-[7px] bg-dark px-5 py-[15px] text-[17px] leading-[79%] tracking-[-0.75px] text-light md:text-xl lg:px-[37px]"
          disabled={generatingJoke}
          style={{ boxShadow: ' 0px 4px 4px 0px rgba(0, 0, 0, 0.25)' }}
        >
          Generate New Joke
        </button>
      </div>
    </div>
  );
}
export default function RecordingMobile({
  transcription,
  summary,
  title,
  protagonist,
  setting,
  conflict,
  jokes,
  images,
  generatingJoke,
  generatingImage,
  _id
}: {
  transcription?: string;
  summary?: string;
  title?: string;
  protagonist?: string;
  setting?: string;
  conflict?: string;
  jokes?: any;
  images?: any;
  generatingJoke?: boolean;
  generatingImage?: boolean;
  _id?: any;
}) {
  const [transcriptOpen, setTranscriptOpen] = useState<boolean>(true);
  const [summaryOpen, setSummaryOpen] = useState<boolean>(false);
  const [jokesOpen, setJokesOpen] = useState<boolean>(false);
  const [imagesOpen, setImagesOpen] = useState<boolean>(false);

  return (
    <div className="md:hidden">
      <div className="max-width my-5 flex items-center justify-center">
        <h1 className="leading text-center text-xl font-medium leading-[114.3%] tracking-[-0.75px] text-dark md:text-[35px] lg:text-[43px]">
          {title ?? 'Untitled Story'}
        </h1>
      </div>
      <div className="grid w-full grid-cols-2 ">
        <button
          onClick={() => (
            setTranscriptOpen(!transcriptOpen),
            setSummaryOpen(false),
            setJokesOpen(false),
            setImagesOpen(false)
          )}
          className={`py-[12px] text-[17px] leading-[114.3%] tracking-[-0.425px] ${
            transcriptOpen ? 'action-btn-active' : 'action-btn'
          }`}
        >
          Your Story
        </button>
        <button
          onClick={() => (
            setTranscriptOpen(false),
            setSummaryOpen(false),
            setJokesOpen(false),
            setImagesOpen(!imagesOpen)
          )}
          className={`py-[12px] text-[17px] leading-[114.3%] tracking-[-0.425px] ${
            imagesOpen ? 'action-btn-active' : 'action-btn'
          }`}
        >
          Visualizations
        </button>
        <button
          onClick={() => (
            setTranscriptOpen(false),
            setSummaryOpen(false),
            setJokesOpen(!jokesOpen),
            setImagesOpen(false)
          )}
          className={`py-[12px] text-[17px] leading-[114.3%] tracking-[-0.425px] ${
            jokesOpen ? 'action-btn-active' : 'action-btn'
          }`}
        >
          Jokes
        </button>
        <button
          onClick={() => (
            setTranscriptOpen(false),
            setSummaryOpen(!summaryOpen),
            setJokesOpen(false),
            setImagesOpen(false)
          )}
          className={`py-[12px] text-[17px] leading-[114.3%] tracking-[-0.425px] ${
            summaryOpen ? 'action-btn-active' : 'action-btn'
          }`}
        >
          Summary
        </button>
      </div>
      <div className="w-full">
        {transcriptOpen && (<StoryTranscript transcription={transcription} images={images} />)}
        {summaryOpen && (<StorySummary summary={summary} protagonist={protagonist} conflict={conflict} setting={setting} />)}
        {jokesOpen && (<StoryJokes jokes={jokes} _id={_id} generatingJoke={generatingJoke} />)}
        {imagesOpen && (<StoryImages images={images} _id={_id} generatingImage={generatingImage} />)}

        <Toaster position="bottom-left" reverseOrder={false} />
      </div>
    </div>
  );
}
