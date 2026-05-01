import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const steps = [
    { title: 'Welcome', content: 'Welcome to the Hotel Management System!' },
    { title: 'Dashboard', content: 'Use the dashboard to see occupancy and check-ins.' },
    { title: 'Rooms', content: 'Manage room status from the Rooms page.' },
    { title: 'Guests', content: 'Add guests and book rooms from the Guests page.' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{steps[step].title}</h2>
        <p className="mb-6">{steps[step].content}</p>
        <div className="flex justify-between">
          <button 
            disabled={step === 0} 
            onClick={() => setStep(step - 1)} 
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          {step === steps.length - 1 ? (
            <button onClick={onComplete} className="px-4 py-2 bg-indigo-600 text-white rounded">Finish</button>
          ) : (
            <button onClick={() => setStep(step + 1)} className="px-4 py-2 bg-indigo-600 text-white rounded">Next</button>
          )}
        </div>
      </div>
    </div>
  );
}
