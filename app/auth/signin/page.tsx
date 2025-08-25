'use client';

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

export default function SignIn() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const res = await getProviders();
        console.log('Providers response:', res);
        setProviders(res);
        setError(null);
      } catch (err) {
        console.error('Error fetching providers:', err);
        setError('Failed to load authentication providers');
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-950 border-gray-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/whiterabbitlogo.png"
              alt="White Rabbit Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
          <CardTitle className="text-2xl text-white">Welcome to White Rabbit</CardTitle>
          <CardDescription className="text-gray-400">
            Sign in with your GitHub account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-2 text-gray-400">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-red-400 mb-4">{error}</p>
              <Button
                onClick={() => signIn("github", { callbackUrl: "/enter" })}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
                size="lg"
              >
                <Github className="w-5 h-5 mr-2" />
                Sign in with GitHub
              </Button>
            </div>
          ) : providers && Object.keys(providers).length > 0 ? (
            Object.values(providers).map((provider) => (
              <div key={provider.name}>
                <Button
                  onClick={() => signIn(provider.id, { callbackUrl: "/enter" })}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
                  size="lg"
                >
                  <Github className="w-5 h-5 mr-2" />
                  Sign in with {provider.name}
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 mb-4">GitHub authentication is not configured</p>
              <Button
                onClick={() => signIn("github", { callbackUrl: "/enter" })}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
                size="lg"
              >
                <Github className="w-5 h-5 mr-2" />
                Try GitHub Sign In
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                If this doesn't work, check your GitHub OAuth configuration
              </p>
            </div>
          )}

          <div className="text-center text-sm text-gray-500 mt-6">
            <p>By signing in, you agree to our terms of service and privacy policy.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
