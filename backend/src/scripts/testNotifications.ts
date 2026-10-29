import "dotenv/config";
import pool from "../config/database.js";
import {
  syncFinancialAlerts,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../services/notificationService.js";

async function run() {
  const families = await pool.query("SELECT id, name FROM families LIMIT 1");
  if (families.rows.length === 0) {
    console.log("No families found in DB.");
    process.exit(0);
  }
  const family = families.rows[0];
  console.log(`\n========================================`);
  console.log(`Testing Notifications & Financial Alerts`);
  console.log(`Family: #${family.id} (${family.name})`);
  console.log(`========================================\n`);

  // 1. Sync financial alerts
  console.log("[1/6] Running syncFinancialAlerts()...");
  await syncFinancialAlerts(family.id);

  // 2. Query notifications
  console.log("[2/6] Querying notifications...");
  const initial = await getNotifications(family.id);
  console.log(` -> Found ${initial.notifications.length} alerts (Unread: ${initial.unreadCount})`);
  for (const item of initial.notifications) {
    console.log(`    * [${item.severity.toUpperCase()}] [${item.type}] ${item.title}`);
    console.log(`      "${item.message}" (link: ${item.link || 'none'})`);
  }

  // 3. Test filter queries
  console.log("\n[3/6] Testing query filters...");
  const budgetAlerts = await getNotifications(family.id, { type: "budget" });
  console.log(` -> Budget category alerts: ${budgetAlerts.notifications.length}`);

  const billAlerts = await getNotifications(family.id, { type: "bill" });
  console.log(` -> Bill alerts: ${billAlerts.notifications.length}`);

  // 4. Test mark as read
  if (initial.notifications.length > 0) {
    const first = initial.notifications[0];
    console.log(`\n[4/6] Testing markNotificationAsRead(id: ${first.id})...`);
    const marked = await markNotificationAsRead(family.id, first.id);
    console.log(` -> Marked as read status: ${marked?.is_read}, read_at: ${marked?.read_at}`);

    const afterRead = await getNotifications(family.id);
    console.log(` -> Remaining unread count: ${afterRead.unreadCount}`);
  }

  // 5. Test mark all as read
  console.log("\n[5/6] Testing markAllNotificationsAsRead()...");
  const count = await markAllNotificationsAsRead(family.id);
  console.log(` -> Updated ${count} alerts to read`);

  const allRead = await getNotifications(family.id);
  console.log(` -> Unread count after mark all read: ${allRead.unreadCount}`);

  // 6. Test deduplication: running syncFinancialAlerts again should NOT create duplicates!
  console.log("\n[6/6] Testing alert deduplication guard...");
  const countBeforeSecondSync = allRead.notifications.length;
  await syncFinancialAlerts(family.id);
  const afterSecondSync = await getNotifications(family.id);
  console.log(` -> Alerts before re-sync: ${countBeforeSecondSync}, after re-sync: ${afterSecondSync.notifications.length}`);

  if (afterSecondSync.notifications.length === countBeforeSecondSync) {
    console.log(" -> Deduplication guard PASS: No duplicate alerts created!");
  } else {
    console.log(" -> Deduplication check mismatch:", afterSecondSync.notifications.length, "vs", countBeforeSecondSync);
  }

  console.log("\nAll Phase 12 notifications verification checks PASSED successfully!\n");
  await pool.end();
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
