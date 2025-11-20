import { NextRequest } from 'next/server';
import { spawn, execSync } from 'child_process';
import { writeFileSync, mkdirSync, unlinkSync, rmdirSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import JSZip from 'jszip';
import { platform } from 'os';

interface FileItem {
  name: string;
  content: string;
}

interface RunCodeRequest {
  files: FileItem[];
  stdinInputs?: string[]; // Array of stdin inputs to send sequentially
}

// Detect available C++ compiler
function detectCompiler(): string | null {
  const isWindows = platform() === 'win32';
  const compilers = isWindows 
    ? ['g++.exe', 'gcc.exe', 'clang++.exe', 'cl.exe']
    : ['g++', 'gcc', 'clang++', 'clang'];
  
  for (const compiler of compilers) {
    try {
      execSync(`${compiler} --version`, { stdio: 'ignore', timeout: 2000 });
      return compiler;
    } catch (error) {
      // Compiler not found, try next
      continue;
    }
  }
  
  return null;
}

// Store active processes by session ID
const activeProcesses = new Map<string, {
  process: any;
  stdinQueue: string[];
  currentStdinIndex: number;
  tempDir: string;
  stdinRequestSent: boolean;
  controller: ReadableStreamDefaultController<Uint8Array>;
}>();

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // Generate a unique session ID
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const body: RunCodeRequest = await request.json();
        const { files, stdinInputs = [] } = body;

        if (!files || !Array.isArray(files) || files.length === 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'At least one file is required' })}\n\n`)
          );
          controller.close();
          return;
        }

        // Find main.cpp file
        let mainFile = files.find(f => f.name === 'main.cpp');
        if (!mainFile) {
          mainFile = files.find(f => f.name.endsWith('.cpp'));
        }
        if (!mainFile) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'No C++ file found' })}\n\n`)
          );
          controller.close();
          return;
        }

        // Create temporary directory
        const tempDir = join(tmpdir(), `cpp_exec_${sessionId}`);
        mkdirSync(tempDir, { recursive: true });

        // Write all files to temp directory
        for (const file of files) {
          const filePath = join(tempDir, file.name);
          writeFileSync(filePath, file.content, 'utf-8');
        }

        // Detect available compiler
        const compiler = detectCompiler();
        if (!compiler) {
          // No local compiler available - use Judge0 fallback
          // But we can't do true interactive execution, so we need to ask for all inputs upfront
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              error: 'LOCAL_COMPILER_NOT_AVAILABLE',
              message: 'No local compiler found. Please provide all inputs upfront, then the program will run on Judge0.'
            })}\n\n`)
          );
          controller.close();
          return;
        }

        // Determine executable name based on platform
        const isWindows = platform() === 'win32';
        const executableName = isWindows ? 'a.exe' : 'a.out';
        const executablePath = join(tempDir, executableName);

        // Build compiler arguments
        const compilerArgs: string[] = [];
        if (compiler.includes('g++') || compiler.includes('gcc')) {
          compilerArgs.push('-std=c++17', '-o', executablePath, join(tempDir, mainFile.name));
        } else if (compiler.includes('clang')) {
          compilerArgs.push('-std=c++17', '-o', executablePath, join(tempDir, mainFile.name));
        } else if (compiler.includes('cl.exe')) {
          // MSVC compiler
          compilerArgs.push('/std:c++17', `/Fe:${executablePath}`, join(tempDir, mainFile.name));
        } else {
          compilerArgs.push('-std=c++17', '-o', executablePath, join(tempDir, mainFile.name));
        }

        // Compile the code
        const compileProcess = spawn(compiler, compilerArgs, {
          cwd: tempDir,
          shell: isWindows // Use shell on Windows for better path resolution
        });

        let compileError = '';
        compileProcess.stderr.on('data', (data) => {
          compileError += data.toString();
        });

        await new Promise<void>((resolve, reject) => {
          compileProcess.on('close', (code) => {
            if (code !== 0) {
              reject(new Error(`Compilation failed: ${compileError}`));
            } else {
              resolve();
            }
          });
          compileProcess.on('error', (err) => {
            reject(new Error(`Failed to start compiler: ${err.message}`));
          });
        });

        // Send compilation success message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Compilation successful' })}\n\n`)
        );

        // Run the executable
        const runProcess = spawn(executablePath, [], {
          cwd: tempDir,
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: isWindows // Use shell on Windows for better execution
        });

        // Store process info
        activeProcesses.set(sessionId, {
          process: runProcess,
          stdinQueue: [...stdinInputs],
          currentStdinIndex: 0,
          tempDir,
          stdinRequestSent: false,
          controller
        });

        // Send session ID to frontend
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'session', sessionId })}\n\n`)
        );

        // Immediately check if process needs input (for programs that start with cin)
        setTimeout(() => {
          const procInfo = activeProcesses.get(sessionId);
          if (procInfo && !runProcess.killed && runProcess.exitCode === null && !procInfo.stdinRequestSent) {
            procInfo.stdinRequestSent = true;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'stdin_request', sessionId })}\n\n`)
            );
          }
        }, 300);

        let stdoutBuffer = '';
        let stderrBuffer = '';

        // Handle stdout
        runProcess.stdout.on('data', (data: Buffer) => {
          const output = data.toString();
          stdoutBuffer += output;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'stdout', content: output })}\n\n`)
          );
          
          // After output, program might be waiting for input
          // Check if process is still running and waiting after a delay
          setTimeout(() => {
            const procInfo = activeProcesses.get(sessionId);
            if (procInfo && !runProcess.killed && runProcess.exitCode === null && !procInfo.stdinRequestSent) {
              // Process is likely waiting for input
              procInfo.stdinRequestSent = true;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'stdin_request', sessionId })}\n\n`)
              );
            }
          }, 200);
        });

        // Handle stderr
        runProcess.stderr.on('data', (data: Buffer) => {
          const output = data.toString();
          stderrBuffer += output;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'stderr', content: output })}\n\n`)
          );
        });

        // Handle process exit
        runProcess.on('close', (code) => {
          // Cleanup
          try {
            if (existsSync(executablePath)) {
              unlinkSync(executablePath);
            }
            // Clean up other files
            for (const file of files) {
              const filePath = join(tempDir, file.name);
              if (existsSync(filePath)) {
                unlinkSync(filePath);
              }
            }
            // Remove temp directory
            if (existsSync(tempDir)) {
              rmdirSync(tempDir);
            }
          } catch (err) {
            console.error('Cleanup error:', err);
          }

          activeProcesses.delete(sessionId);
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'done', 
              exitCode: code,
              stdout: stdoutBuffer,
              stderr: stderrBuffer
            })}\n\n`)
          );
          controller.close();
        });

        runProcess.on('error', (err) => {
          activeProcesses.delete(sessionId);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: `Execution error: ${err.message}` })}\n\n`)
          );
          controller.close();
        });


      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })}\n\n`)
        );
        controller.close();
      }
    }
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Endpoint to send stdin input to running process
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, stdin } = body;

    const processInfo = activeProcesses.get(sessionId);
    if (!processInfo) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    if (processInfo.process.killed || processInfo.process.exitCode !== null) {
      return Response.json({ error: 'Process has already terminated' }, { status: 400 });
    }

    // Send stdin to process
    processInfo.process.stdin.write(stdin + '\n');
    processInfo.currentStdinIndex++;
    
    // Reset stdin request flag so we can detect next input request
    processInfo.stdinRequestSent = false;

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

