import type { RemoteProgressStore } from "../domain/sync";
import { mergeProgress, type ProgressSnapshot } from "../domain/transfer";

/**
 * Pull the latest remote progress and merge it into this device (ADR 004).
 * Read-only — called on app open so reads stay instant; the merge is additive,
 * so nothing local is ever lost. Returns the snapshot the caller should apply.
 */
export class PullProgressUseCase {
  constructor(private readonly remote: RemoteProgressStore) {}

  async execute(
    code: string,
    local: ProgressSnapshot,
  ): Promise<ProgressSnapshot> {
    const remote = await this.remote.load(code);
    return remote === null ? local : mergeProgress(local, remote);
  }
}
