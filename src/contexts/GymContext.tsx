import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { db } from "@/lib/firebase";
import { Preferences } from "@capacitor/preferences";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { buildAttendanceQrValue, buildGymAttendanceQrValue, getAttendanceDateKey, parseAttendanceQrValue } from "@/lib/attendance";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  setDoc, 
  doc, 
  updateDoc,
  getDoc,
  onSnapshot
} from "firebase/firestore";

export type UserRole = "member" | "trainer" | "owner";

export interface GymUser {
  id: string;
  name: string;
  role: UserRole;
  gym_id: string;
  access_code: string;
  status: "active" | "pending";
  membershipPlan?: "Monthly" | "Quarterly" | "Yearly";
  feePaidUntil?: string; // ISO Date string
  lastPaymentAmount?: number;
  lastPaymentDate?: string; // ISO Date string
}

export interface AttendanceRecord {
  id: string;
  gym_id: string;
  user_id: string;
  member_name: string;
  member_access_code: string;
  scanned_by: "owner" | "member_scan";
  scanned_at: string;
  date_key: string;
  created_at?: string;
}

interface GymContextType {
  currentUser: GymUser | null;
  gymName: string;
  gymId: string;
  gymUpiId: string;
  members: GymUser[];
  trainers: GymUser[];
  attendanceRecords: AttendanceRecord[];
  login: (code: string) => Promise<GymUser | null>;
  logout: () => void;
  setupGym: (name: string, owner: string, location: string, passkey: string) => Promise<void>;
  addUser: (payload: {
    name: string;
    role: "member" | "trainer";
    membershipPlan?: "Monthly" | "Quarterly" | "Yearly";
  }) => Promise<string>;
  markAttendanceFromQr: (qrValue: string) => Promise<AttendanceRecord>;
  getMemberAttendanceQrValue: (user: Pick<GymUser, "id" | "role" | "gym_id">) => string;
  getGymAttendanceQrValue: () => string;
  markAttendanceByMember: (qrValue: string) => Promise<AttendanceRecord>;
  isGymSetup: boolean;
  ownerPasskey: string;
  refreshUsers: () => Promise<void>;
  refreshAttendance: () => Promise<void>;
  recordPayment: (userId: string, amount: number, months: number) => Promise<void>;
  sendFeeReminder: (memberId: string, title?: string, body?: string) => Promise<void>;
  sendCustomNotification: (title: string, body: string, memberIds?: string[]) => Promise<void>;
  updateGymUpiId: (upiId: string) => Promise<void>;
  isLoading: boolean;
}

const GymContext = createContext<GymContextType | null>(null);

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export function GymProvider({ children }: { children: ReactNode }) {
  const [gymName, setGymName] = useState("");
  const [gymId, setGymId] = useState("");
  const [gymUpiId, setGymUpiId] = useState("");
  const [ownerPasskey, setOwnerPasskey] = useState("");
  const [members, setMembers] = useState<GymUser[]>([]);
  const [trainers, setTrainers] = useState<GymUser[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<GymUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from Preferences and refresh from Firestore
  useEffect(() => {
    const init = async () => {
      const { value: name } = await Preferences.get({ key: "gf_gym_name" });
      const { value: id } = await Preferences.get({ key: "gf_gym_id_owner" });
      const { value: passkey } = await Preferences.get({ key: "gf_owner_passkey" });
      const { value: upiId } = await Preferences.get({ key: "gf_gym_upi_id" });
      const { value: userStr } = await Preferences.get({ key: "gf_current_user" });

      if (name) setGymName(name);
      if (id) setGymId(id);
      if (passkey) setOwnerPasskey(passkey);
      if (upiId) setGymUpiId(upiId);
      
      if (userStr) {
        try {
          const cachedUser = JSON.parse(userStr) as GymUser;
          setCurrentUser(cachedUser);
          
          if (cachedUser.gym_id && !id) {
            setGymId(cachedUser.gym_id);
          }
        } catch (e) {
          console.error("Failed to load user session", e);
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // Real-time listener for currentUser data (e.g. fee payment updates)
  useEffect(() => {
    if (!currentUser?.id) return;

    // We use the ID to listen for changes to THIS specific user
    const unsub = onSnapshot(doc(db, "users", currentUser.id), (docSnap) => {
      if (docSnap.exists()) {
        const freshData = { id: docSnap.id, ...docSnap.data() } as GymUser;
        // Only update if something actually changed to avoid infinite loops
        if (JSON.stringify(freshData) !== JSON.stringify(currentUser)) {
          setCurrentUser(freshData);
          Preferences.set({ key: "gf_current_user", value: JSON.stringify(freshData) });
        }
      }
    });

    return () => unsub();
  }, [currentUser?.id]); // Only re-run if the logged in user ID changes

  const isGymSetup = !!gymId;

  // Push notification registration
  useEffect(() => {
    if (!currentUser?.id && !isGymSetup) return;
    
    const registerPush = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          let permStatus = await PushNotifications.checkPermissions();
          if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
          }
          if (permStatus.receive !== 'granted') {
            return;
          }

          await PushNotifications.register();

          PushNotifications.addListener('registration', async (token) => {
            try {
              if (currentUser?.id) {
                await updateDoc(doc(db, "users", currentUser.id), { push_token: token.value });
              } else if (isGymSetup && gymId) {
                // Register owner's token in the gym document
                await updateDoc(doc(db, "gyms", gymId), { owner_push_token: token.value });
              }
            } catch (err) {
              console.error("Failed to save push token", err);
            }
          });

        } catch (e) {
          console.error("Push notification setup failed", e);
        }
      }
    };

    registerPush();
    
    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [currentUser?.id, isGymSetup, gymId]);

  const refreshUsers = useCallback(async () => {
    if (!gymId) return;
    try {
      const q = query(collection(db, "users"), where("gym_id", "==", gymId));
      const querySnapshot = await getDocs(q);
      const allUsers: GymUser[] = [];
      querySnapshot.forEach((doc) => {
        allUsers.push({ id: doc.id, ...doc.data() } as GymUser);
      });
      setMembers(allUsers.filter(u => u.role === "member"));
      setTrainers(allUsers.filter(u => u.role === "trainer"));
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, [gymId]);

  const refreshAttendance = useCallback(async () => {
    if (!gymId) return;

    try {
      const q = query(collection(db, "attendance"), where("gym_id", "==", gymId));
      const querySnapshot = await getDocs(q);
      const records: AttendanceRecord[] = [];

      querySnapshot.forEach((attendanceDoc) => {
        const data = attendanceDoc.data();
        records.push({
          id: attendanceDoc.id,
          gym_id: data.gym_id,
          user_id: data.user_id,
          member_name: data.member_name,
          member_access_code: data.member_access_code,
          scanned_by: data.scanned_by,
          scanned_at: data.scanned_at?.toDate ? data.scanned_at.toDate().toISOString() : new Date(data.scanned_at).toISOString(),
          created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at ? new Date(data.created_at).toISOString() : undefined,
          date_key: data.date_key,
        });
      });

      records.sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime());
      setAttendanceRecords(records);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    }
  }, [gymId]);

  useEffect(() => {
    if (gymId) {
      refreshUsers();
      refreshAttendance();
      
      getDoc(doc(db, "gyms", gymId)).then(async docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (!gymName) {
            setGymName(data.name);
            setOwnerPasskey(data.passkey);
            await Preferences.set({ key: "gf_gym_name", value: data.name });
            await Preferences.set({ key: "gf_owner_passkey", value: data.passkey });
          }
          // Always sync UPI ID from Firestore
          if (data.upi_id) {
            setGymUpiId(data.upi_id);
            await Preferences.set({ key: "gf_gym_upi_id", value: data.upi_id });
          }
        }
      });
    }
  }, [gymId, gymName, refreshAttendance, refreshUsers]);

  const login = useCallback(async (code: string): Promise<GymUser | null> => {
    try {
      const q = query(collection(db, "users"), where("access_code", "==", code));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = { id: userDoc.id, ...userDoc.data() } as GymUser;
        
        if (userData.status === "pending") {
          await updateDoc(doc(db, "users", userDoc.id), { status: "active" });
          userData.status = "active";
        }
        
        setCurrentUser(userData);
        // Important: Set gymId for non-owners too so they can see attendance/members
        setGymId(userData.gym_id);
        
        await Preferences.set({ key: "gf_current_user", value: JSON.stringify(userData) });
        return userData;
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
    return null;
  }, []);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    await Preferences.remove({ key: "gf_current_user" });
  }, []);

  const setupGym = useCallback(async (name: string, owner: string, _location: string, passkey: string) => {
    try {
      const gymRef = doc(collection(db, "gyms"));
      const id = gymRef.id;
      
      await setDoc(gymRef, { name, owner_name: owner, passkey, created_at: new Date() });
      
      setGymName(name);
      setGymId(id);
      setOwnerPasskey(passkey);
      await Preferences.set({ key: "gf_gym_name", value: name });
      await Preferences.set({ key: "gf_gym_id_owner", value: id });
      await Preferences.set({ key: "gf_owner_passkey", value: passkey });
    } catch (error) {
      console.error("Setup failed:", error);
      throw error;
    }
  }, []);

  const addUser = useCallback(async ({
    name,
    role,
    membershipPlan,
  }: {
    name: string;
    role: "member" | "trainer";
    membershipPlan?: "Monthly" | "Quarterly" | "Yearly";
  }): Promise<string> => {
    const code = generateCode();
    const gid = gymId || "gym_demo";

    try {
      await addDoc(collection(db, "users"), {
        name,
        role,
        gym_id: gid,
        access_code: code,
        status: "pending",
        membershipPlan: role === "member" ? membershipPlan || "Monthly" : "",
        created_at: new Date()
      });
      
      await refreshUsers();
      return code;
    } catch (error) {
      console.error("Add user failed:", error);
      throw error;
    }
  }, [gymId, refreshUsers]);

  const getMemberAttendanceQrValue = useCallback((user: Pick<GymUser, "id" | "role" | "gym_id">) => {
    if (user.role !== "member") {
      throw new Error("Only members can generate attendance QR codes.");
    }

    return buildAttendanceQrValue({
      version: "1",
      gymId: user.gym_id,
      userId: user.id,
      role: "member",
    });
  }, []);

  const getGymAttendanceQrValue = useCallback(() => {
    if (!gymId) throw new Error("Gym ID not set.");
    return buildGymAttendanceQrValue({
      version: "1",
      gymId,
      role: "gym",
    });
  }, [gymId]);

  const markAttendanceByMember = useCallback(async (qrValue: string): Promise<AttendanceRecord> => {
    const parsed = parseAttendanceQrValue(qrValue);

    if (!parsed || parsed.role !== "gym") {
      throw new Error("Invalid Gym QR code.");
    }

    if (parsed.gymId !== currentUser?.gym_id) {
      throw new Error("This QR code belongs to another gym.");
    }

    const now = new Date();
    const dateKey = getAttendanceDateKey(now);
    const attendanceId = `${parsed.gymId}_${currentUser.id}_${dateKey}`;
    const attendanceRef = doc(db, "attendance", attendanceId);

    await setDoc(attendanceRef, {
      gym_id: parsed.gymId,
      user_id: currentUser.id,
      member_name: currentUser.name,
      member_access_code: currentUser.access_code,
      scanned_by: "member_scan", // Distinguish from owner scan
      scanned_at: now,
      created_at: now,
      date_key: dateKey,
    }, { merge: true });

    const savedRecord: AttendanceRecord = {
      id: attendanceId,
      gym_id: parsed.gymId,
      user_id: currentUser.id,
      member_name: currentUser.name,
      member_access_code: currentUser.access_code,
      scanned_by: "member_scan", 
      scanned_at: now.toISOString(),
      created_at: now.toISOString(),
      date_key: dateKey,
    };

    await refreshAttendance();
    return savedRecord;
  }, [currentUser, refreshAttendance]);

  const markAttendanceFromQr = useCallback(async (qrValue: string): Promise<AttendanceRecord> => {
    const parsed = parseAttendanceQrValue(qrValue);

    if (!parsed || parsed.role !== "member") {
      throw new Error("Invalid member QR code.");
    }

    if (!gymId || parsed.gymId !== gymId) {
      throw new Error("This QR code belongs to another gym.");
    }

    const member = members.find((entry) => entry.id === parsed.userId && entry.role === "member");

    if (!member) {
      throw new Error("Member not found for this QR code.");
    }

    const now = new Date();
    const dateKey = getAttendanceDateKey(now);
    const attendanceId = `${gymId}_${member.id}_${dateKey}`;
    const attendanceRef = doc(db, "attendance", attendanceId);

    await setDoc(attendanceRef, {
      gym_id: gymId,
      user_id: member.id,
      member_name: member.name,
      member_access_code: member.access_code,
      scanned_by: "owner",
      scanned_at: now,
      created_at: now,
      date_key: dateKey,
    }, { merge: true });

    const savedRecord: AttendanceRecord = {
      id: attendanceId,
      gym_id: gymId,
      user_id: member.id,
      member_name: member.name,
      member_access_code: member.access_code,
      scanned_by: "owner",
      scanned_at: now.toISOString(),
      created_at: now.toISOString(),
      date_key: dateKey,
    };

    await refreshAttendance();
    return savedRecord;
  }, [gymId, members, refreshAttendance]);

  // FCM Server Key is now handled via Service Account JWT in lib/fcm-v1.ts

  const sendFeeReminder = useCallback(async (memberId: string, title?: string, body?: string) => {
    try {
      let targetToken = "";
      let targetName = "";

      if (memberId === "test_id") {
        // Find the owner's token in the gym document
        if (!gymId) throw new Error("Gym ID not found");
        const gymSnap = await getDoc(doc(db, "gyms", gymId));
        const ownerToken = gymSnap.exists() ? gymSnap.data().owner_push_token : null;
        
        if (!ownerToken) {
          throw new Error("No phone registered. Please log in to the Android App once so we can find your phone.");
        }
        
        targetToken = ownerToken;
        targetName = currentUser?.name || "Owner";
      } else {
        const memberRef = doc(db, "users", memberId);
        const memberSnap = await getDoc(memberRef);
        if (!memberSnap.exists()) throw new Error("Member not found");
        const memberData = memberSnap.data() as GymUser & { push_token?: string };
        if (!memberData.push_token) throw new Error("Member hasn't enabled push notifications.");
        targetToken = memberData.push_token;
        targetName = memberData.name;
      }

      const finalTitle = title || `⚠️ Fee Due — ${gymName}`;
      const finalBody = body || `Hi ${targetName}, your gym membership fee is due. Please pay to continue access.`;

      // Now calling the secure Vercel Function
      const response = await fetch("https://gyms-1n2we2j7f-gurtej-singhs-projects-4c034374.vercel.app/api/send-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: targetToken,
          title: finalTitle,
          body: finalBody,
          data: { type: "fee_reminder", gymName, memberId }
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to send notification");
      }
    } catch (error) {
      console.error("Failed to send fee reminder:", error);
      throw error;
    }
  }, [gymName, gymId, currentUser]);

  const sendCustomNotification = useCallback(async (title: string, body: string, memberIds?: string[]) => {
    const targets = memberIds || members.map(m => m.id);

    for (const id of targets) {
      if (id === 'test_id') continue;
      try {
        const memberRef = doc(db, "users", id);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          const memberData = memberSnap.data();
          if (memberData.push_token) {
            await fetch("https://gyms-1n2we2j7f-gurtej-singhs-projects-4c034374.vercel.app/api/send-push", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: memberData.push_token,
                title,
                body,
                data: { type: "broadcast", gymName }
              })
            });
          }
        }
      } catch (e) {
        console.error(`Failed broadcast to ${id}`, e);
      }
    }
  }, [members, gymName]);

  const sendOwnerNotification = useCallback(async (title: string, body: string) => {
    try {
      if (!gymId) return;
      
      const gymSnap = await getDoc(doc(db, "gyms", gymId));
      if (!gymSnap.exists()) return;
      
      const gymData = gymSnap.data();
      const ownerToken = gymData.owner_push_token;
      
      if (!ownerToken) {
        console.warn("Owner push token not found. Notification skipped.");
        return;
      }

      await fetch("https://gyms-1n2we2j7f-gurtej-singhs-projects-4c034374.vercel.app/api/send-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: ownerToken,
          title,
          body
        })
      });
    } catch (e) {
      console.error("Failed to notify owner", e);
    }
  }, [gymId]);

  const checkExpirationsAndNotifyOwner = useCallback(async () => {
    if (!gymId || members.length === 0) return;

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const expiringMembers = members.filter(m => {
      if (!m.feePaidUntil) return false;
      const expiryDate = new Date(m.feePaidUntil);
      return expiryDate > now && expiryDate <= threeDaysFromNow;
    });

    if (expiringMembers.length > 0) {
      const { value: lastCheck } = await Preferences.get({ key: "gf_last_expiry_check" });
      const today = now.toISOString().split('T')[0];
      
      if (lastCheck !== today) {
        const names = expiringMembers.map(m => m.name).join(", ");
        await sendOwnerNotification(
          "⌛ Fees Expiring Soon",
          `${expiringMembers.length} member(s) fees are expiring in the next 3 days: ${names}`
        );
        await Preferences.set({ key: "gf_last_expiry_check", value: today });
      }
    }
  }, [gymId, members, sendOwnerNotification]);

  // Run expiration check on mount or when members change
  useEffect(() => {
    if (isGymSetup && members.length > 0) {
      checkExpirationsAndNotifyOwner();
    }
  }, [isGymSetup, members.length, checkExpirationsAndNotifyOwner]);

  const updateGymUpiId = useCallback(async (upiId: string) => {
    if (!gymId) throw new Error("Gym not set up yet.");
    try {
      await updateDoc(doc(db, "gyms", gymId), { upi_id: upiId });
      setGymUpiId(upiId);
      await Preferences.set({ key: "gf_gym_upi_id", value: upiId });
    } catch (error) {
      console.error("Failed to update UPI ID:", error);
      throw error;
    }
  }, [gymId]);

  const recordPayment = useCallback(async (userId: string, amount: number, months: number) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) throw new Error("User not found");
      
      const userData = userSnap.data() as GymUser;
      const now = new Date();
      let newDate: Date;

      if (userData.feePaidUntil) {
        const currentPaidUntil = new Date(userData.feePaidUntil);
        // If already expired, start from now. If not expired, extend from then.
        newDate = currentPaidUntil > now ? new Date(currentPaidUntil) : new Date(now);
      } else {
        newDate = new Date(now);
      }

      newDate.setMonth(newDate.getMonth() + months);

      await updateDoc(userRef, {
        feePaidUntil: newDate.toISOString(),
        lastPaymentAmount: amount,
        lastPaymentDate: now.toISOString(),
      });

      // Also record in a payments collection for history
      await addDoc(collection(db, "payments"), {
        userId,
        userName: userData.name,
        gymId: userData.gym_id,
        amount,
        months,
        paidAt: now.toISOString(),
        validUntil: newDate.toISOString(),
      });

      await refreshUsers();
    } catch (error) {
      console.error("Failed to record payment:", error);
      throw error;
    }
  }, [refreshUsers]);

  return (
    <GymContext.Provider value={{ 
      currentUser, 
      gymName, 
      gymId,
      gymUpiId,
      members, 
      trainers, 
      attendanceRecords,
      login, 
      logout, 
      setupGym, 
      addUser, 
      markAttendanceFromQr,
      getMemberAttendanceQrValue,
      getGymAttendanceQrValue,
      markAttendanceByMember,
      isGymSetup, 
      ownerPasskey,
      refreshUsers,
      refreshAttendance,
      recordPayment,
      sendFeeReminder,
      sendCustomNotification,
      updateGymUpiId,
      isLoading
    }}>
      {children}
    </GymContext.Provider>
  );
}

export function useGym() {
  const ctx = useContext(GymContext);
  if (!ctx) throw new Error("useGym must be used within GymProvider");
  return ctx;
}
