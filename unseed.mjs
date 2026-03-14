/**
 * FrontPage Unseed Script
 * -----------------------
 * Removes ALL seed data created by seed.mjs.
 * Identifies seed users by the SEED_ prefix on their auth email.
 * Your real account and any real data is untouched.
 *
 * Usage: node unseed.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cqumdbedmcyxgrwlygii.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdW1kYmVkbWN5eGdyd2x5Z2lpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI1NDk5NiwiZXhwIjoyMDg4ODMwOTk2fQ.6XSxc6pZ6w-ejBM-NcY9JOpKMbS-NK4cpymlPoDo5gU";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function getAllUsers() {
  let allUsers = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) { console.error("Failed to list users:", error.message); break; }
    if (!users || users.length === 0) break;
    allUsers = allUsers.concat(users);
    if (users.length < perPage) break;
    page++;
  }

  return allUsers;
}

async function unseed() {
  console.log("🧹 Starting unseed...\n");

  // 1. Find all seed auth users by email prefix
  console.log("🔍 Finding seed users...");
  const allUsers = await getAllUsers();
  const seedUsers = allUsers.filter((u) => u.email?.startsWith("seed_"));
  const seedIds = seedUsers.map((u) => u.id);
  console.log(`  Found ${seedUsers.length} seed users`);

  if (seedIds.length === 0) {
    console.log("  No seed users found — nothing to remove.");
    return;
  }

  // 2. Find seed posts
  console.log("\n📄 Removing posts...");
  const { data: seedPosts } = await supabase
    .from("posts")
    .select("id")
    .in("author_id", seedIds);

  const seedPostIds = seedPosts?.map((p) => p.id) ?? [];

  if (seedPostIds.length > 0) {
    await supabase.from("comments").delete().in("post_id", seedPostIds);
    await supabase.from("likes").delete().in("post_id", seedPostIds);
    await supabase.from("notifications").delete().in("post_id", seedPostIds);
    await supabase.from("reading_list").delete().in("post_id", seedPostIds);
    await supabase.from("restacks").delete().in("post_id", seedPostIds);
    const { error } = await supabase.from("posts").delete().in("author_id", seedIds);
    if (error) console.error("  ✗ Posts:", error.message);
    else console.log(`  ✓ ${seedPostIds.length} posts removed`);
  }

  // 3. Likes by seed users
  console.log("\n❤️  Removing likes by seed users...");
  const { error: likesErr } = await supabase.from("likes").delete().in("user_id", seedIds);
  if (likesErr) console.error("  ✗", likesErr.message);
  else console.log("  ✓ Done");

  // 4. Comments by seed users
  console.log("\n💬 Removing comments by seed users...");
  const { error: commentsErr } = await supabase.from("comments").delete().in("user_id", seedIds);
  if (commentsErr) console.error("  ✗", commentsErr.message);
  else console.log("  ✓ Done");

  // 5. Subscriptions
  console.log("\n📬 Removing subscriptions...");
  await supabase.from("subscriptions").delete().in("subscriber_id", seedIds);
  await supabase.from("subscriptions").delete().in("author_id", seedIds);
  console.log("  ✓ Done");

  // 6. Notifications
  console.log("\n🔔 Removing notifications...");
  await supabase.from("notifications").delete().in("actor_id", seedIds);
  await supabase.from("notifications").delete().in("recipient_id", seedIds);
  console.log("  ✓ Done");

  // 7. Notes by seed users
  console.log("\n📝 Removing notes...");
  await supabase.from("notes").delete().in("author_id", seedIds);
  console.log("  ✓ Done");

  // 8. Restacks by seed users
  console.log("\n🔁 Removing restacks...");
  await supabase.from("restacks").delete().in("user_id", seedIds);
  console.log("  ✓ Done");

  // 9. Profiles
  console.log("\n👤 Removing profiles...");
  const { error: profilesErr } = await supabase.from("profiles").delete().in("id", seedIds);
  if (profilesErr) console.error("  ✗", profilesErr.message);
  else console.log(`  ✓ ${seedIds.length} profiles removed`);

  // 10. Auth users
  console.log("\n🔐 Removing auth users...");
  let deleted = 0;
  for (const user of seedUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) console.error(`  ✗ ${user.email}:`, error.message);
    else deleted++;
  }
  console.log(`  ✓ ${deleted} auth users removed`);

  console.log("\n✅ Unseed complete! Database is back to its pre-seed state.");
}

unseed().catch(console.error);