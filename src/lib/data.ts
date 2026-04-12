// src/lib/data.ts

export interface Member {
  id: string;
  name: string;
  plan: string;
  attendance: number;
  goalProgress: number;
  trainerId: string;
  status: 'active' | 'at-risk' | 'inactive';
  joinedDate: string;
}

export interface Trainer {
  id: string;
  name: string;
  specialty: string;
  memberCount: number;
  classesPerDay: number;
  status: 'online' | 'away' | 'off';
  initials: string;
}

export interface ClassSession {
  id: string;
  name: string;
  trainerName: string;
  time: string;
  booked: number;
  capacity: number;
  color: string;
}

export const trainers: Trainer[] = [
  { id: 't1', name: 'Marcus Klein', specialty: 'Strength & conditioning', memberCount: 14, classesPerDay: 3, status: 'online', initials: 'MK' },
  { id: 't2', name: 'Sofia Petrov', specialty: 'Cardio & HIIT', memberCount: 21, classesPerDay: 4, status: 'online', initials: 'SP' },
  { id: 't3', name: 'James Nwosu', specialty: 'Powerlifting', memberCount: 9, classesPerDay: 2, status: 'away', initials: 'JN' },
  { id: 't4', name: 'Lena Hofer', specialty: 'Functional fitness', memberCount: 17, classesPerDay: 3, status: 'online', initials: 'LH' },
  { id: 't5', name: 'Ravi Batra', specialty: 'Mobility & recovery', memberCount: 11, classesPerDay: 2, status: 'off', initials: 'RB' },
  { id: 't6', name: 'Anya Volkov', specialty: 'Olympic lifting', memberCount: 8, classesPerDay: 2, status: 'online', initials: 'AV' },
];

export const members: Member[] = [
  { id: 'm1', name: 'Priya Rajan', plan: 'Pro', attendance: 92, goalProgress: 78, trainerId: 't1', status: 'active', joinedDate: 'Jan 2026' },
  { id: 'm2', name: 'Marco Hiller', plan: 'Basic', attendance: 67, goalProgress: 45, trainerId: 't2', status: 'active', joinedDate: 'Feb 2026' },
  { id: 'm3', name: 'Yuki Kato', plan: 'Elite', attendance: 85, goalProgress: 61, trainerId: 't6', status: 'active', joinedDate: 'Feb 2026' },
  { id: 'm4', name: 'Jana Svoboda', plan: 'Pro', attendance: 22, goalProgress: 18, trainerId: 't4', status: 'at-risk', joinedDate: 'Mar 2026' },
];

export const classes: ClassSession[] = [
  { id: 'c1', name: 'Morning HIIT', trainerName: 'Sofia P.', time: '06:00', booked: 18, capacity: 20, color: '#1D9E75' },
  { id: 'c2', name: 'Strength circuit', trainerName: 'Marcus K.', time: '08:30', booked: 12, capacity: 20, color: '#BA7517' },
  { id: 'c3', name: 'Powerlifting 101', trainerName: 'James N.', time: '10:00', booked: 8, capacity: 16, color: '#BA7517' },
  { id: 'c4', name: 'Functional flow', trainerName: 'Lena H.', time: '12:00', booked: 7, capacity: 20, color: '#185FA5' },
  { id: 'c5', name: 'Evening HIIT', trainerName: 'Sofia P.', time: '18:00', booked: 15, capacity: 20, color: '#1D9E75' },
];
