import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const execAsync = promisify(exec);

// Supported languages and their execution commands
interface LanguageConfig {
  compile?: string;
  execute: string;
  extension: string;
}

const languageConfigs: Record<string, LanguageConfig> = {
  python: {
    execute: 'python3',
    extension: '.py'
  },
  javascript: {
    execute: 'node',
    extension: '.js'
  },
  typescript: {
    execute: 'ts-node',
    extension: '.ts'
  },
  cpp: {
    compile: 'g++',
    execute: './a.out',
    extension: '.cpp'
  },
  c: {
    compile: 'gcc',
    execute: './a.out',
    extension: '.c'
  }
};

// Temporary directory for code execution
const TMP_DIR = path.join(__dirname, '../../temp');

// Ensure tmp directory exists
async function ensureTmpDir() {
  try {
    await fs.access(TMP_DIR);
  } catch {
    await fs.mkdir(TMP_DIR, { recursive: true });
  }
}

// Clean up temporary files
async function cleanupTmpFiles(filePath: string) {
  try {
    await fs.unlink(filePath);
    // Clean up compiled files for C/C++
    const executablePath = path.join(path.dirname(filePath), 'a.out');
    await fs.unlink(executablePath).catch(() => {}); // Ignore if file doesn't exist
  } catch (error) {
    console.error('Error cleaning up temporary files:', error);
  }
}

// Modify the code to add necessary headers for C/C++ if missing
function preprocessCode(code: string, language: string): string {
  if (language === 'c' || language === 'cpp') {
    let processedCode = code;
    
    // Add stdio.h if not already present
    if (!processedCode.includes('<stdio.h>')) {
      processedCode = `#include <stdio.h>\n${processedCode}`;
    }
    
    // Add stdlib.h if not already present
    if (!processedCode.includes('<stdlib.h>')) {
      processedCode = `#include <stdlib.h>\n${processedCode}`;
    }

    // Add return statement to main if not present
    if (processedCode.includes('main()') && !processedCode.includes('return')) {
      processedCode = processedCode.replace(/}(\s*)$/, '    return 0;\n}$1');
    }

    return processedCode;
  }
  return code;
}

router.post('/', async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'Code and language are required' });
  }

  const lowerLang = language.toLowerCase();
  const config = languageConfigs[lowerLang];
  if (!config) {
    return res.status(400).json({ error: `Unsupported language: ${language}` });
  }

  // Preprocess code to add necessary headers
  const processedCode = preprocessCode(code, lowerLang);
  console.log('Processed code:', processedCode); // Debug log

  const fileId = uuidv4();
  const filePath = path.join(TMP_DIR, `${fileId}${config.extension}`);

  try {
    await ensureTmpDir();
    await fs.writeFile(filePath, processedCode);
    console.log('Written to file:', filePath); // Debug log

    let output = '';
    let error = null;

    // Compile if needed (C/C++)
    if (config.compile) {
      try {
        const compileCommand = `${config.compile} ${filePath} -o ${path.join(TMP_DIR, 'a.out')}`;
        console.log('Compile command:', compileCommand); // Debug log
        const { stderr: compileError } = await execAsync(compileCommand);
        if (compileError) {
          return res.json({
            output: '',
            error: compileError,
            timestamp: new Date().toISOString(),
            codeBlock: { content: code, language, lineNumber: 0 }
          });
        }
      } catch (compileError: any) {
        return res.json({
          output: '',
          error: compileError.stderr,
          timestamp: new Date().toISOString(),
          codeBlock: { content: code, language, lineNumber: 0 }
        });
      }
    }

    // Execute
    try {
      const execCommand = config.compile
        ? `cd ${TMP_DIR} && ${config.execute}`
        : `${config.execute} ${filePath}`;
      console.log('Execute command:', execCommand); // Debug log
      const { stdout, stderr } = await execAsync(execCommand);
      output = stdout;
      error = stderr;
    } catch (execError: any) {
      error = execError.stderr;
    }

    return res.json({
      output,
      error,
      timestamp: new Date().toISOString(),
      codeBlock: { content: code, language, lineNumber: 0 }
    });
  } catch (error) {
    console.error('Error executing code:', error);
    return res.status(500).json({ error: 'Failed to execute code' });
  } finally {
    // Clean up
    await cleanupTmpFiles(filePath);
  }
});

export default router;
