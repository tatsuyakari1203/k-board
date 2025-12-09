import "dotenv/config";
import axios, { AxiosInstance, AxiosResponse } from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";

const BASE_URL = "http://localhost:3000";

// Colors for console
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const RESET = "\x1b[0m";

// Minimal Interfaces for Test Data
interface Board {
  _id: string;
  name: string;
  role?: string;
  properties: Property[];
}

interface Property {
  id: string;
  type: string;
  name: string;
  options?: { id: string; label: string }[];
}

// Helper to create a session-persistent client
function createClient() {
  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      baseURL: BASE_URL,
      jar,
      validateStatus: () => true, // Don't throw on error status
    })
  );
  return { client, jar };
}

async function login(client: AxiosInstance, email: string) {
  process.stdout.write(`🔑 Logging in as ${YELLOW}${email}${RESET}... `);
  const res = await client.post("/api/test/login", { email });
  if (res.status === 200) {
    console.log(`${GREEN}✓ OK${RESET}`);
    return true;
  } else {
    console.log(`${RED}✗ FAILED: ${res.status}${RESET}`);
    return false;
  }
}

async function check(
  name: string,
  promise: Promise<AxiosResponse>,
  expectedStatus: number | number[]
) {
  process.stdout.write(`   👉 ${name}... `);
  try {
    const res = await promise;
    const isExpected = Array.isArray(expectedStatus)
      ? expectedStatus.includes(res.status)
      : res.status === expectedStatus;

    if (isExpected) {
      console.log(`${GREEN}PASS (${res.status})${RESET}`);
      return res;
    } else {
      console.log(`${RED}FAIL (Expected ${expectedStatus}, got ${res.status})${RESET}`);
      console.log("      Response:", JSON.stringify(res.data, null, 2));
      return res;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`${RED}ERROR: ${message}${RESET}`);
    return { status: 500, data: message } as AxiosResponse;
  }
}

// Cleanup helper
async function cleanup() {
  console.log(`\n${YELLOW}🧹 CLEANING UP TEST DATA...${RESET}`);
  const { client: admin } = createClient();

  let adminEmail = "admin@k-erp.com";
  // Try login
  if (!(await login(admin, adminEmail))) {
    console.log(
      `${YELLOW}   ⚠ 'admin@k-erp.com' not found, trying 'tatsuyakari@gmail.com'...${RESET}`
    );
    adminEmail = "tatsuyakari@gmail.com";
    if (!(await login(admin, adminEmail))) {
      console.log(`${RED}   ❌ Could not login as any admin. Cleanup skipped.${RESET}`);
      return;
    }
  }

  if (true) {
    // Already logged in check
    const boardsRes = await admin.get("/api/boards");
    const boards = (
      Array.isArray(boardsRes.data) ? boardsRes.data : boardsRes.data.boards
    ) as Board[];

    // 1. Cleanup Test Boards
    const testBoardNames = ["Workflow Test Board", "Workflow Active"];
    for (const name of testBoardNames) {
      const b = boards?.find((board) => board.name === name);
      if (b) {
        process.stdout.write(`   Deleting leftover board '${name}'... `);
        await admin.delete(`/api/boards/${b._id}`);
        console.log(`${GREEN}OK${RESET}`);
      }
    }

    // 2. Cleanup Test Tasks in "Công việc nội bộ"
    const targetBoard = boards?.find((b) => b.name === "Công việc nội bộ");
    if (targetBoard) {
      const tasksRes = await admin.get(`/api/boards/${targetBoard._id}/tasks`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tasks = tasksRes.data as any[];
      const testTask = tasks?.find((t) => t.title.startsWith("API Task"));
      if (testTask) {
        process.stdout.write(`   Deleting leftover task '${testTask.title}'... `);
        await admin.delete(`/api/boards/${targetBoard._id}/tasks/${testTask._id}`);
        console.log(`${GREEN}OK${RESET}`);
      }
    }
  }
  console.log(`${GREEN}✨ Cleanup complete.${RESET}\n`);
}

async function runTests() {
  console.log("🚀 STARTING COMPREHENSIVE API & WORKFLOW TESTS");
  console.log("=================================================");

  // Run cleanup before starting to ensure clean slate
  await cleanup();

  try {
    // ==========================================
    // SCENARIO 1: BOARD LIFECYCLE (Manager)
    // Create -> Update -> Delete
    // ==========================================
    console.log(`\n${BLUE}▶ SCENARIO 1: MANAGER BOARD LIFECYCLE${RESET}`);
    const { client: manager } = createClient();

    if (await login(manager, "manager@k-erp.com")) {
      // 1. Create Board
      const createRes = await check(
        "Create 'Workflow Test Board'",
        manager.post("/api/boards", { name: "Workflow Test Board", visibility: "workspace" }),
        201
      );

      if (createRes.status === 201) {
        const boardId = createRes.data._id;

        try {
          // 2. Update Board
          await check(
            "Rename Board to 'Workflow Active'",
            manager.patch(`/api/boards/${boardId}`, {
              name: "Workflow Active",
              description: "Updated via API",
            }),
            200
          );

          // Verify Update
          const getRes = await check(
            "Get Board Details",
            manager.get(`/api/boards/${boardId}`),
            200
          );
          if (getRes.data.name !== "Workflow Active") {
            console.log(`${RED}      ❌ Name mismatch! Got: ${getRes.data.name}${RESET}`);
          }

          // 3. Delete Board
          await check("Delete Board", manager.delete(`/api/boards/${boardId}`), 200);

          // Verify Deletion (404 Not Found OR 403 Forbidden if access check fails first)
          await check("Verify Board is Gone", manager.get(`/api/boards/${boardId}`), [403, 404]);
        } catch (_e) {
          console.log(`${RED}   ⚠ Error during Scenario 1 execution.${RESET}`);
        }
      }
    }

    // ==========================================
    // SCENARIO 2: TASK WORKFLOW (Staff - Editor)
    // Create -> Update -> Reorder -> Delete
    // Target: "Công việc nội bộ" (Assuming it exists from seed)
    // ==========================================
    console.log(`\n${BLUE}▶ SCENARIO 2: STAFF TASK WORKFLOW${RESET}`);
    const { client: staff } = createClient();

    if (await login(staff, "staff@k-erp.com")) {
      // Find target board
      const boardsRes = await staff.get("/api/boards");
      const boards = (
        Array.isArray(boardsRes.data) ? boardsRes.data : boardsRes.data.boards
      ) as Board[];
      const targetBoard = boards?.find((b: Board) => b.name === "Công việc nội bộ");

      if (!targetBoard) {
        console.log(
          `${RED}   ❌ Could not find 'Công việc nội bộ' board. Skipping task tests.${RESET}`
        );
      } else {
        const boardId = targetBoard._id;
        console.log(`   Target Board: ${targetBoard.name} (${boardId})`);

        // Need to find a "Status" property to use
        const boardDetail = await staff.get(`/api/boards/${boardId}`);
        const properties = boardDetail.data.properties as Property[];
        const statusProp = properties.find((p) => p.type === "status");
        const statusOptions = statusProp ? statusProp.options : [];
        const firstStatus = statusOptions?.[0]?.id;
        const secondStatus = statusOptions?.[1]?.id;

        if (!statusProp || !firstStatus) {
          console.log(
            `${RED}   ❌ No Status property found on board or first status option missing.${RESET}`
          );
        } else {
          // 1. Create Task
          const taskRes = await check(
            "Create Task 'API Task'",
            staff.post(`/api/boards/${boardId}/tasks`, {
              title: "API Task",
              properties: { [statusProp.id]: firstStatus },
            }),
            201
          );

          if (taskRes.status === 201) {
            const taskId = taskRes.data._id;

            try {
              // 2. Update Task (Move column + Rename)
              await check(
                "Update Task (Rename + Move Status)",
                staff.patch(`/api/boards/${boardId}/tasks/${taskId}`, {
                  title: "API Task (Updated)",
                  properties: { [statusProp.id]: secondStatus },
                }),
                200
              );

              // 3. Reorder (Mock reorder with self)
              await check(
                "Reorder Task",
                staff.post(`/api/boards/${boardId}/tasks/reorder`, { taskIds: [taskId] }),
                200
              );

              // 4. Delete Task
              await check(
                "Delete Task",
                staff.delete(`/api/boards/${boardId}/tasks/${taskId}`),
                200
              );
            } catch (_e) {
              console.log(`${RED}   ⚠ Error during Scenario 2 execution.${RESET}`);
            }
          }
        }
      }
    }

    // ==========================================
    // SCENARIO 3: SECURITY REGRESSION (User - Viewer?)
    // User should NOT be able to modify public boards if they are just Viewers
    // Note: "Công việc nội bộ" is Workspace visible. If User is not in members, they are Viewer.
    // ==========================================
    console.log(`\n${BLUE}▶ SCENARIO 3: SECURITY REGRESSION (USER/VIEWER)${RESET}`);
    const { client: user } = createClient();

    if (await login(user, "user@k-erp.com")) {
      // Find "Công việc nội bộ"
      const boardsRes = await user.get("/api/boards");
      const boards = (
        Array.isArray(boardsRes.data) ? boardsRes.data : boardsRes.data.boards
      ) as Board[];
      const targetBoard = boards?.find((b: Board) => b.name === "Công việc nội bộ");

      if (targetBoard) {
        // Verify role is Viewer
        if (targetBoard.role !== "viewer") {
          console.log(
            `${YELLOW}   ⚠ User role is ${targetBoard.role}, expected viewer. Adjusting expectations might be needed if Seed changed.${RESET}`
          );
        }

        // Try Create Task -> Expect 403
        await check(
          "User try Create Task (Should Fail)",
          user.post(`/api/boards/${targetBoard._id}/tasks`, { title: "Hacker Task" }),
          403
        );

        // Try Delete Board -> Expect 403
        await check(
          "User try Delete Board (Should Fail)",
          user.delete(`/api/boards/${targetBoard._id}`),
          403
        );
      } else {
        console.log(`${RED}   ❌ User cannot see 'Công việc nội bộ' board.${RESET}`);
      }
    }
  } finally {
    // Run cleanup after tests (even if they fail)
    await cleanup();
    console.log("\n=================================================");
    console.log("🏁 ALL TESTS COMPLETED");
  }
}

runTests();
