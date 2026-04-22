import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGym } from "@/contexts/GymContext";
import { useToast } from "@/hooks/use-toast";
import { Preferences } from "@capacitor/preferences";
import QRCode from "qrcode";
import { format } from "date-fns";
import GymScanner from "@/components/GymScanner";
import { Scan, ClipboardList, QrCode as QrIcon, Wallet, CheckCircle2, AlertCircle, Clock, Bell, IndianRupee } from "lucide-react";

const OWNER_SESSION_KEY = "gf_owner_unlocked";
const MEMBERSHIP_PLANS = ["Monthly", "Quarterly", "Yearly"] as const;

const OwnerDashboard = () => {
  const { gymName, gymId, gymUpiId, isGymSetup, setupGym, addUser, members, trainers, attendanceRecords, ownerPasskey, isLoading, getGymAttendanceQrValue, markAttendanceFromQr, sendFeeReminder, sendCustomNotification, updateGymUpiId } = useGym();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gymQrCodeUrl, setGymQrCodeUrl] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "attendance" | "fees">("users");

  // Setup form state
  const [setupName, setSetupName] = useState("");
  const [setupOwner, setSetupOwner] = useState("");
  const [setupLocation, setSetupLocation] = useState("");
  const [setupPasskey, setSetupPasskey] = useState("");
  const [view, setView] = useState<"setup" | "login">("setup");
  const [isLocked, setIsLocked] = useState(true);
  const [unlockPasskey, setUnlockPasskey] = useState("");
  const [restoreId, setRestoreId] = useState("");
  const [restorePasskey, setRestorePasskey] = useState("");

  // Add user modal state
  const [showModal, setShowModal] = useState(false);
  const [modalRole, setModalRole] = useState<"member" | "trainer">("member");
  const [newUserName, setNewUserName] = useState("");
  const [membershipPlan, setMembershipPlan] = useState<(typeof MEMBERSHIP_PLANS)[number]>("Monthly");
  const [generatedCode, setGeneratedCode] = useState("");
  const [savedUserName, setSavedUserName] = useState("");
  const [savedUserRole, setSavedUserRole] = useState<"member" | "trainer">("member");
  const [savedMembershipPlan, setSavedMembershipPlan] = useState<(typeof MEMBERSHIP_PLANS)[number]>("Monthly");
  
  // Payment modal state
  const { recordPayment } = useGym();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMemberName, setSelectedMemberName] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMonths, setPaymentMonths] = useState(1);

  // Notification sending state (memberId -> boolean)
  const [sendingNotif, setSendingNotif] = useState<Record<string, boolean>>({});

  // UPI ID state
  const [upiIdInput, setUpiIdInput] = useState("");
  const [isSavingUpi, setIsSavingUpi] = useState(false);

  // Broadcast state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const activeCount = [...members, ...trainers].filter(u => u.status === "active").length;
  const pendingCount = [...members, ...trainers].filter(u => u.status === "pending").length;

  useEffect(() => {
    const loadOwnerSession = async () => {
      if (!isGymSetup) {
        setIsLocked(true);
        return;
      }

      const { value } = await Preferences.get({ key: OWNER_SESSION_KEY });
      setIsLocked(value !== "true");
    };

    loadOwnerSession();
  }, [isGymSetup]);

  // Sync local UPI input from context
  useEffect(() => {
    setUpiIdInput(gymUpiId);
  }, [gymUpiId]);

  useEffect(() => {
    if (isGymSetup) {
      QRCode.toDataURL(getGymAttendanceQrValue(), {
        width: 250,
        margin: 1,
        color: {
          dark: "#15803d", // Sage color
          light: "#f0fdf4", // Sage light
        },
      }).then(setGymQrCodeUrl).catch(console.error);
    }
  }, [isGymSetup, getGymAttendanceQrValue]);

  const buildWhatsAppMessage = (name: string, code: string, role: "member" | "trainer", plan?: string) => {
    const roleLabel = role === "member" ? "member" : "trainer";
    const planLine = role === "member" && plan ? `Plan: ${plan}\n` : "";
    return `Hi ${name}, your ${gymName} ${roleLabel} access code is ${code}.\n${planLine}Use this code to log in to GymFlow.`;
  };

  const shareViaWhatsApp = (name: string, code: string, role: "member" | "trainer", plan?: string) => {
    const message = buildWhatsAppMessage(name, code, role, plan);
    const encodedMessage = encodeURIComponent(message);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `whatsapp://send?text=${encodedMessage}`;
      return;
    }

    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank", "noopener,noreferrer");
  };

  const handleSetup = async () => {
    if (!setupName.trim() || !setupOwner.trim() || !setupPasskey.trim()) {
      toast({ title: "Missing fields", description: "Gym name, owner name, and a passkey are required.", variant: "destructive" });
      return;
    }
    try {
      await setupGym(setupName, setupOwner, setupLocation, setupPasskey);
      await Preferences.set({ key: OWNER_SESSION_KEY, value: "true" });
      setIsLocked(false);
      toast({ title: "Gym created!", description: `"${setupName}" is ready. Keep your passkey safe.` });
    } catch (error) {
      toast({ title: "Setup failed", description: "Could not initialize gym backend.", variant: "destructive" });
    }
  };

  const handleAddUser = async () => {
    if (!newUserName.trim()) {
      toast({ title: "Name required", description: "Please enter a name.", variant: "destructive" });
      return;
    }

    try {
      const code = await addUser({
        name: newUserName,
        role: modalRole,
        membershipPlan: modalRole === "member" ? membershipPlan : undefined,
      });
      setGeneratedCode(code);
      setSavedUserName(newUserName.trim());
      setSavedUserRole(modalRole);
      setSavedMembershipPlan(membershipPlan);
      toast({ title: "User added!", description: `${newUserName} — Code: ${code}` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add user to database.", variant: "destructive" });
    }
  };

  const openAddModal = (role: "member" | "trainer") => {
    setModalRole(role);
    setNewUserName("");
    setMembershipPlan("Monthly");
    setGeneratedCode("");
    setSavedUserName("");
    setSavedUserRole(role);
    setSavedMembershipPlan("Monthly");
    setShowModal(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedMemberId || !paymentAmount || isNaN(Number(paymentAmount))) {
      toast({ title: "Invalid data", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }

    try {
      await recordPayment(selectedMemberId, Number(paymentAmount), paymentMonths);
      setShowPaymentModal(false);
      setPaymentAmount("");
      setPaymentMonths(1);
      toast({ title: "Payment Recorded", description: `Successfully updated ${selectedMemberName}'s fee status.` });
    } catch (error) {
      toast({ title: "Error", description: "Could not record payment.", variant: "destructive" });
    }
  };

  const getFeeStatus = (feePaidUntil?: string) => {
    if (!feePaidUntil) return { label: "No Record", color: "text-muted-foreground", icon: AlertCircle };
    const date = new Date(feePaidUntil);
    const now = new Date();
    
    // Within 7 days of expiry
    const warningThreshold = new Date();
    warningThreshold.setDate(now.getDate() + 7);

    if (date < now) return { label: "Overdue", color: "text-destructive", icon: AlertCircle };
    if (date < warningThreshold) return { label: "Expiring Soon", color: "text-warning", icon: Clock };
    return { label: "Paid", color: "text-success", icon: CheckCircle2 };
  };

  const handleSaveUpiId = async () => {
    if (!upiIdInput.trim()) {
      toast({ title: "UPI ID Required", description: "Please enter a valid UPI ID.", variant: "destructive" });
      return;
    }
    setIsSavingUpi(true);
    try {
      await updateGymUpiId(upiIdInput.trim());
      toast({ title: "UPI ID Saved", description: "Members can now tap to pay their fees via UPI." });
    } catch {
      toast({ title: "Save Failed", description: "Could not update UPI ID.", variant: "destructive" });
    } finally {
      setIsSavingUpi(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast({ title: "Incomplete fields", description: "Please enter both a title and message.", variant: "destructive" });
      return;
    }

    setIsBroadcasting(true);
    try {
      await sendCustomNotification(broadcastTitle.trim(), broadcastMessage.trim());
      toast({ title: "Broadcast Sent", description: "Your message has been sent to all members." });
      setShowBroadcastModal(false);
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (error: any) {
      toast({ title: "Broadcast Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleSendFeeReminder = async (memberId: string, memberName: string) => {
    setSendingNotif(prev => ({ ...prev, [memberId]: true }));
    try {
      await sendFeeReminder(memberId);
      toast({ title: "Notification Sent", description: `Fee reminder sent to ${memberName}.` });
    } catch (error: any) {
      toast({ title: "Failed to Send", description: error.message || "Could not send notification.", variant: "destructive" });
    } finally {
      setSendingNotif(prev => ({ ...prev, [memberId]: false }));
    }
  };

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

  // Setup or Private Lock overlay
  if (!isGymSetup || isLocked) {
    const handleUnlock = () => {
      if (unlockPasskey === ownerPasskey) {
        setIsLocked(false);
        Preferences.set({ key: OWNER_SESSION_KEY, value: "true" });
        toast({ title: "Unlocked", description: "Welcome back, owner." });
      } else {
        toast({ title: "Incorrect Passkey", description: "Access denied.", variant: "destructive" });
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative px-4">
        <div className="aesthetic-bg" />
        <div className="relative z-10 w-full max-w-lg animate-fade-up">
          <div className="bg-card rounded-2xl border border-border shadow-lg p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-sage to-transparent" />
            
            {isGymSetup && isLocked ? (
              <div className="animate-in fade-in duration-500 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-sage font-body mb-1">Privacy Lock</p>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">Owner Login</h1>
                <p className="text-sm text-muted-foreground mb-8 font-body">Enter your private passkey to unlock the dashboard.</p>

                <div className="space-y-6">
                  <div>
                    <input 
                      type="password" 
                      value={unlockPasskey} 
                      onChange={e => setUnlockPasskey(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                      placeholder="Enter Passkey"
                      className="w-full bg-background border border-border rounded-lg px-4 py-8 text-foreground font-display text-2xl tracking-[0.5em] outline-none focus:border-sage transition-colors text-center" 
                    />
                  </div>
                  
                  <button 
                    onClick={handleUnlock}
                    className="w-full bg-sage text-primary-foreground font-body font-semibold text-sm uppercase tracking-[0.15em] py-4 rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Unlock Dashboard →
                  </button>
                  
                  <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-foreground font-body uppercase tracking-widest mt-4">
                    ← Back to Login
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                <div className="flex justify-center mb-8">
                  <div className="flex p-1 bg-background border border-border rounded-xl">
                    <button
                      onClick={() => setView("setup")}
                      className={`px-6 py-2 text-xs font-body font-semibold uppercase tracking-wider rounded-lg transition-all ${
                        view === "setup" ? "bg-sage text-primary-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      New Gym
                    </button>
                    <button
                      onClick={() => setView("login")}
                      className={`px-6 py-2 text-xs font-body font-semibold uppercase tracking-wider rounded-lg transition-all ${
                        view === "login" ? "bg-sage text-primary-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Returning Owner
                    </button>
                  </div>
                </div>

                {view === "setup" ? (
                  <div className="animate-in slide-in-from-left duration-300">
                    <p className="text-xs uppercase tracking-[0.2em] text-sage font-body mb-1">Getting Started</p>
                    <h1 className="font-display text-3xl font-bold text-foreground mb-6">Setup Your Gym</h1>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 font-body">Gym Name</label>
                        <input type="text" value={setupName} onChange={e => setSetupName(e.target.value)} placeholder="e.g. Iron Temple Fitness"
                          className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm outline-none focus:border-sage transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 font-body">Owner Name</label>
                        <input type="text" value={setupOwner} onChange={e => setSetupOwner(e.target.value)} placeholder="Your full name"
                          className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm outline-none focus:border-sage transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 font-body">Location</label>
                        <input type="text" value={setupLocation} onChange={e => setSetupLocation(e.target.value)} placeholder="City, Country"
                          className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm outline-none focus:border-sage transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 font-body">Create Passkey</label>
                        <input type="password" value={setupPasskey} onChange={e => setSetupPasskey(e.target.value)} placeholder="Your private passkey"
                          className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm outline-none focus:border-sage transition-colors" />
                      </div>
                      <button onClick={handleSetup} className="w-full bg-sage text-primary-foreground font-body font-semibold text-sm uppercase tracking-[0.15em] py-4 rounded-xl hover:opacity-90 transition-opacity mt-2">
                        Initialize Gym →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in slide-in-from-right duration-300">
                    <p className="text-xs uppercase tracking-[0.2em] text-sage font-body mb-1">Owner Access</p>
                    <h1 className="font-display text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
                    <p className="text-sm text-muted-foreground mb-8 font-body">Enter your credentials to restore access.</p>

                    <form className="space-y-5" onSubmit={async (e) => {
                      e.preventDefault();
                      if (restoreId.trim().length > 0 && restorePasskey.trim().length > 0) {
                        await Preferences.set({ key: "gf_gym_id_owner", value: restoreId.trim() });
                        await Preferences.set({ key: "gf_owner_passkey", value: restorePasskey.trim() });
                        await Preferences.set({ key: "gf_gym_name", value: "Recovered Gym" });
                        await Preferences.set({ key: OWNER_SESSION_KEY, value: "true" });
                        window.location.reload();
                      } else {
                        toast({ title: "Incomplete", description: "Ensure both fields are filled correctly.", variant: "destructive" });
                      }
                    }}>
                      <div>
                        <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 font-body">Gym ID</label>
                        <input type="text" value={restoreId} onChange={e => setRestoreId(e.target.value)} placeholder="gym_xxxxxxxx"
                          className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm outline-none focus:border-sage transition-colors text-center" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 font-body">Owner Passkey</label>
                        <input type="password" value={restorePasskey} onChange={e => setRestorePasskey(e.target.value)} placeholder="••••••••"
                          className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm outline-none focus:border-sage transition-colors text-center" />
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-foreground text-background font-body font-semibold text-sm uppercase tracking-[0.15em] py-4 rounded-xl hover:opacity-90 transition-opacity"
                      >
                        Verify & Restore →
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="aesthetic-bg" />

      {/* Header */}
      <header className="relative z-10 border-b border-border bg-card/90 backdrop-blur-sm sticky top-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <img src="logo.png" alt="GymFlow Logo" className="h-8 w-auto" />
            <span className="text-[10px] md:text-xs text-muted-foreground font-body">/ Owner</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden sm:inline text-xs text-muted-foreground font-body">
              Tenant: <strong className="text-sage">{gymName}</strong>
            </span>
            <button onClick={() => navigate("/")} className="hidden sm:inline-block text-[10px] md:text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 md:px-4 md:py-2 hover:border-sage hover:text-sage transition-colors font-body">
              Login Page
            </button>
            <button onClick={async () => {
              await Preferences.remove({ key: OWNER_SESSION_KEY });
              setIsLocked(true);
              navigate("/");
            }} className="text-[10px] md:text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 md:px-4 md:py-2 hover:border-sage hover:text-sage transition-colors font-body">
              Sign Out
            </button>
            <button onClick={async () => {
              await Preferences.remove({ key: "gf_gym_id_owner" });
              await Preferences.remove({ key: "gf_gym_name" });
              await Preferences.remove({ key: "gf_owner_passkey" });
              await Preferences.remove({ key: OWNER_SESSION_KEY });
              window.location.reload();
            }} className="text-[10px] md:text-xs text-destructive/60 border border-destructive/20 rounded-lg px-3 py-1.5 md:px-4 md:py-2 hover:border-destructive hover:text-destructive transition-colors font-body">
              Reset
            </button>
          </div>
        </div>
      </header>
      {/* Main */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-muted-foreground font-body mb-1">Owner Dashboard</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6 md:mb-8">
          {gymName}<span className="text-sage">.</span>
        </h2>

        <div className="flex flex-wrap gap-2 md:gap-4 mb-6 md:mb-8">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 sm:flex-none items-center justify-center gap-1.5 md:gap-2 px-3 py-2 md:px-6 md:py-3 rounded-xl font-body font-bold text-[9px] md:text-xs uppercase tracking-widest transition-all ${
              activeTab === "users" ? "bg-sage text-white shadow-lg shadow-sage/20" : "bg-card border border-border text-muted-foreground"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex-1 sm:flex-none items-center justify-center gap-1.5 md:gap-2 px-3 py-2 md:px-6 md:py-3 rounded-xl font-body font-bold text-[9px] md:text-xs uppercase tracking-widest transition-all ${
              activeTab === "attendance" ? "bg-sage text-white shadow-lg shadow-sage/20" : "bg-card border border-border text-muted-foreground"
            }`}
          >
            <ClipboardList className="hidden sm:block w-3.5 h-3.5 md:w-4 md:h-4" />
            Attendance
          </button>
          <button
            onClick={() => setActiveTab("fees")}
            className={`flex-1 sm:flex-none items-center justify-center gap-1.5 md:gap-2 px-3 py-2 md:px-6 md:py-3 rounded-xl font-body font-bold text-[9px] md:text-xs uppercase tracking-widest transition-all ${
              activeTab === "fees" ? "bg-sage text-white shadow-lg shadow-sage/20" : "bg-card border border-border text-muted-foreground"
            }`}
          >
            <Wallet className="hidden sm:block w-3.5 h-3.5 md:w-4 md:h-4" />
            Fees
          </button>
          
          <div className="hidden md:block flex-1" />
          
          <button
            onClick={() => setShowScanner(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-3 rounded-xl bg-foreground text-background font-body font-bold text-[10px] md:text-xs uppercase tracking-widest hover:opacity-90 transition-all mt-2 sm:mt-0"
          >
            <Scan className="w-4 h-4" />
            Scan Member
          </button>
        </div>

        <GymScanner
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={async (value) => {
            try {
              const record = await markAttendanceFromQr(value);
              setShowScanner(false);
              toast({
                title: "Marked Present",
                description: `Successfully recorded attendance for ${record.member_name}.`,
              });
            } catch (error: any) {
              toast({
                title: "Scan Error",
                description: error.message || "Invalid member QR code.",
                variant: "destructive",
              });
            }
          }}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8 animate-fade-up">
          {[
            { label: "Total Members", value: members.length, color: "text-sage" },
            { label: "Trainers", value: trainers.length, color: "text-terracotta" },
            { label: "Active", value: activeCount, color: "text-success" },
            { label: "Pending", value: pendingCount, color: "text-warning" },
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-4 md:p-6 hover:border-sage/30 transition-colors group">
              <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-body mb-2 md:mb-3 truncate">{stat.label}</p>
              <p className={`font-display text-2xl md:text-3xl lg:text-4xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {activeTab === "users" ? (
          <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-6 animate-fade-up-delay-1">
            <div className="space-y-6">
              {/* Members Panel */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-sm font-semibold text-foreground">Members</h3>
                    <span className="text-xs text-muted-foreground bg-background border border-border rounded-md px-2 py-0.5 font-body">{members.length}</span>
                  </div>
                  <button onClick={() => openAddModal("member")} className="text-xs text-sage border border-sage/30 bg-sage-light rounded-lg px-3 py-1.5 hover:bg-sage hover:text-primary-foreground transition-all font-body">
                    + Add Member
                  </button>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  {members.length === 0 ? (
                    <p className="text-center py-10 text-muted-foreground text-sm font-body">No members yet</p>
                  ) : members.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 hover:bg-sage-light/30 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-sage-light flex items-center justify-center text-sage font-display text-sm font-bold flex-shrink-0">
                        {m.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-body font-medium text-foreground truncate">{m.name}</p>
                          {m.role === "member" && (
                            <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-tighter ${getFeeStatus(m.feePaidUntil).color.replace('text-', 'border-').replace('destructive', 'destructive/30').replace('warning', 'warning/30').replace('success', 'success/30')}`}>
                              {getFeeStatus(m.feePaidUntil).label}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-body">
                          Code: <span className="text-terracotta font-medium">{m.access_code}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => shareViaWhatsApp(m.name, m.access_code, "member", m.membershipPlan)}
                        className="text-[10px] uppercase tracking-widest text-sage border border-sage/30 rounded-lg px-2.5 py-2 hover:bg-sage hover:text-primary-foreground transition-all font-body"
                      >
                        WhatsApp
                      </button>
                      <button
                        onClick={() => handleSendFeeReminder(m.id, m.name)}
                        disabled={sendingNotif[m.id]}
                        title="Send fee due push notification"
                        className={`flex items-center gap-1 text-[10px] uppercase tracking-widest rounded-lg px-2.5 py-2 transition-all font-body border ${
                          getFeeStatus(m.feePaidUntil).label === "Paid"
                            ? "text-muted-foreground border-border hover:border-sage hover:text-sage"
                            : "text-destructive/80 border-destructive/30 bg-destructive/5 hover:bg-destructive hover:text-white"
                        } disabled:opacity-50 disabled:cursor-wait`}
                      >
                        <Bell className="w-3 h-3" />
                        {sendingNotif[m.id] ? "…" : "Notify"}
                      </button>
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md border font-body ${
                        m.status === "active" ? "text-success border-success/30 bg-success/5" : "text-warning border-warning/30 bg-warning/5"
                      }`}>{m.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trainers Panel */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-sm font-semibold text-foreground">Trainers</h3>
                    <span className="text-xs text-muted-foreground bg-background border border-border rounded-md px-2 py-0.5 font-body">{trainers.length}</span>
                  </div>
                  <button onClick={() => openAddModal("trainer")} className="text-xs text-sage border border-sage/30 bg-sage-light rounded-lg px-3 py-1.5 hover:bg-sage hover:text-primary-foreground transition-all font-body">
                    + Add Trainer
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {trainers.length === 0 ? (
                    <p className="text-center py-10 text-muted-foreground text-sm font-body">No trainers yet</p>
                  ) : trainers.map(t => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 hover:bg-terracotta-light/30 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-terracotta-light flex items-center justify-center text-terracotta font-display text-sm font-bold flex-shrink-0">
                        {t.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body font-medium text-foreground truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground font-body">
                          Code: <span className="text-terracotta font-medium">{t.access_code}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => shareViaWhatsApp(t.name, t.access_code, "trainer")}
                        className="text-[10px] uppercase tracking-widest text-sage border border-sage/30 rounded-lg px-2.5 py-2 hover:bg-sage hover:text-primary-foreground transition-all font-body"
                      >
                        WhatsApp
                      </button>
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md border font-body ${
                        t.status === "active" ? "text-success border-success/30 bg-success/5" : "text-warning border-warning/30 bg-warning/5"
                      }`}>{t.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Gym QR Panel */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <QrIcon className="w-5 h-5 text-sage" />
                  <h3 className="font-display text-lg font-semibold text-foreground">Gym Check-in QR</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-6 font-body">
                  Members can scan this code themselves using their GymFlow app to record attendance.
                </p>
                
                <div className="bg-white border-2 border-sage/10 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center shadow-inner max-w-[240px] mx-auto">
                  {gymQrCodeUrl ? (
                    <>
                      <img src={gymQrCodeUrl} alt="Gym QR" className="w-full mb-3 md:mb-4" />
                      <p className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase text-sage">Scan to Check-in</p>
                    </>
                  ) : (
                    <span className="w-8 h-8 border-4 border-sage/30 border-t-sage rounded-full animate-spin" />
                  )}
                </div>
                
                <div className="mt-6 p-4 rounded-xl bg-sage-light/50 border border-sage/10">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-body">Gym ID</p>
                  <code className="text-xs font-mono text-sage font-bold break-all">{gymId}</code>
                </div>
              </div>

              {/* UPI Payment Settings */}
              <div className="bg-card rounded-xl border border-border p-6 mt-6">
                <div className="flex items-center gap-2 mb-1">
                  <IndianRupee className="w-5 h-5 text-sage" />
                  <h3 className="font-display text-lg font-semibold text-foreground">UPI Payment</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4 font-body">
                  Members can tap a button in their dashboard to open their payment app and pay fees directly.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5 font-body">Your UPI ID</label>
                    <input
                      type="text"
                      value={upiIdInput}
                      onChange={e => setUpiIdInput(e.target.value)}
                      placeholder="yourname@upi"
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm outline-none focus:border-sage transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleSaveUpiId}
                    disabled={isSavingUpi}
                    className="w-full bg-sage text-white rounded-xl py-3 text-xs font-body font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {isSavingUpi ? "Saving…" : gymUpiId ? "Update UPI ID" : "Save UPI ID"}
                  </button>
                  {gymUpiId && (
                    <div className="flex items-center gap-2 p-3 bg-success/5 border border-success/20 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse flex-shrink-0" />
                      <p className="text-[10px] font-body text-success uppercase tracking-widest">
                        Active: <span className="font-bold">{gymUpiId}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Broadcast Announcement */}
              <div className="bg-card rounded-xl border border-border p-6 mt-6">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="w-5 h-5 text-terracotta" />
                  <h3 className="font-display text-lg font-semibold text-foreground">Broadcast</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4 font-body">
                  Send a custom push notification to all active gym members at once.
                </p>
                <button
                  onClick={() => setShowBroadcastModal(true)}
                  className="w-full bg-terracotta text-white rounded-xl py-3 text-xs font-body font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  Send Announcement
                </button>
              </div>

              {/* Notification Status */}
              <div className="bg-card rounded-xl border border-border p-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-sage" />
                  <h3 className="font-display text-lg font-semibold text-foreground">Notification Status</h3>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-foreground">FCM v1 Active</span>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        await sendFeeReminder("test_id");
                        toast({ title: "Test Sent", description: "Check your phone for a notification." });
                      } catch (e: any) {
                        toast({ title: "Test Failed", description: e.message, variant: "destructive" });
                      }
                    }}
                    className="text-[9px] uppercase tracking-widest text-sage hover:underline font-bold"
                  >
                    Test
                  </button>
                </div>
              </div>

              {/* Push Notifications Status */}

              {/* Quick Actions */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-body">Today's Scans</span>
                    <span className="font-display font-bold text-foreground">
                      {attendanceRecords.filter(r => r.date_key === format(new Date(), "yyyy-MM-dd")).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-body">Active Members</span>
                    <span className="font-display font-bold text-foreground">{members.filter(m => m.status === "active").length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "attendance" ? (
          <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-border">
              <h3 className="font-display text-lg md:text-xl font-bold text-foreground">Attendance Records</h3>
              <p className="text-xs md:text-sm text-muted-foreground font-body">Complete history of all gym check-ins.</p>
            </div>
            <div className="overflow-x-auto">
              {attendanceRecords.length === 0 ? (
                <div className="py-12 md:py-20 text-center">
                  <ClipboardList className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm md:text-base text-muted-foreground font-body">No attendance records found.</p>
                </div>
              ) : (
                <table className="w-full text-left font-body min-w-[500px]">
                  <thead className="bg-muted/50 text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 md:px-6 md:py-4 font-semibold">Member</th>
                      <th className="px-4 py-3 md:px-6 md:py-4 font-semibold">Access Code</th>
                      <th className="px-4 py-3 md:px-6 md:py-4 font-semibold">Time</th>
                      <th className="px-4 py-3 md:px-6 md:py-4 font-semibold">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attendanceRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 md:px-6 md:py-4">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-sage-light flex items-center justify-center text-sage font-display text-xs font-bold">
                              {record.member_name.charAt(0)}
                            </div>
                            <span className="text-xs md:text-sm font-medium text-foreground">{record.member_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4 text-[10px] md:text-xs font-mono text-terracotta">{record.member_access_code}</td>
                        <td className="px-4 py-3 md:px-6 md:py-4">
                          <p className="text-xs md:text-sm text-foreground whitespace-nowrap">{format(new Date(record.scanned_at), "PPP")}</p>
                          <p className="text-[9px] md:text-[10px] text-muted-foreground">{format(new Date(record.scanned_at), "p")}</p>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4">
                          <span className={`text-[8px] md:text-[10px] uppercase tracking-widest px-1.5 py-0.5 md:px-2 md:py-1 rounded-md whitespace-nowrap ${
                            record.scanned_by === "owner" ? "bg-blue-100 text-blue-700 font-bold" : "bg-green-100 text-green-700 font-bold"
                          }`}>
                            {record.scanned_by === "owner" ? "Owner Scan" : "Member Scan"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          /* Fees Tab Content */
          <div className="animate-fade-in space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border p-6 border-l-4 border-l-success">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-body mb-2">Paid Members</p>
                <p className="font-display text-3xl font-bold text-foreground">
                  {members.filter(m => getFeeStatus(m.feePaidUntil).label === "Paid").length}
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-6 border-l-4 border-l-warning">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-body mb-2">Expiring Soon</p>
                <p className="font-display text-3xl font-bold text-foreground">
                  {members.filter(m => getFeeStatus(m.feePaidUntil).label === "Expiring Soon").length}
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-6 border-l-4 border-l-destructive">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-body mb-2">Overdue/Unpaid</p>
                <p className="font-display text-3xl font-bold text-foreground">
                  {members.filter(m => ["Overdue", "No Record"].includes(getFeeStatus(m.feePaidUntil).label)).length}
                </p>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">Fee Management</h3>
                  <p className="text-sm text-muted-foreground font-body">Track payments and subscription status for all members.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                {members.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-muted-foreground font-body">No members found.</p>
                  </div>
                ) : (
                  <table className="w-full text-left font-body min-w-[600px]">
                    <thead className="bg-muted/50 text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-semibold">Member</th>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-semibold">Plan</th>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-semibold">Paid Until</th>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-semibold">Status</th>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {members.map((m) => {
                        const status = getFeeStatus(m.feePaidUntil);
                        const StatusIcon = status.icon;
                        return (
                          <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 md:px-6 md:py-4">
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-sage-light flex items-center justify-center text-sage font-display text-xs font-bold">
                                  {m.name.charAt(0)}
                                </div>
                                <span className="text-xs md:text-sm font-medium text-foreground whitespace-nowrap">{m.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 md:px-6 md:py-4">
                              <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">{m.membershipPlan}</span>
                            </td>
                            <td className="px-4 py-3 md:px-6 md:py-4">
                              <p className="text-xs md:text-sm text-foreground whitespace-nowrap">
                                {m.feePaidUntil ? format(new Date(m.feePaidUntil), "PP") : "Never Paid"}
                              </p>
                              {m.lastPaymentDate && (
                                <p className="text-[9px] md:text-[10px] text-muted-foreground">Last: {format(new Date(m.lastPaymentDate), "P")}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 md:px-6 md:py-4">
                              <div className={`flex items-center gap-1 md:gap-1.5 text-[8px] md:text-[10px] uppercase tracking-widest font-bold whitespace-nowrap ${status.color}`}>
                                <StatusIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                {status.label}
                              </div>
                            </td>
                            <td className="px-4 py-3 md:px-6 md:py-4">
                              <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedMemberId(m.id);
                                  setSelectedMemberName(m.name);
                                  setShowPaymentModal(true);
                                }}
                                className="text-[9px] md:text-[10px] uppercase tracking-widest bg-sage text-white rounded-lg px-3 py-1.5 md:px-4 md:py-2 hover:opacity-90 transition-all font-bold whitespace-nowrap"
                              >
                                Record Payment
                              </button>
                              <button
                                onClick={() => handleSendFeeReminder(m.id, m.name)}
                                disabled={sendingNotif[m.id]}
                                title="Send fee due push notification"
                                className={`flex items-center gap-1 text-[9px] md:text-[10px] uppercase tracking-widest rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 transition-all font-bold whitespace-nowrap border ${
                                  status.label === "Paid"
                                    ? "text-muted-foreground border-border hover:border-orange-400 hover:text-orange-500"
                                    : "text-white bg-orange-500 border-orange-500 hover:bg-orange-600"
                                } disabled:opacity-50 disabled:cursor-wait`}
                              >
                                <Bell className="w-3 h-3" />
                                {sendingNotif[m.id] ? "Sending…" : "Notify"}
                              </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl p-6 md:p-8 w-full max-w-md animate-fade-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg md:text-xl font-semibold text-foreground mb-1">
              Add New {modalRole === "member" ? "Member" : "Trainer"}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-5 md:mb-6 font-body">A unique access code will be auto-generated.</p>

            <div className="mb-4 md:mb-5">
              <label className="block text-[10px] md:text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1.5 md:mb-2 font-body">Full Name</label>
              <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Enter full name" maxLength={50}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 md:px-4 md:py-3 text-foreground font-body text-sm outline-none focus:border-sage transition-colors" />
            </div>

            {modalRole === "member" && (
              <div className="mb-5">
                <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 font-body">Membership Plan</label>
                <div className="grid grid-cols-3 gap-3">
                  {MEMBERSHIP_PLANS.map(plan => (
                    <button
                      key={plan}
                      onClick={() => setMembershipPlan(plan)}
                      className={`py-3 text-xs uppercase tracking-widest font-body rounded-lg border transition-all ${
                        membershipPlan === plan
                          ? "border-sage bg-sage-light text-sage"
                          : "border-border text-muted-foreground hover:border-sage/40"
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Role Selector */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {(["member", "trainer"] as const).map(role => (
                <button key={role} onClick={() => setModalRole(role)}
                  className={`py-3 text-xs uppercase tracking-widest font-body rounded-lg border transition-all ${
                    modalRole === role
                      ? "border-sage bg-sage-light text-sage"
                      : "border-border text-muted-foreground hover:border-sage/40"
                  }`}>
                  {role}
                </button>
              ))}
            </div>

            {/* Generated Code Display */}
            {generatedCode && (
              <div className="bg-sage-light border border-sage/20 rounded-xl p-4 mb-5 animate-fade-up">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 font-body">Access Code</p>
                <p className="font-display text-2xl font-bold text-sage tracking-[0.3em]">{generatedCode}</p>
                <p className="text-xs text-muted-foreground mt-2 font-body">Share this code with the user to log in.</p>
                <button
                  onClick={() => shareViaWhatsApp(savedUserName, generatedCode, savedUserRole, savedMembershipPlan)}
                  className="mt-4 w-full bg-foreground text-background rounded-xl py-3 text-sm font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity font-body"
                >
                  Share on WhatsApp
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-border rounded-xl py-3 text-sm text-muted-foreground hover:border-destructive hover:text-destructive transition-colors font-body">
                Cancel
              </button>
              <button onClick={handleAddUser}
                className="flex-[2] bg-sage text-primary-foreground rounded-xl py-3 text-sm font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity font-body">
                {generatedCode ? "✓ Saved!" : "Generate & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4" onClick={() => setShowBroadcastModal(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl p-6 md:p-8 w-full max-w-md animate-fade-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg md:text-xl font-semibold text-foreground mb-1">
              Broadcast Announcement
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-6 font-body">Send a notification to all members.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5 font-body">Notification Title</label>
                <input type="text" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} placeholder="e.g. Gym Holiday Notice"
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm outline-none focus:border-sage transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5 font-body">Message Content</label>
                <textarea value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} placeholder="Type your announcement here..." rows={4}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm outline-none focus:border-sage transition-colors resize-none" />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowBroadcastModal(false)}
                  className="flex-1 border border-border rounded-xl py-3 text-sm text-muted-foreground hover:border-destructive hover:text-destructive transition-colors font-body">
                  Cancel
                </button>
                <button onClick={handleBroadcast} disabled={isBroadcasting}
                  className="flex-[2] bg-terracotta text-white rounded-xl py-3 text-sm font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity font-body flex items-center justify-center gap-2">
                  <Bell className="w-4 h-4" />
                  {isBroadcasting ? "Sending..." : "Send to All Members"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl p-6 md:p-8 w-full max-w-md animate-fade-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg md:text-xl font-semibold text-foreground mb-1">
              Record Payment
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-5 md:mb-6 font-body">Update fee status for <strong>{selectedMemberName}</strong></p>

            <div className="space-y-4 md:space-y-5">
              <div>
                <label className="block text-[10px] md:text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1.5 md:mb-2 font-body">Amount Paid</label>
                <div className="relative">
                  <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-body">$</span>
                  <input 
                    type="number" 
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(e.target.value)} 
                    placeholder="0.00"
                    className="w-full bg-background border border-border rounded-lg pl-7 pr-3 py-2.5 md:pl-8 md:pr-4 md:py-3 text-foreground font-body text-sm outline-none focus:border-sage transition-colors" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 font-body">Subscription Extension</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "1 Mo", val: 1 },
                    { label: "3 Mo", val: 3 },
                    { label: "1 Yr", val: 12 },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setPaymentMonths(opt.val)}
                      className={`py-3 text-xs uppercase tracking-widest font-body rounded-lg border transition-all ${
                        paymentMonths === opt.val
                          ? "border-sage bg-sage-light text-sage font-bold"
                          : "border-border text-muted-foreground hover:border-sage/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowPaymentModal(false)}
                  className="flex-1 border border-border rounded-xl py-3 text-sm text-muted-foreground hover:border-destructive hover:text-destructive transition-colors font-body">
                  Cancel
                </button>
                <button onClick={handleRecordPayment}
                  className="flex-[2] bg-sage text-white rounded-xl py-3 text-sm font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity font-body">
                  Record & Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
