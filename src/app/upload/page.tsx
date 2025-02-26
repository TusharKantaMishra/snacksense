export default function Upload() {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-4xl font-bold text-neonBlue">Upload Image</h1>
        <p className="text-lg mt-4 text-gray-300">Upload a food packet image to get insights.</p>
        <button className="mt-6 px-6 py-3 text-lg font-semibold bg-neonPink text-white rounded-lg shadow-lg">
          Choose File
        </button>
      </div>
    );
  }
  