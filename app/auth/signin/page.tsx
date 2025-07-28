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

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    fetchProviders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-950 border-gray-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/hexkexlogo.png" 
              alt="Hex & Kex Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <CardTitle className="text-2xl text-white">Welcome to Hex & Kex</CardTitle>
          <CardDescription className="text-gray-400">
            Sign in with your GitHub account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {providers &&
            Object.values(providers).map((provider) => (
              <div key={provider.name}>
                <Button
                  onClick={() => signIn(provider.id, { callbackUrl: "/" })}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
                  size="lg"
                >
                  <Github className="w-5 h-5 mr-2" />
                  Sign in with {provider.name}
                </Button>
              </div>
            ))}
          
          <div className="text-center text-sm text-gray-500 mt-6">
            <p>By signing in, you agree to our terms of service and privacy policy.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
