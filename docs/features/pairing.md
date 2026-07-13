# Pairing Palabras across devices

A parent-facing how-to for cross-device sync (ADR 004). Goal: every device shows
the same up-to-date progress — stickers, stars, streaks, pets, freezes.

## Do it once per device

1. On the device that **already has the progress** (e.g. the tablet):
   - Tap **🔄 Progreso entre dispositivos** (bottom of the album).
   - **☁️ Sincronizar entre dispositivos** → **Crear código de sincronización**.
   - A code appears, like `V3DB3-5RMVJ-B4A9A-TCGRT`.
2. On the **other** device (phone, second tablet):
   - Same menu → paste/type the code in **"¿Tienes un código?"** → **Conectar**.
3. Repeat step 2 on any additional device using the **same** code.

## After pairing (automatic)

- Opening the app **pulls** the latest; finishing a game **pushes** the new state.
- Merges are **additive** — playing offline on two devices never loses anything:
  stickers union, stars/streaks/freezes take the higher value.
- Works offline; a device syncs on its next open.

## Good to know

- One code = one shared family progress. Keep using the **same** code for new
  devices.
- **The code is the key.** Anyone who has it can see and change the family's
  progress — treat it like a house key: fine on a note at home, don't post or
  message it publicly.
- **Theme** and **which kid is selected** stay per-device on purpose (not synced).
- **No account = no recovery.** The code is the only key. If you lose every
  paired device *and* the code, that cloud progress can't be recovered — jot the
  code somewhere, or keep at least one device paired.
- To stop syncing a device: same menu → **Dejar de sincronizar** (its local
  progress stays intact).
- To also remove the family's progress from the cloud: **Borrar el progreso en
  la nube** (tap twice to confirm). Every device keeps its own local progress;
  a device still paired would re-create the cloud copy on its next game.
- Fallback without sync: the one-time **Copia única** code in the same panel
  copies progress to another device once (it then drifts — use sync to stay in
  step).

## Ops / setup

Enabling sync for a deployment (Supabase project, migration, Vercel env vars) is
documented in [`../runbooks.md`](../runbooks.md); the decision record is
[`../adr/004-optional-supabase-sync.md`](../adr/004-optional-supabase-sync.md).
