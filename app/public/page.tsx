import Link from 'next/link';

export default function PublicPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl mb-4">
          Welcome to Our Platform
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          This is a public page accessible to everyone, whether you're logged in or not.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 hover:border-indigo-500 transition-all duration-300">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-white mb-3">Get Started</h2>
          <p className="text-gray-400 mb-6">
            Create an account to access exclusive features and manage your devices securely.
          </p>
          <Link
            href="/api/auth/login"
            className="inline-block px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
          >
            Sign Up / Login
          </Link>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 hover:border-indigo-500 transition-all duration-300">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-white mb-3">Secure & Reliable</h2>
          <p className="text-gray-400 mb-6">
            Built with industry-standard security practices. Your data is protected with enterprise-grade encryption.
          </p>
          <Link
            href="/private"
            className="inline-block px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </div>

      <div className="mt-12 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-2xl p-8 border border-indigo-700/50">
        <h3 className="text-2xl font-bold text-white mb-4">About This Platform</h3>
        <p className="text-gray-300 leading-relaxed mb-4">
          Our platform provides a secure and seamless experience for managing your account across multiple devices. 
          With our N-device authentication system, you can stay logged in on up to 3 devices simultaneously, 
          ensuring both convenience and security.
        </p>
        <p className="text-gray-400">
          Whether you're accessing from your desktop, tablet, or mobile device, we've got you covered.
        </p>
      </div>
    </div>
  );
}