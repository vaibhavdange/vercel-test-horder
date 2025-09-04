"use client";

export default function Loading() {
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200" style={{ height: '47px' }}>
          <div className="h-4 bg-gray-200 rounded w-48 mx-6 my-4 animate-pulse"></div>
        </div>
        <div className="flex-1 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}


