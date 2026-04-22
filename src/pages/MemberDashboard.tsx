import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useGym } from "@/contexts/GymContext";
import { useToast } from "@/hooks/use-toast";
import GymScanner from "@/components/GymScanner";
import { Scan, Wallet, CheckCircle2, AlertCircle, Clock, IndianRupee } from "lucide-react";

const MemberDashboard = () => {
  const { currentUser, gymName, gymUpiId, members, trainers, attendanceRecords, logout, isLoading, markAttendanceByMember } = useGym();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showScanner, setShowScanner] = useState(false);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="aesthetic-bg" />
        <div className="relative z-10">
          <span className="inline-block w-8 h-8 border-4 border-lavender/30 border-t-lavender rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "member") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="aesthetic-bg" />
        <div className="relative z-10 text-center animate-fade-up">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground font-body mb-6">Please log in as a member first.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-sage text-primary-foreground font-body font-semibold text-sm uppercase tracking-widest px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const gymMembers = members.filter((member) => member.gym_id === currentUser.gym_id);
  const gymTrainers = trainers.filter((trainer) => trainer.gym_id === currentUser.gym_id);
  const memberAttendance = attendanceRecords.filter((record) => record.user_id === currentUser.id);
  const lastAttendance = memberAttendance[0];

  const getFeeStatus = (feePaidUntil?: string) => {
    if (!feePaidUntil) return { label: "No Record", color: "text-muted-foreground", icon: AlertCircle, bg: "bg-muted/5" };
    const date = new Date(feePaidUntil);
    const now = new Date();
    
    // Within 7 days of expiry
    const warningThreshold = new Date();
    warningThreshold.setDate(now.getDate() + 7);

    if (date < now) return { label: "Membership Overdue", color: "text-destructive", icon: AlertCircle, bg: "bg-destructive/5" };
    if (date < warningThreshold) return { label: "Membership Expiring Soon", color: "text-warning", icon: Clock, bg: "bg-warning/5" };
    return { label: "Membership Active", color: "text-success", icon: CheckCircle2, bg: "bg-success/5" };
  };

  const feeStatus = getFeeStatus(currentUser.feePaidUntil);
  const StatusIcon = feeStatus.icon;

  return (
    <div className="min-h-screen bg-background relative">
      <div className="aesthetic-bg" />

      <header className="relative z-10 border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="logo.png" alt="GymFlow Logo" className="h-8 w-auto" />
            <span className="text-xs text-muted-foreground font-body">/ Member</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-background border border-border rounded-full px-4 py-1.5">
              <div className="w-7 h-7 rounded-full bg-lavender-light flex items-center justify-center text-lavender font-display text-xs font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <span className="text-sm font-body text-foreground">{currentUser.name}</span>
              <span className="text-[10px] uppercase tracking-widest text-lavender bg-lavender-light px-2 py-0.5 rounded-md font-body">Member</span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="text-xs text-destructive/50 border border-destructive/20 rounded-lg px-3 py-2 hover:text-destructive hover:border-destructive transition-colors font-body"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="mb-6 md:mb-10 animate-fade-up">
          <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-muted-foreground font-body mb-1">Welcome Back</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">
            Hello, <span className="text-lavender">{currentUser.name.split(" ")[0]}</span>
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground font-body mt-1">Gym: {currentUser.gym_id}</p>
          <div className={`inline-flex items-center gap-1.5 md:gap-2 mt-2 md:mt-3 border rounded-lg px-3 py-1.5 md:px-4 md:py-2 ${feeStatus.bg} ${feeStatus.color.replace('text-', 'border-').replace('destructive', 'destructive/20').replace('warning', 'warning/20').replace('success', 'success/20')}`}>
            <StatusIcon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${feeStatus.color}`} />
            <span className={`text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-body ${feeStatus.color}`}>{feeStatus.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-10 animate-fade-up-delay-1">
          {[
            { icon: "🏷️", label: "Your Role", value: "MEMBER" },
            { icon: "🏢", label: "Gym ID", value: currentUser.gym_id.substring(0, 16) },
            { icon: "📅", label: "Attendance Marks", value: `${memberAttendance.length}` },
            { 
              icon: <Wallet className="w-6 h-6 text-lavender" />, 
              label: "Paid Until", 
              value: currentUser.feePaidUntil ? format(new Date(currentUser.feePaidUntil), "PPP") : "No Payment Record" 
            },
          ].map((info) => (
            <div key={info.label} className="bg-card rounded-xl border border-border p-4 md:p-6 hover:border-lavender/30 transition-colors">
              <span className="text-xl md:text-2xl block mb-2 md:mb-3">{info.icon}</span>
              <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-body mb-1">{info.label}</p>
              <p className="font-display text-base md:text-lg font-bold text-foreground">{info.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-4 md:gap-6 mb-8 md:mb-10">
          <section className="bg-card rounded-2xl border border-border p-5 md:p-8 animate-fade-up-delay-2 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-lavender/10 rounded-full flex items-center justify-center mb-6">
              <Scan className="w-8 h-8 md:w-10 md:h-10 text-lavender" />
            </div>
            
            <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-lavender font-body mb-2">Check-In</p>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">Scan Gym QR Code</h3>
            <p className="text-sm md:text-base text-muted-foreground font-body max-w-sm mb-8">
              Mark your attendance by scanning the QR code displayed at the gym counter.
            </p>

            <button
              onClick={() => setShowScanner(true)}
              className="w-full max-w-sm flex items-center justify-center gap-3 bg-lavender text-white rounded-2xl py-4 md:py-5 font-body font-bold text-sm md:text-base uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-lavender/25 active:scale-[0.98]"
            >
              <Scan className="w-5 h-5 md:w-6 md:h-6" />
              Open Scanner
            </button>
            
            <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground font-body bg-muted/30 px-4 py-2 rounded-full">
              <Clock className="w-3 h-3" />
              <span>Available during gym hours</span>
            </div>
          </section>

          <GymScanner
            isOpen={showScanner}
            onClose={() => setShowScanner(false)}
            onScan={async (value) => {
              try {
                await markAttendanceByMember(value);
                setShowScanner(false);
                toast({
                  title: "Attendance Recorded!",
                  description: "Your attendance has been successfully marked.",
                });
              } catch (error: any) {
                toast({
                  title: "Scan Failed",
                  description: error.message || "Could not process QR code.",
                  variant: "destructive",
                });
              }
            }}
          />

          <section className="space-y-4 md:space-y-6 animate-fade-up-delay-2">
            <div className="bg-card rounded-2xl border border-border p-5 md:p-6">
              <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-sage font-body mb-1 md:mb-2">Latest Check-In</p>
              <h3 className="font-display text-xl md:text-2xl font-semibold text-foreground mb-2">Attendance Status</h3>
              {lastAttendance ? (
                <>
                  <p className="text-xs md:text-sm text-muted-foreground font-body">
                    Last marked on {format(new Date(lastAttendance.scanned_at), "PPP")} at {format(new Date(lastAttendance.scanned_at), "p")}.
                  </p>
                  <div className="mt-3 md:mt-4 inline-flex items-center gap-1.5 md:gap-2 bg-success/5 border border-success/20 rounded-lg px-3 py-1.5 md:px-4 md:py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-soft" />
                    <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-success font-body">Recorded via scan</span>
                  </div>
                </>
              ) : (
                <p className="text-xs md:text-sm text-muted-foreground font-body">
                  No attendance has been recorded yet. Your first scan will show up here.
                </p>
              )}
            </div>

            <div className="bg-card rounded-2xl border border-border p-5 md:p-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="font-display text-lg font-semibold text-foreground">Recent Attendance</h3>
                <span className="text-xs text-muted-foreground font-body">{memberAttendance.length} total</span>
              </div>
              {memberAttendance.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body">No attendance records yet.</p>
              ) : (
                <div className="space-y-3">
                  {memberAttendance.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                      <div>
                        <p className="text-sm font-body font-medium text-foreground">{format(new Date(record.scanned_at), "PPP")}</p>
                        <p className="text-xs text-muted-foreground font-body">{format(new Date(record.scanned_at), "p")}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-success border border-success/20 bg-success/5 px-2 py-1 rounded-md font-body">
                        Present
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* UPI Pay Fees Card */}
            <div className="bg-card rounded-2xl border border-border p-5 md:p-6">
              <div className="flex items-center gap-2 mb-3">
                <IndianRupee className="w-5 h-5 text-lavender" />
                <h3 className="font-display text-lg font-semibold text-foreground">Pay Fees via UPI</h3>
              </div>
              {gymUpiId ? (
                <>
                  <p className="text-xs text-muted-foreground font-body mb-1">
                    Tap below to open your payment app and pay directly to {gymName || "your gym"}.
                  </p>
                  <p className="text-[10px] font-mono text-lavender bg-lavender/5 border border-lavender/20 rounded-lg px-3 py-1.5 mb-4 break-all">
                    {gymUpiId}
                  </p>
                  <button
                    onClick={() => {
                      const upiUrl = `upi://pay?pa=${encodeURIComponent(gymUpiId)}&pn=${encodeURIComponent(gymName || "Gym")}&cu=INR`;
                      window.location.href = upiUrl;
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-lavender text-white rounded-2xl py-4 font-body font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-lavender/25 active:scale-[0.98]"
                  >
                    <IndianRupee className="w-5 h-5" />
                    Open Payment App
                  </button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground font-body">
                  UPI payment is not set up yet. Ask your gym owner to add a UPI ID.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="mb-10 animate-fade-up-delay-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-foreground">Fellow Members</h3>
            <span className="text-xs text-muted-foreground font-body">{gymMembers.length} total</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {gymMembers.map((member) => (
              <div
                key={member.id}
                className={`bg-card rounded-xl border p-4 flex items-center gap-3 transition-colors ${
                  member.id === currentUser.id ? "border-lavender/40 bg-lavender-light/30" : "border-border hover:border-lavender/20"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-lavender-light flex items-center justify-center text-lavender font-display text-xs font-bold flex-shrink-0">
                  {member.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-body font-medium text-foreground truncate">
                    {member.name}
                    {member.id === currentUser.id ? " (you)" : ""}
                  </p>
                  <p className={`text-[10px] font-body ${member.status === "active" ? "text-success" : "text-muted-foreground"}`}>
                    {member.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-up-delay-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-foreground">Your Trainers</h3>
          </div>
          {gymTrainers.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground text-sm font-body">No trainers assigned yet</p>
          ) : gymTrainers.map((trainer) => (
            <div
              key={trainer.id}
              className="bg-card rounded-xl border border-border p-5 flex items-center gap-4 mb-3 hover:border-sage/30 transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-sage-light flex items-center justify-center text-sage font-display text-base font-bold flex-shrink-0">
                {trainer.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-body font-medium text-foreground">{trainer.name}</p>
                <span className="text-[10px] uppercase tracking-widest text-sage bg-sage-light px-2 py-0.5 rounded-md font-body mt-1 inline-block">
                  Certified Trainer
                </span>
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-body ${trainer.status === "active" ? "text-success" : "text-muted-foreground"}`}>
                {trainer.status}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default MemberDashboard;
