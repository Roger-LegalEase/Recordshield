import { prisma } from "@/lib/prisma";
import {
  reconcileRecordShieldReviews,
  type ReconciliationDatabase
} from "@/lib/recordshield/reconciliation";

async function main() {
  const result = await reconcileRecordShieldReviews(prisma as unknown as ReconciliationDatabase, {
    log: (action) => {
      console.log(JSON.stringify({
        type: action.type,
        caseId: action.caseId,
        orderId: action.orderId,
        email: action.email ? "[redacted-email]" : undefined,
        metadata: action.metadata
      }));
    }
  });

  console.log(JSON.stringify({ reconciledActions: result.actions.length }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Reconciliation failed");
  process.exit(1);
});
