import type { RemoteProgressStore } from "../domain/sync";

/**
 * Delete the cloud row for a pairing code (ADR 004 follow-up). The capability
 * model is unchanged — knowing the code is the only authorization — so a family
 * that stops syncing can also remove its data, not just abandon the row.
 * Deleting is idempotent; devices keep their local progress untouched.
 */
export class DeleteProgressUseCase {
  constructor(private readonly remote: RemoteProgressStore) {}

  async execute(code: string): Promise<void> {
    await this.remote.delete(code);
  }
}
