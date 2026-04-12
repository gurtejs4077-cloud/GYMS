'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// AUTHENTICATION

export async function registerGym(data: FormData) {
  const email = data.get('email') as string;
  const password = data.get('password') as string; // in prod, hash this!
  const gymName = data.get('gymName') as string;

  const existing = await prisma.gym.findUnique({ where: { email } });
  if (existing) return { error: 'Email already in use' };

  const gym = await prisma.gym.create({
    data: {
      email,
      password,
      name: gymName,
      brandColor: '#e94560',
      classesVisible: false
    }
  });
  
  return { success: true, gymId: gym.id };
}

export async function loginGym(data: FormData) {
  const email = data.get('email') as string;
  const password = data.get('password') as string;

  const gym = await prisma.gym.findUnique({ where: { email } });
  if (!gym || gym.password !== password) return { error: 'Invalid credentials' };

  return { success: true, gymId: gym.id };
}

// Queries scoped to the LOGGED IN GYM
export async function getGymSettings(gymId: string) {
  return await prisma.gym.findUnique({ where: { id: gymId } });
}

export async function getMembers(gymId: string) {
  return await prisma.member.findMany({ 
    where: { gymId },
    orderBy: { createdAt: 'desc' } 
  });
}

export async function getTrainers(gymId: string) {
  return await prisma.trainer.findMany({ 
    where: { gymId },
    orderBy: { createdAt: 'desc' } 
  });
}

export async function getClasses() {
  // Returning a static placeholder for now
  return [
    { id: 'c1', name: 'Morning HIIT', trainerName: 'Sofia P.', time: '06:00', booked: 18, capacity: 20, color: '#1D9E75' },
    { id: 'c2', name: 'Strength circuit', trainerName: 'Marcus K.', time: '08:30', booked: 12, capacity: 20, color: '#BA7517' },
  ];
}

// Mutations mapped to the LOGGED IN GYM
export async function onboardGym(gymId: string, data: FormData) {
  const gymName = data.get('gymName') as string;
  const ownerName = data.get('ownerName') as string;
  const phone = data.get('phone') as string;
  const location = data.get('location') as string;

  await prisma.gym.update({
    where: { id: gymId },
    data: {
      name: gymName,
      ownerName,
      phone,
      location,
    }
  });
  revalidatePath('/owner');
}

export async function updateGymSettings(gymId: string, data: { name?: string, location?: string, brandColor?: string, classesVisible?: boolean }) {
  await prisma.gym.update({
    where: { id: gymId },
    data
  });
  revalidatePath('/owner');
  revalidatePath('/member');
}

export async function addMember(gymId: string, data: FormData) {
  const name = data.get('name') as string;
  const plan = data.get('plan') as string;
  const accessCode = Math.floor(1000 + Math.random() * 9000).toString();
  await prisma.member.create({
    data: {
      name,
      plan,
      joinedDate: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      gymId,
      accessCode
    }
  });
  revalidatePath('/owner');
  return accessCode;
}

export async function removeMember(gymId: string, id: string) {
  await prisma.member.delete({
    where: { id, gymId }
  });
  revalidatePath('/owner');
}

export async function addTrainer(gymId: string, data: FormData) {
  const name = data.get('name') as string;
  const specialty = data.get('specialty') as string;
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const accessCode = Math.floor(1000 + Math.random() * 9000).toString();
  await prisma.trainer.create({
    data: {
      name,
      specialty,
      initials,
      gymId,
      accessCode
    }
  });
  revalidatePath('/owner');
  return accessCode;
}

export async function verifyAccessCode(code: string) {
  // We search globally for this code, because the user doesn't know their gymId yet!
  const member = await prisma.member.findFirst({ where: { accessCode: code } });
  if (member) return { type: 'member', id: member.id, name: member.name, gymId: member.gymId };
  
  const trainer = await prisma.trainer.findFirst({ where: { accessCode: code } });
  if (trainer) return { type: 'trainer', id: trainer.id, name: trainer.name, gymId: trainer.gymId };

  return null;
}
