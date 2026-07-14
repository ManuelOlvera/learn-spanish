import type { RemoteProgressStore } from "../domain/sync";
import { mergeProgress, type ProgressSnapshot } from "../domain/transfer";

/**
 * Push this device's progress up, merged into whatever the remote already holds
 * (ADR 004). Called on game complete and on purchases. Loading-then-merging
 * keeps the remote row a converging union, so a device can never overwrite
 * another's rewards. Returns the persisted union — callers apply it locally
 * too, making every push a bidirectional exchange (two devices playing at the
 * same time converge on each action, not only on app-open pulls).
 *
 * Local is a SUPPLIER read after the remote fetch, for the same
 * stale-snapshot-race reason as PullProgressUseCase.
 */
export class PushProgressUseCase {
  constructor(private readonly remote: RemoteProgressStore) {}

  async execute(
    code: string,
    localSnapshot: () => Promise<ProgressSnapshot>,
  ): Promise<ProgressSnapshot> {
    const remote = await this.remote.load(code);
    const local = await localSnapshot();
    const merged = remote === null ? local : mergeProgress(remote, local);
    await this.remote.save(code, merged);
    return merged;
  }
}
