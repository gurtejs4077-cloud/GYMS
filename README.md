# ⌘ GymFlow | Multi-Tenant Gym SaaS

![GymFlow Banner](https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1000)

**GymFlow** is a premium, high-performance platform designed to scale fitness businesses. Built with a unified universal portal, it bridges the gap between Gym Owners, Trainers, and Members through a seamless glassmorphic interface and a robust multi-tenant backend.

## 🚀 Key Modules
- **Owner Command Centre**: Full telemetry for revenue, membership growth, and staff management.
- **Universal Smart Portal**: A single entry point that auto-detects user roles (Member vs. Trainer) via secure clearance codes.
- **Mobile-First Member App**: Real-time attendance tracking, goal progress, and class scheduling.
- **Trainer Duty HUD**: Digital roster management and one-tap member attendance logging.

## 🛠️ Technology Stack
- **Core Engine**: PHP 8.x + SQLite (Optimized for Shared Hosting)
- **Frontend**: "Nebula OS" Design System (Glassmorphism, CSS Variables, Fluid Animations)
- **Mobile Environment**: Capacitor (Native Android APK Wrapper)
- **Legacy Components**: Next.js 15 (App Router) + Prisma ORM

## 📲 Mobile Build Info
The project is pre-configured with **Capacitor**. The Android native source is located in the `/android` directory.
- **Min SDK**: 23 (Android 6.0)
- **Target SDK**: 35 (Android 15)
- **Java Requirements**: OpenJDK 17

## 📂 Project Structure
- `/php_app`: The self-contained production-ready SaaS for shared hosting.
- `/src`: The Next.js prototype and development environment.
- `/android`: Native Android project files.

---
*Created by Antigravity AI for GymFlow SaaS Development.*
