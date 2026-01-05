// Watcher process manager - spawns and monitors the watcher script
// All code in desktop-ui folder

import { spawn, ChildProcess } from "child_process";
import { join } from "path";
import { existsSync } from "fs";
import { addLog } from "./logger";

let watcherProcess: ChildProcess | null = null;
let isRunning = false;

export function startWatcher(): { success: boolean; message: string } {
  if (isRunning && watcherProcess) {
    return { success: false, message: "Watcher is already running" };
  }

  try {
    // Determine project root more reliably
    // When running through Electron, __dirname will be the desktop-ui folder
    // When running through tsx/node, __dirname will be the compiled location
    let projectRoot: string;

    // Method 1: Check if __dirname contains desktop-ui
    if (typeof __dirname !== "undefined" && __dirname.endsWith("desktop-ui")) {
      projectRoot = join(__dirname, "..");
      addLog("info", `Detected project root from __dirname: ${projectRoot}`);
    }
    // Method 2: Check if current directory has package.json
    else if (existsSync(join(process.cwd(), "package.json"))) {
      projectRoot = process.cwd();
      addLog("info", `Using cwd as project root: ${projectRoot}`);
    }
    // Method 3: Try parent of __dirname
    else if (typeof __dirname !== "undefined") {
      const parent = join(__dirname, "..");
      if (existsSync(join(parent, "package.json"))) {
        projectRoot = parent;
        addLog("info", `Using parent of __dirname: ${projectRoot}`);
      } else {
        projectRoot = process.cwd();
        addLog("warning", `Falling back to cwd: ${projectRoot}`);
      }
    }
    // Method 4: Last resort fallback
    else {
      projectRoot = process.cwd();
      addLog("warning", `Using fallback cwd: ${projectRoot}`);
    }

    const watcherScript = join(projectRoot, "src", "index.ts");

    // Verify the script exists
    if (!existsSync(watcherScript)) {
      const errorMsg = `❌ Watcher script not found at: ${watcherScript}\n📁 Project root: ${projectRoot}\n💡 Make sure you're running from the project root directory.`;
      addLog("error", errorMsg);
      return { success: false, message: errorMsg };
    }

    // Check if tsx is available
    const tsxCheck = join(projectRoot, "node_modules", ".bin", "tsx");
    if (!existsSync(tsxCheck) && !existsSync(tsxCheck + ".cmd")) {
      const errorMsg = `❌ tsx not found. Run 'npm install' in the project directory first.`;
      addLog("error", errorMsg);
      return { success: false, message: errorMsg };
    }

    addLog("info", `Starting watcher from: ${projectRoot}`);
    addLog("info", `Script path: ${watcherScript}`);

    // Spawn the watcher process using tsx
    // Use npx with shell: true for better cross-platform compatibility
    watcherProcess = spawn("npx", ["tsx", watcherScript], {
      cwd: projectRoot,
      shell: true, // Required for Windows, helps with PATH resolution
      stdio: ["ignore", "pipe", "pipe"], // stdin: ignore, stdout/stderr: pipe
      env: { ...process.env } // Pass through environment variables (including PATH)
    });

    // Handle process errors (fires if spawn fails - e.g., command not found)
    watcherProcess.on("error", (error) => {
      isRunning = false;
      watcherProcess = null;
      const errorMsg = `❌ Failed to spawn watcher: ${error.message}\n💡 Make sure 'tsx' is installed (run 'npm install')`;
      addLog("error", errorMsg);
      console.error("Spawn error details:", error);
    });

    // Set running state AFTER setting up error handler
    isRunning = true;
    addLog("success", "✅ Watcher process starting...");

    // Capture stdout (normal logs)
    watcherProcess.stdout?.on("data", (data: Buffer) => {
      const output = data.toString().trim();
      if (output) {
        // Parse and log each line
        const lines = output.split("\n").filter((line) => line.trim());
        lines.forEach((line) => {
          // Determine log level based on content
          let level: "info" | "success" | "warning" | "error" = "info";
          
          if (line.includes("✅") || line.includes("success") || line.toLowerCase().includes("sent")) {
            level = "success";
          } else if (line.includes("⚠️") || line.toLowerCase().includes("warning")) {
            level = "warning";
          } else if (line.includes("❌") || line.toLowerCase().includes("error") || line.toLowerCase().includes("failed")) {
            level = "error";
          } else if (line.includes("[poll]") || line.includes("fetched")) {
            level = "info";
          }
          
          // Remove emoji prefixes if present, we'll add our own
          const cleanLine = line.replace(/[✅❌⚠️ℹ️]/g, "").trim();
          addLog(level, cleanLine);
        });
      }
    });

    // Capture stderr (error logs)
    watcherProcess.stderr?.on("data", (data: Buffer) => {
      const output = data.toString().trim();
      if (output) {
        const lines = output.split("\n").filter((line) => line.trim());
        lines.forEach((line) => {
          addLog("error", line);
        });
      }
    });

    // Handle process exit
    watcherProcess.on("exit", (code, signal) => {
      isRunning = false;
      watcherProcess = null;

      if (code === 0) {
        addLog("info", "✅ Watcher stopped normally");
      } else if (signal) {
        addLog("warning", `⚠️ Watcher stopped by signal: ${signal}`);
      } else if (code !== null) {
        addLog("error", `❌ Watcher exited with code: ${code}\n💡 Common issues:\n  • Missing environment variables (DISCORD_WEBHOOK_URL)\n  • Network connectivity problems\n  • Invalid configuration\n  • Check console for detailed error messages`);
      }
    });

    return { success: true, message: "Watcher started successfully" };
  } catch (error: any) {
    isRunning = false;
    watcherProcess = null;
    return { success: false, message: `Failed to start watcher: ${error.message}` };
  }
}

export function stopWatcher(): { success: boolean; message: string } {
  if (!isRunning || !watcherProcess) {
    return { success: false, message: "Watcher is not running" };
  }

  try {
    watcherProcess.kill("SIGTERM");
    addLog("info", "Stopping watcher...");
    
    // Force kill after 5 seconds if it doesn't stop gracefully
    setTimeout(() => {
      if (watcherProcess && isRunning) {
        watcherProcess.kill("SIGKILL");
        addLog("warning", "Watcher force stopped");
      }
    }, 5000);

    return { success: true, message: "Watcher stop requested" };
  } catch (error: any) {
    return { success: false, message: `Failed to stop watcher: ${error.message}` };
  }
}

export function getWatcherStatus(): { isRunning: boolean } {
  return { isRunning };
}
