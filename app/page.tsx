export default function Home() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
        Welcome to the N-Device Auth App
      </h1>
      <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300">
        This is the public home page. Anyone can see this.
      </p>
      <div className="mt-10 flex justify-center space-x-4">
        <a
          href="/public"
          className="inline-block px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          View Public Page
        </a>
        <a
          href="/private"
          className="inline-block px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          View Private Page
        </a>
      </div>
    </div>
  );
}