# Smart Office Hub - Setup Guide

## Prerequisites

1. **Node.js** install karo: https://nodejs.org (LTS version)
2. **Git** install karo: https://git-scm.com

## Setup Steps

### 1. Clone the repo
```bash
git clone https://github.com/MuhammadSaqibIslam/SMART-OFFICE-HUB.git
cd SMART-OFFICE-HUB
```

### 2. Install dependencies
```bash
npm install
```

### 3. `.env` file banao
Project root (`SMART-OFFICE-HUB/`) mein `.env` naam ki file banao aur yeh paste karo:

```
VITE_SUPABASE_URL=https://lblqxmntjknjiqobzyvc.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_KT7h8_p2hCPsf-lspkrakw_F9oJiobk
```

### 4. Dev server chalao
```bash
npm run dev
```

Browser mein `http://localhost:5173/` khulega.

## Login
- **Email:** msaqibislam4040@gmail.com
- **Password:** jo signup ke waqt set kiya tha

## Notes
- Database Supabase cloud pe hai, dono laptops se same data access hoga
- `.env` file Git mein nahi jaati, har naye system pe manually banana padegi
- Agar port 5173 busy ho toh Vite khud next port de dega (5174, 5175...)
