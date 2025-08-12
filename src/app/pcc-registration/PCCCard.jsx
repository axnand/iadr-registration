'use client';

export default function PCCCard({ title, type, conductors, fee, code, imageUrl }) {
  const badgeColor = type === 'Full Day' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

  return (
    <div className="bg-white rounded-xl hover:cursor-pointer shadow-lg overflow-hidden flex flex-col justify-between transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
      {imageUrl && (
        <div className="h-56 w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col items-start">
         <span className={`px-2 py-1 rounded-full text-sm font-medium ${badgeColor}`}>{type}</span>
        <h3 className="mt-2 text-lg font-bold text-gray-900">{title}</h3>
        <div className="mt-3">
            <h1 className="text-sm pb-1 font-semibold text-gray-800">Conductors:</h1>
        {conductors.map((name, index) => (
            <p key={index} className="text-sm text-gray-600 font-semibold">
            {name}
            </p>
        ))}
        </div>
      </div>
      <div className="flex flex-col py-6  border-t-2 mx-4 mt-2">
        <p className="text-xl  text-zinc-900 mt-4 font-bold">Fee: ₹{fee}</p>
        <p className="text-sm mt-1 font-medium text-gray-500">Code: {code}</p>
      <button
        onClick={() => alert(`Registering for ${code}`)}
        className="mt-4  bg-indigo-600 text-white py-2 font-semibold  rounded-lg hover:bg-indigo-700 transition"
      >
        Register
      </button>
      </div>
    </div>
  );
}
