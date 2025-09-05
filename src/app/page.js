import React from 'react';

function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#3A64B0] px-6 py-12">
      <div className="max-w-2xl bg-white shadow-lg rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Registrations are Closed
        </h1>
        <p className="text-gray-700 mb-4">
          We thank all our colleagues for the enthusiasm shown to register for
          the <span className="font-semibold">IADR APR conference</span>.
        </p>
        <p className="text-gray-700 mb-4">
          Due to Venue and Logistic restraints, we shall be closing our
          Registrations on the midnight of{' '}
          <span className="font-semibold">5th September 2025 (Indian Time)</span>.
        </p>
        <p className="text-gray-700 mb-4">
          <span className="font-semibold">Spot registration</span> shall however
          be available @ <span className="font-semibold">₹25,000 (including GST)</span>{' '}
          for all Domestic delegate categories and{' '}
          <span className="font-semibold">USD 720 (including GST)</span>.
        </p>
        <p className="text-gray-700 mb-6">
          Pre-conference and In-house Accommodation registrations are{' '}
          <span className="font-semibold">open</span>.
        </p>

        {/* Buttons for Booking */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="https://register.iadrapr2025.com/pcc-registration"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Pre-conference Registration
          </a>
          <a
            href="https://register.iadrapr2025.com/accommodation"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-md bg-green-600 text-white font-medium hover:bg-green-700 transition"
          >
            Accommodation Booking
          </a>
        </div>
      </div>
    </div>
  );
}

export default Page;
