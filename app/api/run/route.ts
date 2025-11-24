import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { logger } from '@/lib/logger';

interface FileItem {
  name: string;
  content: string;
}

interface RunCodeRequest {
  files: FileItem[];
  stdin?: string;
}

interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
}

async function createZipArchiveBase64(files: FileItem[]): Promise<string> {
  const zip = new JSZip();
  for (const file of files) {
    const content = file.content ?? '';
    logger.log(`Adding file to ZIP: ${file.name} (${content.length} bytes)`);
    zip.file(file.name, content);
  }
  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  return buffer.toString('base64');
}

interface MainFunctionRange {
  startIndex: number;
  openBraceIndex: number;
  closeBraceIndex: number;
  bodyStart: number;
  bodyEnd: number;
}

interface OutputFileDeclaration {
  streamName: string | null;
  position: number;
}

interface OutputFileInfo {
  fileName: string;
  declarations: OutputFileDeclaration[];
}

function findMainFunctionRange(content: string): MainFunctionRange | null {
  const mainRegex = /int\s+main\s*\([^)]*\)/g;
  let match: RegExpExecArray | null;

  while ((match = mainRegex.exec(content)) !== null) {
    const signatureEnd = match.index + match[0].length;
    const openBraceIndex = content.indexOf('{', signatureEnd);
    if (openBraceIndex === -1) {
      continue;
    }

    let depth = 1;
    let position = openBraceIndex + 1;
    let inString: '"' | "'" | null = null;

    while (position < content.length) {
      const char = content[position];

      if (inString) {
        if (char === '\\') {
          position += 2;
          continue;
        }
        if (char === inString) {
          inString = null;
        }
      } else {
        if (char === '"' || char === "'") {
          inString = char;
        } else if (char === '{') {
          depth += 1;
        } else if (char === '}') {
          depth -= 1;
          if (depth === 0) {
            return {
              startIndex: match.index,
              openBraceIndex,
              closeBraceIndex: position,
              bodyStart: openBraceIndex + 1,
              bodyEnd: position,
            };
          }
        }
      }

      position += 1;
    }
  }

  return null;
}

function buildAutoDisplayBlock(fileName: string, indent: string, globalStreamNames: string[]): string {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9]/g, '_');
  const lines: string[] = [];

  if (globalStreamNames.length > 0) {
    globalStreamNames.forEach(streamName => {
      lines.push(`${indent}if (${streamName}.is_open()) {`);
      lines.push(`${indent}    ${streamName}.flush();`);
      lines.push(`${indent}    ${streamName}.close();`);
      lines.push(`${indent}}`);
    });
  }

  lines.push(`${indent}// Auto-display ${fileName}`);
  lines.push(`${indent}{`);
  lines.push(`${indent}    std::ifstream __auto_read_${sanitizedName}("${fileName}");`);
  lines.push(`${indent}    if (__auto_read_${sanitizedName}.is_open()) {`);
  lines.push(`${indent}        std::cout << "\\n=== Content of ${fileName} ===" << std::endl;`);
  lines.push(`${indent}        std::string __line;`);
  lines.push(`${indent}        while (std::getline(__auto_read_${sanitizedName}, __line)) {`);
  lines.push(`${indent}            std::cout << __line << std::endl;`);
  lines.push(`${indent}        }`);
  lines.push(`${indent}        __auto_read_${sanitizedName}.close();`);
  lines.push(`${indent}    }`);
  lines.push(`${indent}}`);

  return lines.join('\n');
}

function injectOutputFileReading(mainContent: string): string {
  logger.log('=== Analyzing code for ofstream declarations ===');
  
  if (mainContent.includes('__auto_read_') || /\bint\s+__auto_user_main\b/.test(mainContent)) {
    logger.log('Auto-display block already injected, skipping');
    return mainContent;
  }

  // Find all ofstream declarations with file names
  const directPattern = /ofstream\s+([A-Za-z_]\w*)\s*\(\s*"([^"]+)"\s*\)/g;
  const declarationPattern = /ofstream\s+([A-Za-z_]\w*)\s*;/g;
  
  const outputFiles = new Map<string, OutputFileInfo>();
  
  const recordOutputFile = (fileName: string, streamName: string | null, position: number) => {
    let info = outputFiles.get(fileName);
    if (!info) {
      info = { fileName, declarations: [] };
      outputFiles.set(fileName, info);
    }
    if (!info.declarations.some(decl => decl.streamName === streamName && decl.position === position)) {
      info.declarations.push({ streamName, position });
    }
  };

  let match: RegExpExecArray | null;

  while ((match = directPattern.exec(mainContent)) !== null) {
    const streamName = match[1];
    const fileName = match[2];
    logger.log(`  - File: ${fileName} (stream: ${streamName})`);
    recordOutputFile(fileName, streamName, match.index ?? 0);
  }

  while ((match = declarationPattern.exec(mainContent)) !== null) {
    const streamName = match[1];
    const searchStart = match.index + match[0].length;
    const searchWindow = mainContent.slice(searchStart, searchStart + 500);
    const openRegex = new RegExp(`\\b${streamName}\\b\\s*\\.open\\s*\\(\\s*"([^"]+)"\\s*\\)`);
    const openMatch = searchWindow.match(openRegex);
    if (openMatch) {
      const fileName = openMatch[1];
      logger.log(`  - File: ${fileName} via ${streamName}.open`);
      recordOutputFile(fileName, streamName, match.index ?? 0);
    }
  }
  
  if (outputFiles.size === 0) {
    logger.log('No output files detected, skipping injection');
    return mainContent; // No output files to inject
  }
  
  logger.log('Detected output files to auto-display:', Array.from(outputFiles.keys()));
  
  // Ensure fstream is included
  let modifiedContent = mainContent;
  if (!modifiedContent.includes('#include <fstream>')) {
    // Add fstream include after iostream if present, otherwise at the beginning
    if (modifiedContent.includes('#include <iostream>')) {
      modifiedContent = modifiedContent.replace(
        '#include <iostream>',
        '#include <iostream>\n#include <fstream>'
      );
    } else {
      modifiedContent = '#include <fstream>\n' + modifiedContent;
    }
    logger.log('Added #include <fstream>');
  }
  
  const mainRange = findMainFunctionRange(modifiedContent);

  if (!mainRange) {
    logger.warn('Main function brace parsing failed, skipping injection');
    return modifiedContent;
  }

  const originalMainBlock = modifiedContent.slice(mainRange.startIndex, mainRange.closeBraceIndex + 1);
  const mainSignature = modifiedContent.slice(mainRange.startIndex, mainRange.openBraceIndex).trim();
  const paramsMatch = mainSignature.match(/int\s+main\s*(\([^)]*\))/);
  const paramList = paramsMatch ? paramsMatch[1] : '()';
  const paramContent = paramList.slice(1, -1).trim();

  const extractParamName = (param: string): string | null => {
    const cleaned = param.replace(/=[^,]+/, '').trim();
    if (cleaned.length === 0) return null;
    const tokens = cleaned.split(/\s+/);
    const lastToken = tokens[tokens.length - 1];
    if (!lastToken) return null;
    return lastToken.replace(/^[*&]+/, '').replace(/[^A-Za-z0-9_]/g, '');
  };

  const paramNames = paramContent.length === 0
    ? []
    : paramContent.split(',').map(p => extractParamName(p)).filter((name): name is string => !!name);

  const callArguments = paramNames.join(', ');
  const callExpression = paramNames.length === 0 ? '__auto_user_main()' : `__auto_user_main(${callArguments})`;

  const userMainBlock = originalMainBlock.replace(/int\s+main/, 'int __auto_user_main');

  const beforeMain = modifiedContent.slice(0, mainRange.startIndex);
  const afterMain = modifiedContent.slice(mainRange.closeBraceIndex + 1);

  const filesArray = Array.from(outputFiles.values());

  const globalFlushNamesByFile = filesArray.map(info => {
    const names = info.declarations
      .filter(decl => decl.streamName && decl.position < mainRange.startIndex)
      .map(decl => decl.streamName!) as string[];
    return Array.from(new Set(names));
  });

  const readBlocks = filesArray.map((info, index) =>
    buildAutoDisplayBlock(info.fileName, '    ', globalFlushNamesByFile[index])
  ).join('\n\n');

  const newMainLines = [
    `int main${paramList} {`,
    `    int __auto_return_value = ${callExpression};`,
  ];

  if (readBlocks.trim().length > 0) {
    newMainLines.push('');
    newMainLines.push(readBlocks);
    newMainLines.push('');
  }

  newMainLines.push(`    return __auto_return_value;`);
  newMainLines.push(`}`);

  const newMainBlock = newMainLines.join('\n') + '\n';

  return beforeMain + userMainBlock + '\n\n' + newMainBlock + afterMain;
}

export async function POST(request: NextRequest) {
  logger.log('=== Run Code API Called ===');
  
  try {
    const body: RunCodeRequest = await request.json();
    const { files, stdin } = body;

    logger.log('Files received:', files?.length || 0);

    if (!files || !Array.isArray(files) || files.length === 0) {
      logger.log('Invalid files input');
      return NextResponse.json(
        { error: 'At least one file is required' },
        { status: 400 }
      );
    }

    // Find the main.cpp file or use the first .cpp file
    let mainFile = files.find(f => f.name === 'main.cpp');
    if (!mainFile) {
      mainFile = files.find(f => f.name.endsWith('.cpp'));
    }
    if (!mainFile) {
      return NextResponse.json(
        { error: 'No C++ file found. Please create at least one .cpp file.' },
        { status: 400 }
      );
    }

    logger.log('Main file:', mainFile.name);

    // Get all other files (including .txt files and other .cpp files)
    const otherFiles = files.filter(f => f.name !== mainFile!.name);
    
    // Inject code to auto-display output files created with ofstream
    const modifiedMainContent = injectOutputFileReading(mainFile.content);
    if (modifiedMainContent !== mainFile.content) {
      logger.log('Injected output file reading code');
    }

    // Encode main file to base64
    const base64Code = Buffer.from(modifiedMainContent).toString('base64');
    logger.log('Main file encoded to base64');

    // Create additional files archive - IMPORTANT: ALL other files must be sent
    // This includes .txt files that the user can read from, and other .cpp files
    let additionalFilesBase64: string | undefined;
    
    if (otherFiles.length > 0) {
      logger.log('Creating ZIP for', otherFiles.length, 'additional files:', otherFiles.map(f => f.name));
      additionalFilesBase64 = await createZipArchiveBase64(otherFiles);
      logger.log('Additional files ZIP created');
    }

    // Call Judge0 API - use base64 encoding to handle compilation errors with non-UTF-8 characters
    const endpoints = [
      'https://ce.judge0.com/submissions?base64_encoded=true&wait=true',
      'https://api.judge0.com/submissions?base64_encoded=true&wait=true'
    ];
    
    let response: Response | null = null;
    let lastError: string | null = null;
    
    for (const judge0Url of endpoints) {
      try {
        logger.log(`Attempting to call Judge0 at: ${judge0Url}`);
        
        const requestBody: any = {
          source_code: base64Code,
          language_id: 54, // C++17
        };

        // Add stdin if provided
        if (stdin !== undefined && stdin !== null && stdin !== '') {
          requestBody.stdin = Buffer.from(stdin).toString('base64');
          logger.log('Added stdin to request (length:', stdin.length, 'chars)');
        }

        // Add additional files if present
        if (additionalFilesBase64) {
          requestBody.additional_files = additionalFilesBase64;
        }
        
        response = await fetch(judge0Url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        logger.log(`Judge0 response status: ${response.status}`);

        if (response.ok) {
          logger.log(`Success with ${judge0Url}`);
          break; // Success, exit loop
        } else {
          const errorText = await response.text();
          lastError = `Judge0 API error (${response.status}): ${errorText}`;
          logger.warn(`Failed with ${judge0Url}:`, lastError);
          response = null;
        }
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
        logger.error(`Failed to fetch ${judge0Url}:`, fetchError);
        response = null;
      }
    }

    if (!response || !response.ok) {
      logger.error('All Judge0 endpoints failed. Last error:', lastError);
      return NextResponse.json(
        { error: lastError || 'Failed to connect to Judge0 API' },
        { status: 500 }
      );
    }

    let result: Judge0Response;
    try {
      result = await response.json();
      logger.log('Judge0 result status:', result.status?.id, result.status?.description);
    } catch (parseError) {
      // If JSON parsing fails, try to read as text for debugging
      try {
        const responseClone = response.clone();
        const textResponse = await responseClone.text();
        logger.error('Failed to parse Judge0 JSON response:', parseError);
        logger.error('Response text:', textResponse.substring(0, 500));
        return NextResponse.json(
          { error: 'Failed to parse Judge0 response', details: textResponse.substring(0, 200) },
          { status: 500 }
        );
      } catch (readError) {
        logger.error('Failed to read Judge0 response:', readError);
        return NextResponse.json(
          { error: 'Failed to read Judge0 response', details: readError instanceof Error ? readError.message : 'Unknown error' },
          { status: 500 }
        );
      }
    }

    // Decode base64 fields
    const decodeBase64 = (str: string | null): string | null => {
      if (!str) return null;
      try {
        return Buffer.from(str, 'base64').toString('utf-8');
      } catch (e) {
        logger.error('Failed to decode base64:', e);
        return str; // Return as is if decode fails
      }
    };

    // Always return the result, regardless of status
    // Status ID 3 = Accepted
    // Status ID 6 = Compilation Error
    // Status ID 11+ = Runtime errors, TLE, etc.
    
    logger.log('Judge0 result status:', result.status?.id, result.status?.description);
    logger.log('Has stdout:', !!result.stdout, 'Has stderr:', !!result.stderr, 'Has compile_output:', !!result.compile_output);
    
    const responseData = {
      stdout: decodeBase64(result.stdout),
      stderr: decodeBase64(result.stderr),
      compile_output: decodeBase64(result.compile_output),
      status: result.status || { id: 0, description: 'Unknown' },
      time: result.time || null,
      memory: result.memory || null,
    };
    
    logger.log('Returning decoded response to client');
    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('Error running code:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Error stack:', errorStack);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

