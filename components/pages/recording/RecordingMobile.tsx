import Link from 'next/link';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import toast, { Toaster } from 'react-hot-toast';

export default function RecordingMobile({
  summary,
  transcription,
  title,
  _creationTime,
}: {
  summary?: string;
  transcription?: string;
  title?: string;
  _creationTime?: number;
}) {
  const [transcriptOpen, setTranscriptOpen] = useState<boolean>(true);
  const [summaryOpen, setSummaryOpen] = useState<boolean>(false);
  
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
            //setActionItemOpen(false),
            setSummaryOpen(false)
          )}
          className={`py-[12px] text-[17px] leading-[114.3%] tracking-[-0.425px] ${
            transcriptOpen ? 'action-btn-active' : 'action-btn'
          }`}
        >
          Transcript
        </button>
        <button
          onClick={() => (
            setTranscriptOpen(false),
            setSummaryOpen(!summaryOpen)
          )}
          className={`py-[12px] text-[17px] leading-[114.3%] tracking-[-0.425px] ${
            summaryOpen ? 'action-btn-active' : 'action-btn'
          }`}
        >
          Summary
        </button>
      </div>
      <div className="w-full">
        {transcriptOpen && (
          <div className="relative mt-2 min-h-[70vh] w-full px-4 py-3 text-justify font-light">
            <div className="">{transcription}</div>
          </div>
        )}
        {summaryOpen && (
          <div className="relative mt-2 min-h-[70vh] w-full px-4 py-3 text-justify font-light">
            {summary}
          </div>
        )}
        <Toaster position="bottom-left" reverseOrder={false} />
      </div>
    </div>
  );
}
