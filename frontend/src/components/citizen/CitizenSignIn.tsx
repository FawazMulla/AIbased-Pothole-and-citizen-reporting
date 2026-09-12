import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  UserCheck,
  Phone,
  Mail,
  Zap,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Layers,
  Camera,
  Search,
} from "lucide-react";

export interface CitizenUser {
  name: string;
  email: string;
  phone: string;
}

interface CitizenSignInProps {
  currentUser: CitizenUser | null;
  onSignInSuccess: (user: CitizenUser) => void;
  onSignOut: () => void;
  onNavigateToReport: () => void;
  onNavigateToTrack: () => void;
}

const MOCK_CITIZENS: CitizenUser[] = [
  {
    name: "Aarav Deshmukh",
    email: "aarav.deshmukh@gmail.com",
    phone: "+91 98201 44521",
  },
  {
    name: "Neha Kulkarni",
    email: "neha.kulkarni@yahoo.co.in",
    phone: "+91 98192 33412",
  },
  {
    name: "Vikram Mehta",
    email: "vikram.mehta@outlook.com",
    phone: "+91 98334 55678",
  },
];

export const CitizenSignIn: React.FC<CitizenSignInProps> = ({
  currentUser,
  onSignInSuccess,
  onSignOut,
  onNavigateToReport,
  onNavigateToTrack,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleCustomSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const user: CitizenUser = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };
    onSignInSuccess(user);
  };

  const handleQuickSignIn = (user: CitizenUser) => {
    onSignInSuccess(user);
  };

  // IF ALREADY SIGNED IN
  if (currentUser) {
    return (
      <div className="max-w-md mx-auto py-4 sm:py-8 px-3 sm:px-4 animate-in fade-in duration-300">
        <Card className="shadow-lg border-primary/20 overflow-hidden">
          <CardHeader className="bg-muted/20 border-b text-center pb-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-xs">
              <UserCheck className="w-7 h-7" />
            </div>
            <Badge variant="outline" className="w-fit mx-auto text-[10px] text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30">
              Active Citizen Profile
            </Badge>
            <CardTitle className="text-xl font-bold text-foreground mt-1">
              {currentUser.name}
            </CardTitle>
            <CardDescription className="text-xs">
              Signed in to CivicPothole AI Citizen Portal
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
            <div className="p-3 bg-muted/40 rounded-lg border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phone Number:</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  {currentUser.phone || "Not provided"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email Address:</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3 text-blue-600" />
                  {currentUser.email || "Not provided"}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Button onClick={onNavigateToTrack} className="w-full gap-2 text-xs h-10">
                <Search className="w-4 h-4" />
                View My Reported Complaints
              </Button>
              <Button onClick={onNavigateToReport} variant="outline" className="w-full gap-2 text-xs h-10">
                <Camera className="w-4 h-4" />
                Report New Pothole Defect
              </Button>
            </div>
          </CardContent>

          <CardFooter className="border-t bg-muted/20 py-3 px-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Citizen Session
            </span>
            <button
              type="button"
              onClick={onSignOut}
              className="text-rose-600 hover:text-rose-700 font-medium underline"
            >
              Sign Out
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // SIGN IN VIEW
  return (
    <div className="max-w-md mx-auto py-4 sm:py-8 px-3 sm:px-4 animate-in fade-in duration-300">
      <Card className="shadow-lg border-primary/20 overflow-hidden">
        <CardHeader className="text-center pb-3 sm:pb-4 bg-muted/20 border-b">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-xs">
            <UserCheck className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
            Citizen Profile Sign In
          </CardTitle>
          <CardDescription className="text-xs max-w-xs mx-auto">
            Sign in to track your road defect submissions, receive municipal updates, and view status history.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Quick 1-Click Mock Accounts */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-primary" />
              1-Click Demo Citizen Profiles
            </span>

            <div className="space-y-2">
              {MOCK_CITIZENS.map((c) => (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => handleQuickSignIn(c)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/80 hover:border-primary/40 transition-all text-left text-xs group"
                >
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-primary" />
                      {c.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{c.phone}</span>
                      <span>&bull;</span>
                      <span className="truncate">{c.email}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                    Sign In
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-medium text-[10px]">
                Or enter custom details
              </span>
            </div>
          </div>

          {/* Custom Sign In Form */}
          <form onSubmit={handleCustomSignIn} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="sign-name" className="text-xs font-medium">
                Full Name
              </Label>
              <Input
                id="sign-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Deshmukh"
                required
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="sign-phone" className="text-xs font-medium">
                Phone Number (SMS Notifications)
              </Label>
              <Input
                id="sign-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98200 98765"
                required
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="sign-email" className="text-xs font-medium">
                Email Address
              </Label>
              <Input
                id="sign-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ramesh@gmail.com"
                required
                className="text-xs h-9"
              />
            </div>

            <Button type="submit" className="w-full gap-2 text-xs h-10 mt-2">
              <UserCheck className="w-4 h-4" />
              Save Profile & Enter Portal
            </Button>
          </form>
        </CardContent>

        <CardFooter className="border-t bg-muted/20 py-3 px-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Local Encrypted Storage
          </span>
          <button
            type="button"
            onClick={onNavigateToReport}
            className="hover:text-foreground underline"
          >
            Skip to Report
          </button>
        </CardFooter>
      </Card>
    </div>
  );
};
