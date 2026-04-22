import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGym } from "@/contexts/GymContext";
import { Preferences } from "@capacitor/preferences";

const OWNER_SESSION_KEY = "gf_owner_unlocked";

const LoginPage = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [foundUser, setFoundUser] = useState<{ name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, isGymSetup, currentUser, isLoading } = useGym();
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState<"user" | "owner">("user");

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!isLoading && currentUser) {
      navigate(currentUser.role === "trainer" ? "/trainer" : "/member");
    }
  }, [currentUser, isLoading, navigate]);

  useEffect(() => {
    const redirectOwnerSession = async () => {
      if (isLoading || currentUser || !isGymSetup) return;

      const { value } = await Preferences.get({ key: OWNER_SESSION_KEY });
      if (value === "true") {
        navigate("/owner");
      }
    };

    redirectOwnerSession();
  }, [currentUser, isGymSetup, isLoading, navigate]);

  const handleCodeChange = useCallback((value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setCode(cleaned);
    setError("");
    setSuccess(false);
    setFoundUser(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError("");

    try {
      const user = await login(code);
      if (user) {
        setSuccess(true);
        setFoundUser({ name: user.name, role: user.role });
        setTimeout(() => {
          navigate(user.role === "trainer" ? "/trainer" : "/member");
        }, 800);
      } else {
        setError("Access code not found. Please check and try again.");
        setLoading(false);
      }
    } catch (err) {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  }, [code, login, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="aesthetic-bg" />
        <div className="relative z-10">
          <span className="inline-block w-8 h-8 border-4 border-sage/30 border-t-sage rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      <div className="aesthetic-bg" />

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-sage-light opacity-60 blur-3xl" />
      <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-terracotta-light opacity-50 blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-6 animate-fade-up">
        {/* Brand */}
        <div className="text-center mb-12">
          <img src="logo.png" alt="GymFlow Logo" className="h-40 w-auto mx-auto mb-4" />
          <p className="mt-2 text-sm text-muted-foreground tracking-widest uppercase font-body">
            Member & Trainer Access
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-lg shadow-sage/5 p-8 relative overflow-hidden transition-all duration-500">
          {/* Top accent */}
          <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-sage to-transparent" />

          {/* Login Type Toggle */}
          <div className="flex p-1 bg-background border border-border rounded-xl mb-8">
            <button
              onClick={() => setLoginType("user")}
              className={`flex-1 py-2 text-xs font-body font-semibold uppercase tracking-wider rounded-lg transition-all ${
                loginType === "user" ? "bg-sage text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Member Access
            </button>
            <button
              onClick={() => setLoginType("owner")}
              className={`flex-1 py-2 text-xs font-body font-semibold uppercase tracking-wider rounded-lg transition-all ${
                loginType === "owner" ? "bg-sage text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Gym Owner
            </button>
          </div>

          {loginType === "user" ? (
            <div className="animate-in fade-in duration-500">
              <h2 className="font-display text-xl font-semibold text-foreground mb-1">
                Access Code
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Enter your unique 6-character code provided by your gym owner.
              </p>

              {/* Code Input */}
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 font-body">
                  Enter Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className={`w-full bg-background border-2 text-foreground font-display text-2xl font-bold tracking-[0.5em] text-center py-5 px-4 rounded-xl outline-none transition-all duration-300 ${
                    error ? "border-destructive animate-shake" :
                    success ? "border-success" :
                    code.length === 6 ? "border-sage" :
                    "border-border focus:border-sage"
                  }`}
                  placeholder="_ _ _ _ _ _"
                  maxLength={6}
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className={`text-center text-xs mt-3 transition-colors duration-200 ${
                  error ? "text-destructive" :
                  success ? "text-success" :
                  "text-muted-foreground"
                }`}>
                  {error || (success ? "✓ Access code verified" : `${6 - code.length} more character${6 - code.length !== 1 ? "s" : ""} needed`)}
                </p>
              </div>

              {/* Found User Preview */}
              {foundUser && (
                <div className="flex items-center gap-4 p-4 bg-sage-light rounded-xl mb-6 animate-fade-up">
                  <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center text-primary-foreground font-display text-lg font-bold">
                    {foundUser.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-body font-semibold text-foreground">{foundUser.name}</p>
                    <p className="text-xs uppercase tracking-widest text-sage">{foundUser.role}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={code.length !== 6 || loading}
                className="w-full bg-sage text-primary-foreground font-body font-semibold text-sm uppercase tracking-[0.2em] py-4 rounded-xl transition-all duration-200 hover:opacity-90 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : "Enter Dashboard"}
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-sage-light flex items-center justify-center">
                  <svg className="w-8 h-8 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground mb-1">
                Owner Portal
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Manage your gym, members, and trainers from your private dashboard.
              </p>

              <button
                onClick={() => navigate("/owner")}
                className="w-full bg-foreground text-background font-body font-semibold text-sm uppercase tracking-[0.2em] py-4 rounded-xl transition-all duration-200 hover:opacity-90 hover:shadow-lg mb-4"
              >
                {isGymSetup ? "Login to Dashboard" : "Setup My Gym"}
              </button>
              
              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest">
                {isGymSetup ? "Connected to your existing gym" : "No gym found on this device"}
              </p>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <div className="flex justify-center gap-6 mt-8">
          {loginType === "user" && (
            <button
              onClick={() => setLoginType("owner")}
              className="text-xs uppercase tracking-widest text-muted-foreground hover:text-sage transition-colors font-body"
            >
              Gym Owner? Click here
            </button>
          )}
          <button
            onClick={async () => {
              localStorage.clear();
              await Preferences.clear();
              window.location.reload();
            }}
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-terracotta transition-colors font-body"
          >
            Reset All
          </button>
        </div>

        {/* System Status */}
        <div className="flex items-center justify-center gap-2 mt-10">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-soft" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-body">
            System Online
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
