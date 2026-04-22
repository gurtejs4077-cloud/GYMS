import { useNavigate } from "react-router-dom";
import { useGym } from "@/contexts/GymContext";

const TrainerDashboard = () => {
  const { currentUser, members, trainers, logout, isLoading } = useGym();
  const navigate = useNavigate();

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

  if (!currentUser || currentUser.role !== "trainer") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="aesthetic-bg" />
        <div className="relative z-10 text-center animate-fade-up">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground font-body mb-6">Trainer credentials required.</p>
          <button onClick={() => navigate("/")}
            className="bg-sage text-primary-foreground font-body font-semibold text-sm uppercase tracking-widest px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const gymMembers = members.filter(m => m.gym_id === currentUser.gym_id);
  const gymTrainers = trainers.filter(t => t.gym_id === currentUser.gym_id);
  const activeMembers = gymMembers.filter(m => m.status === "active");

  return (
    <div className="min-h-screen bg-background relative">
      <div className="aesthetic-bg" />

      {/* Header */}
      <header className="relative z-10 border-b border-border bg-card/90 backdrop-blur-sm sticky top-0">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <img src="logo.png" alt="GymFlow Logo" className="h-8 w-auto" />
            <span className="text-[10px] md:text-xs text-muted-foreground font-body">/ Trainer</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-1.5 md:gap-2 bg-background border border-border rounded-full px-3 md:px-4 py-1 md:py-1.5">
              <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-sage-light flex items-center justify-center text-sage font-display text-[10px] md:text-xs font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <span className="hidden sm:inline text-xs md:text-sm font-body text-foreground">{currentUser.name}</span>
              <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-sage bg-sage-light px-1.5 md:px-2 py-0.5 rounded-md font-body">Trainer</span>
            </div>
            <button onClick={() => { logout(); navigate("/"); }}
              className="text-[10px] md:text-xs text-destructive/50 border border-destructive/20 rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 hover:text-destructive hover:border-destructive transition-colors font-body">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Welcome */}
        <div className="mb-8 md:mb-10 animate-fade-up">
          <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-muted-foreground font-body mb-1">Trainer Portal</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">
            Coach <span className="text-sage">{currentUser.name.split(" ").pop()}</span>
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground font-body mt-1">Gym: {currentUser.gym_id}</p>
          <div className="inline-flex items-center gap-1.5 md:gap-2 mt-2 md:mt-3 bg-sage-light border border-sage/20 rounded-lg px-3 py-1.5 md:px-4 md:py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse-soft" />
            <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-sage font-body">Trainer Access Active</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-10 animate-fade-up-delay-1">
          {[
            { label: "Total Members", value: gymMembers.length },
            { label: "Active Members", value: activeMembers.length },
            { label: "Team Trainers", value: gymTrainers.length },
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-4 md:p-6 hover:border-sage/30 transition-colors">
              <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-body mb-2 md:mb-3 truncate">{stat.label}</p>
              <p className="font-display text-2xl md:text-4xl font-bold text-sage">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Member Roster */}
        <div className="mb-8 md:mb-10 animate-fade-up-delay-2">
          <div className="flex items-center justify-between mb-3 md:mb-4 pb-3 border-b border-border">
            <h3 className="font-display text-base md:text-lg font-semibold text-foreground">Member Roster</h3>
            <span className="text-[10px] md:text-xs text-muted-foreground font-body">{gymMembers.length} registered</span>
          </div>

          {gymMembers.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground text-sm font-body">No members registered yet</p>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-body font-semibold px-4 md:px-5 py-2.5 md:py-3">Member</th>
                    <th className="text-left text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-body font-semibold px-4 md:px-5 py-2.5 md:py-3">Status</th>
                    <th className="text-left text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-body font-semibold px-4 md:px-5 py-2.5 md:py-3">Fee Status</th>
                    <th className="text-left text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-body font-semibold px-4 md:px-5 py-2.5 md:py-3">User ID</th>
                  </tr>
                </thead>
                <tbody>
                  {gymMembers.map(m => (
                    <tr key={m.id} className="border-b border-border/50 hover:bg-sage-light/20 transition-colors">
                      <td className="px-4 md:px-5 py-3 md:py-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-sage-light flex items-center justify-center text-sage font-display text-[10px] md:text-xs font-bold flex-shrink-0">
                            {m.name.charAt(0)}
                          </div>
                          <span className="text-xs md:text-sm font-body font-medium text-foreground whitespace-nowrap">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-5 py-3 md:py-4">
                        <span className={`text-[8px] md:text-[10px] uppercase tracking-widest px-1.5 md:px-2 py-0.5 rounded-md border font-body whitespace-nowrap ${
                          m.status === "active" ? "text-success border-success/30 bg-success/5" : "text-warning border-warning/30 bg-warning/5"
                        }`}>{m.status}</span>
                      </td>
                      <td className="px-4 md:px-5 py-3 md:py-4">
                        {(() => {
                          if (!m.feePaidUntil) return <span className="text-[10px] text-muted-foreground">No Record</span>;
                          const date = new Date(m.feePaidUntil);
                          const now = new Date();
                          return (
                            <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${date < now ? "text-destructive" : "text-success"}`}>
                              {date < now ? "Overdue" : "Paid"}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 md:px-5 py-3 md:py-4 text-[10px] md:text-xs text-muted-foreground font-body">{m.id.substring(0, 16)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Training Team */}
        <div className="animate-fade-up-delay-3">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h3 className="font-display text-lg font-semibold text-foreground">Training Team</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {gymTrainers.map(t => (
              <div key={t.id} className={`bg-card rounded-xl border p-4 flex items-center gap-3 transition-colors ${
                t.id === currentUser.id ? "border-sage/40 bg-sage-light/30" : "border-border hover:border-sage/20"
              }`}>
                <div className="w-8 h-8 rounded-full bg-sage-light flex items-center justify-center text-sage font-display text-xs font-bold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-body font-medium text-foreground">{t.name}</p>
                  {t.id === currentUser.id && (
                    <p className="text-[10px] text-sage font-body">You</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrainerDashboard;
