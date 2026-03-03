

# Fogtechnikus Portfólió Weboldal – PWA

## Áttekintés
Egy elegáns, minimalista portfólió weboldal fogtechnikusnak, 3D-s fog modellel ami a görgetésre reagál, világos szürke/kék színvilágban. Telepíthető PWA alkalmazásként.

---

## Szekciók és Funkciók

### 1. Hero szekció
- Nagy, tiszta tipográfia (Inter/Geist betűtípus)
- **3D-s fog modell** a központban, amely a görgetéssel együtt forog és mozog (React Three Fiber)
- Világos szürke-kékes háttér, luxus érzet

### 2. Portfólió / Referenciák
- Masonry elrendezésű képgaléria placeholder képekkel
- Hover effektek Framer Motion animációkkal
- Fogtechnikai munkák bemutatása (placeholder fotókkal)

### 3. Rólam szekció
- Rövid bemutatkozás placeholder szöveggel
- Animált megjelenés görgetéskor

### 4. Kapcsolat szekció
- Elegáns kontakt űrlap (Név, Email, Üzenet)
- **Működő email küldés** Supabase edge function segítségével (Resend integrációval)
- Validáció Zod sémával

---

## Interakciók és Animációk
- **3D scroll-animáció**: A fog modell 360°-ban forog és parallax-szerűen mozog görgetéskor
- **Lenis** inercia-görgetés a sima felhasználói élményért
- **Framer Motion** szekció-megjelenési animációk (fade-in, slide-up)

## Dizájn
- Színek: világos szürke-kék háttér, sötét szöveg, finom kék akcentusok
- Tiszta, orvosi/luxus esztétika
- Reszponzív design mobilra és desktopra

## PWA
- Telepíthető alkalmazásként a telefonra böngészőből
- Offline működés, gyors betöltés
- PWA manifest és service worker konfiguráció

## Technológia
- React Three Fiber (3D jelenet)
- Framer Motion (animációk)
- Lenis (smooth scroll)
- Supabase edge function (email küldés)
- vite-plugin-pwa (PWA támogatás)

