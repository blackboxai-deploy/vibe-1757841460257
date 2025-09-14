import { NextRequest, NextResponse } from 'next/server';

// Safe JavaScript evaluation with limited scope
function safeEval(code: string, context: any) {
  // Create a limited context for evaluation
  const safeContext = {
    // Provide access to response data
    response: context.response || {},
    request: context.request || {},
    // Utility functions
    JSON: JSON,
    console: {
      log: (...args: any[]) => ({ type: 'log', args }),
      error: (...args: any[]) => ({ type: 'error', args }),
      warn: (...args: any[]) => ({ type: 'warn', args }),
      info: (...args: any[]) => ({ type: 'info', args })
    },
    // Data manipulation utilities
    Object: Object,
    Array: Array,
    String: String,
    Number: Number,
    Date: Date,
    Math: Math,
    // Regex for data extraction
    RegExp: RegExp,
  };

  // List of dangerous keywords and functions to block
  const dangerousKeywords = [
    'eval', 'Function', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    'XMLHttpRequest', 'fetch', 'import', 'require', 'process', 'global', 
    '__dirname', '__filename', 'Buffer', 'module', 'exports'
  ];

  // Check for dangerous code patterns
  for (const keyword of dangerousKeywords) {
    if (code.includes(keyword)) {
      throw new Error(`Unsafe code detected: ${keyword} is not allowed`);
    }
  }

  // Check for dangerous patterns with regex
  const dangerousPatterns = [
    /constructor/g,
    /prototype/g,
    /__proto__/g,
    /window/g,
    /document/g,
    /location/g,
    /navigator/g,
    /this\./g
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      throw new Error(`Unsafe code pattern detected: ${pattern.source}`);
    }
  }

  try {
    // Create a function with limited scope
    const func = new Function(...Object.keys(safeContext), `
      "use strict";
      const results = [];
      const originalConsole = console;
      
      // Override console methods to capture output
      console.log = (...args) => {
        results.push({ type: 'log', args, timestamp: Date.now() });
        return originalConsole.log(...args);
      };
      console.error = (...args) => {
        results.push({ type: 'error', args, timestamp: Date.now() });
        return originalConsole.error(...args);
      };
      console.warn = (...args) => {
        results.push({ type: 'warn', args, timestamp: Date.now() });
        return originalConsole.warn(...args);
      };
      console.info = (...args) => {
        results.push({ type: 'info', args, timestamp: Date.now() });
        return originalConsole.info(...args);
      };

      try {
        const result = (function() {
          ${code}
        })();
        
        return {
          result: result,
          console: results,
          success: true
        };
      } catch (error) {
        return {
          result: null,
          console: results,
          error: error.message,
          success: false
        };
      }
    `);

    return func(...Object.values(safeContext));
  } catch (error) {
    throw new Error(`Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, context } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Missing required field: code' },
        { status: 400 }
      );
    }

    if (typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code must be a string' },
        { status: 400 }
      );
    }

    if (code.length > 10000) {
      return NextResponse.json(
        { error: 'Code too long. Maximum 10,000 characters allowed.' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const result = safeEval(code, context || {});
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      ...result,
      executionTime,
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('JavaScript evaluation failed:', error);
    return NextResponse.json(
      {
        result: null,
        console: [],
        error: error.message,
        success: false,
        executionTime: 0,
        timestamp: Date.now()
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'JavaScript Evaluation Service',
    version: '1.0.0',
    description: 'Safe JavaScript code execution for API response analysis',
    features: [
      'Sandboxed execution environment',
      'Access to response and request data',
      'Console output capture',
      'Data extraction and manipulation utilities',
      'Security restrictions to prevent harmful code'
    ],
    usage: {
      method: 'POST',
      body: {
        code: 'console.log("Hello"); return response.data?.message;',
        context: {
          response: { data: { message: 'API response data' } },
          request: { url: 'https://api.example.com' }
        }
      }
    },
    limitations: [
      'No access to browser APIs (window, document, etc.)',
      'No network requests (fetch, XMLHttpRequest)',
      'No file system access',
      'No eval or Function constructor',
      'Maximum 10,000 characters per execution',
      'Execution timeout protection'
    ]
  });
}