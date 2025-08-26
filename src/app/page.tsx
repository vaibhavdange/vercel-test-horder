"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Define user credentials for demo purposes
const USERS = {
  admin: {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'System Administrator',
    permissions: ['all']
  },
  cashier: {
    username: 'cashier',
    password: 'cashier123',
    role: 'cashier',
    name: 'Cashier User',
    permissions: ['new-order', 'orders']
  }
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simple validation
      if (!username.trim() || !password.trim()) {
        setError("Please enter both username and password");
        setIsLoading(false);
        return;
      }

      // Check credentials against predefined users
      const user = USERS[username.toLowerCase() as keyof typeof USERS];
      
      if (!user || user.password !== password) {
        setError("Invalid username or password");
        setIsLoading(false);
        return;
      }

      // Store authentication data
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify({ 
        username: user.username,
        role: user.role,
        name: user.name,
        permissions: user.permissions
      }));
      
      // Redirect based on user role
      if (user.role === 'cashier') {
        router.push("/new-order");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Brand Header */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <h1 className="text-4xl font-bold text-green-600">HORDER</h1>
      </div>

      {/* Login Form Container */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-strong p-8 border border-gray-100">
          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Login!</h2>
            <p className="text-gray-600">Please enter your credentials below to continue</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
                                    {/* Username Field */}
                        <div>
                          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                            Username
                          </label>
                          <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                            required
                            disabled={isLoading}
                          />
                        </div>

                                    {/* Password Field */}
                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              id="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter your password"
                              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                              required
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              disabled={isLoading}
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                                    {/* Remember Me and Forgot Password */}
                        <div className="flex items-center justify-between">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                              disabled={isLoading}
                            />
                            <span className="text-sm text-gray-700">Remember me</span>
                          </label>
                          <button
                            type="button"
                            className="text-sm text-green-600 hover:text-green-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                          >
                            Forgot Password?
                          </button>
                        </div>

                                    {/* Login Button */}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center space-x-2">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Logging in...</span>
                            </div>
                          ) : (
                            "Login"
                          )}
                                                </button>
                      </form>

                      {/* Error Message */}
                      {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600 text-center">{error}</p>
                        </div>
                      )}

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              <strong>Demo Credentials:</strong><br />
              Username: admin<br />
              Password: admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
