import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export function useRequireAuth(requiredRole?: string) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (user && requiredRole && user.role !== requiredRole) {
      setLocation("/unauthorized");
    }
  }, [user, isLoading, requiredRole, setLocation]);

  return { user, isLoading };
}

export function LoginForm() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      await login(username, password);
      setLocation("/");
    } catch (err) {
      setError("Invalid username or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md p-6 bg-card rounded-lg border border-border shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary">EduSchedule Pro</h1>
          <p className="text-sm text-muted-foreground mt-1">NEP 2020 Timetable System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              className="w-full p-3 border border-input rounded-md bg-background text-foreground"
              data-testid="input-username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full p-3 border border-input rounded-md bg-background text-foreground"
              data-testid="input-password"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground p-3 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50"
            data-testid="button-login"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
