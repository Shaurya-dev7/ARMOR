"use client";

import * as React from "react";
import Image from "next/image";
import { Shield, Chrome } from "lucide-react";

const SignIn1 = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignIn = () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    alert("Sign in successful! (Demo)");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden w-full">
      {/* Centered glass card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-br from-white/10 to-background backdrop-blur-xl border border-white/10 shadow-2xl p-8 flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 mb-6 shadow-lg ring-2 ring-primary/30">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-2 text-center tracking-tight">
          ARMOR Intelligence
        </h2>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Secure Access Protocol
        </p>
        {/* Form */}
        <div className="flex flex-col w-full gap-4">
          <div className="w-full flex flex-col gap-3">
            <input
              suppressHydrationWarning
              placeholder="Email"
              type="email"
              value={email}
              className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/10 transition-all"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              suppressHydrationWarning
              placeholder="Password"
              type="password"
              value={password}
              className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/10 transition-all"
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <div className="text-sm text-red-400 text-left">{error}</div>
            )}
          </div>
          <hr className="border-white/10" />
          <div>
            <button
              onClick={handleSignIn}
              className="w-full bg-primary text-primary-foreground font-medium px-5 py-3 rounded-full shadow-lg hover:brightness-110 transition mb-3 text-sm"
            >
              Establish Connection
            </button>
            {/* Google Sign In */}
            <button className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 rounded-full px-5 py-3 font-medium text-white shadow transition mb-2 text-sm border border-white/10">
              <Chrome className="w-5 h-5" />
              Continue with Google
            </button>
            <div className="w-full text-center mt-3">
              <span className="text-xs text-muted-foreground">
                New operative?{" "}
                <a
                  href="/signup"
                  className="underline text-white/80 hover:text-white transition-colors"
                >
                  Request access clearance
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* User count and avatars */}
      <div className="relative z-10 mt-12 flex flex-col items-center text-center">
        <p className="text-muted-foreground text-sm mb-3">
          Join <span className="font-medium text-white">thousands</span> of
          operatives monitoring the cosmos.
        </p>
        <div className="flex -space-x-2">
          <Image
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces"
            alt="user"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full border-2 border-background object-cover"
          />
          <Image
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces"
            alt="user"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full border-2 border-background object-cover"
          />
          <Image
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces"
            alt="user"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full border-2 border-background object-cover"
          />
          <Image
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
            alt="user"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full border-2 border-background object-cover"
          />
        </div>
      </div>
    </div>
  );
};

const SignUp1 = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [role, setRole] = React.useState("civilian");
  const [error, setError] = React.useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignUp = () => {
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    alert("Sign up successful! (Demo)");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden w-full">
      {/* Centered glass card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-br from-white/10 to-background backdrop-blur-xl border border-white/10 shadow-2xl p-8 flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 mb-6 shadow-lg ring-2 ring-primary/30">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-2 text-center tracking-tight">
          ARMOR Intelligence
        </h2>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Request Access Clearance
        </p>
        {/* Form */}
        <div className="flex flex-col w-full gap-4">
          <div className="w-full flex flex-col gap-3">
            <input
              suppressHydrationWarning
              placeholder="Email"
              type="email"
              value={email}
              className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/10 transition-all"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              suppressHydrationWarning
              placeholder="Password"
              type="password"
              value={password}
              className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/10 transition-all"
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              suppressHydrationWarning
              placeholder="Confirm Password"
              type="password"
              value={confirmPassword}
              className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/10 transition-all"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-5 py-3 rounded-xl bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/10 transition-all appearance-none cursor-pointer"
            >
              <option value="civilian" className="bg-background text-white">Civilian</option>
              <option value="researcher" className="bg-background text-white">Researcher</option>
              <option value="analyst" className="bg-background text-white">Analyst</option>
            </select>
            {error && (
              <div className="text-sm text-red-400 text-left">{error}</div>
            )}
          </div>
          <hr className="border-white/10" />
          <div>
            <button
              onClick={handleSignUp}
              className="w-full bg-primary text-primary-foreground font-medium px-5 py-3 rounded-full shadow-lg hover:brightness-110 transition mb-3 text-sm"
            >
              Initialize Protocol
            </button>
            {/* Google Sign Up */}
            <button className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 rounded-full px-5 py-3 font-medium text-white shadow transition mb-2 text-sm border border-white/10">
              <Chrome className="w-5 h-5" />
              Continue with Google
            </button>
            <div className="w-full text-center mt-3">
              <span className="text-xs text-muted-foreground">
                Already an operative?{" "}
                <a
                  href="/login"
                  className="underline text-white/80 hover:text-white transition-colors"
                >
                  Establish connection
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* User count and avatars */}
      <div className="relative z-10 mt-12 flex flex-col items-center text-center">
        <p className="text-muted-foreground text-sm mb-3">
          Join <span className="font-medium text-white">thousands</span> of
          operatives monitoring the cosmos.
        </p>
        <div className="flex -space-x-2">
          <Image
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces"
            alt="user"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full border-2 border-background object-cover"
          />
          <Image
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces"
            alt="user"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full border-2 border-background object-cover"
          />
          <Image
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces"
            alt="user"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full border-2 border-background object-cover"
          />
          <Image
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
            alt="user"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full border-2 border-background object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export { SignIn1, SignUp1 };
