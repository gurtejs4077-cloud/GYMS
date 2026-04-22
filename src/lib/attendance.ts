export interface MemberAttendanceQrPayload {
  version: "1";
  gymId: string;
  userId: string;
  role: "member";
}

export interface GymAttendanceQrPayload {
  version: "1";
  gymId: string;
  role: "gym";
}

const QR_PREFIX = "GYMFLOW_ATTENDANCE";

export function buildAttendanceQrValue(payload: MemberAttendanceQrPayload): string {
  return [
    QR_PREFIX,
    payload.version,
    payload.gymId,
    payload.userId,
    payload.role,
  ].join("|");
}

export function buildGymAttendanceQrValue(payload: GymAttendanceQrPayload): string {
  return [
    QR_PREFIX,
    payload.version,
    payload.gymId,
    "GYM",
    payload.role,
  ].join("|");
}

export function parseAttendanceQrValue(value: string): MemberAttendanceQrPayload | GymAttendanceQrPayload | null {
  const parts = value.split("|");
  if (parts[0] !== QR_PREFIX || parts[1] !== "1") return null;

  const [_, version, gymId, id, role] = parts;

  if (role === "member") {
    return {
      version: "1",
      gymId,
      userId: id,
      role: "member",
    } as MemberAttendanceQrPayload;
  }

  if (role === "gym") {
    return {
      version: "1",
      gymId,
      role: "gym",
    } as GymAttendanceQrPayload;
  }

  return null;
}

export function getAttendanceDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

