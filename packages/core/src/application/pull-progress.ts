import type { RemoteProgressStore } from "../domain/sync";
import { mergeProgress, type ProgressSnapshot } from "../domain/transfer";

/**
 * Pull the latest remote progress and merge it into this device (ADR 004).
 * Read-only — called on app open so reads stay instant; the merge is additive,
 * so nothing local is ever lost. Returns the snapshot the caller should apply.
 *
 * The local snapshot arrives as a SUPPLIER, read only after the remote row
 * lands: the network wait is exactly the window a concurrent local action
 * (a chest claim, a purchase) would otherwise fall into — merging against a
 * pre-fetch snapshot let the later apply roll that action back.
 */
export class PullProgressUseCase {
  constructor(private readonly remote: RemoteProgressStore) {}

  async execute(
    code: string,
    localSnapshot: () => Promise<ProgressSnapshot>,
  ): Promise<ProgressSnapshot> {
    const remote = await this.remote.load(code);
    const local = await localSnapshot();
    return remote === null ? local : mergeProgress(local, remote);
  }
}
