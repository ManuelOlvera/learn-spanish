import type { RemoteProgressStore } from "../domain/sync";
import { mergeProgress, type ProgressSnapshot } from "../domain/transfer";

/**
 * Push this device's progress up, merged into whatever the remote already holds
 * (ADR 004). Called on game complete. Loading-then-merging keeps the remote row
 * a converging union, so a device can never overwrite another's rewards.
 * Returns the persisted union.
 */
export class PushProgressUseCase {
  constructor(private readonly remote: RemoteProgressStore) {}

  async execute(
    code: string,
    local: ProgressSnapshot,
  ): Promise<ProgressSnapshot> {
    const remote = await this.remote.load(code);
    const merged = remote === null ? local : mergeProgress(remote, local);
    await this.remote.save(code, merged);
    return merged;
  }
}
