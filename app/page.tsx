import Link from 'next/link';

export default function Home() {
  return (
    <div className="text-center">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            N-Device Session Manager
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-300 leading-relaxed">
            Secure multi-device authentication with intelligent session management. 
            Control your account access across multiple devices seamlessly.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Link
            href="/public"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-8 border border-gray-700 hover:border-indigo-500 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="text-4xl mb-4">🌐</div>
              <h2 className="text-2xl font-bold text-white mb-2">Public Page</h2>
              <p className="text-gray-400">
                Accessible to everyone. Explore our public content and features.
              </p>
            </div>
          </Link>

          <Link
            href="/private"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-8 border border-indigo-700 hover:border-indigo-400 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="text-4xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-white mb-2">Private Dashboard</h2>
              <p className="text-gray-400">
                Your personal space. View your profile and manage your account.
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-16 p-6 rounded-2xl bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-700/50 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-3">✨ Key Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">✓</span>
              <span>Multi-Device Support</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">✓</span>
              <span>Secure Authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">✓</span>
              <span>Session Management</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}