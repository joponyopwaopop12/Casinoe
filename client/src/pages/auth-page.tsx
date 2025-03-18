import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dice, Bomb, Layers, ChevronsRight } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
});

const loginSchema = z.object({
  username: z.string().min(1, {
    message: "Username is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Handle login form submission
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };

  // Handle register form submission
  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(values);
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Hero Section */}
      <div className="hidden lg:flex flex-col w-1/2 bg-slate-900 p-10 justify-center items-center">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold mb-6">CryptoCasino</h1>
          <p className="text-xl text-slate-300 mb-10">
            Experience the thrill of casino gaming with our state-of-the-art platform featuring Dice, Mines, and Blackjack games.
          </p>

          <div className="grid grid-cols-3 gap-6 mb-10">
            <div className="flex flex-col items-center p-4 bg-slate-800 rounded-lg">
              <Dice className="h-10 w-10 text-cyan-500 mb-3" />
              <h3 className="font-medium">Dice</h3>
            </div>
            <div className="flex flex-col items-center p-4 bg-slate-800 rounded-lg">
              <Bomb className="h-10 w-10 text-purple-500 mb-3" />
              <h3 className="font-medium">Mines</h3>
            </div>
            <div className="flex flex-col items-center p-4 bg-slate-800 rounded-lg">
              <Layers className="h-10 w-10 text-yellow-500 mb-3" />
              <h3 className="font-medium">Blackjack</h3>
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg">
            <p className="font-medium text-green-400 mb-2">$10,000 Bonus</p>
            <p className="text-slate-300 text-sm">
              Create a new account today and receive $10,000 in play money to start your casino journey!
            </p>
          </div>
        </div>
      </div>

      {/* Auth Forms */}
      <div className="flex flex-col justify-center items-center p-4 w-full lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:hidden">
            <h1 className="text-3xl font-bold mb-2">CryptoCasino</h1>
            <p className="text-slate-300">Your premier casino gaming destination</p>
          </div>

          <Card>
            <CardHeader>
              <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <CardTitle className="text-2xl">Welcome Back</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </TabsContent>
                <TabsContent value="register">
                  <CardTitle className="text-2xl">Create Account</CardTitle>
                  <CardDescription>
                    Sign up for a new account and get $10,000 in play money
                  </CardDescription>
                </TabsContent>
              </Tabs>
            </CardHeader>
            <CardContent>
              <TabsContent value="login" className="mt-0">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Register & Get $10,000"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Display for mobile users about the bonus */}
              <div className="mt-6 p-3 bg-slate-800 rounded-lg lg:hidden">
                <p className="text-sm text-center text-slate-300">
                  <span className="text-green-400 font-medium">$10,000 Bonus: </span>
                  Create a new account today and receive $10,000 in play money!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
