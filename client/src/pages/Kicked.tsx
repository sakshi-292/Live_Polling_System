export default function Kicked() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <span className="inline-flex items-center gap-1 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-6">
        ✦ Intervue Poll
      </span>

      <h1 className="text-2xl font-bold mb-3">You've been Kicked out !</h1>
      <p className="text-gray-500 text-sm text-center max-w-md">
        Looks like the teacher has removed you from the poll system. Please Try
        again sometime.
      </p>
    </div>
  );
}
