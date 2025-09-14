"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ApiRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
  size: number;
}

interface ConsoleOutput {
  type: 'log' | 'error' | 'warn' | 'info' | 'result';
  args: any[];
  timestamp: number;
}

interface JavaScriptConsoleProps {
  response: ApiResponse | null;
  request: ApiRequest | null;
}

const SAMPLE_SCRIPTS = [
  {
    name: "Extract Response Data",
    description: "Extract specific fields from response",
    code: `// Extract specific fields from API response
if (response.data) {
  console.log('Response status:', response.status);
  console.log('Response data type:', typeof response.data);
  
  if (Array.isArray(response.data)) {
    console.log('Array length:', response.data.length);
    return response.data.slice(0, 3); // First 3 items
  } else if (typeof response.data === 'object') {
    const keys = Object.keys(response.data);
    console.log('Object keys:', keys);
    return keys.reduce((acc, key) => {
      acc[key] = response.data[key];
      return acc;
    }, {});
  }
  
  return response.data;
} else {
  console.log('No response data available');
  return null;
}`
  },
  {
    name: "Validate Response",
    description: "Check response structure and validate data",
    code: `// Validate API response structure
const validation = {
  hasData: !!response.data,
  status: response.status,
  isSuccess: response.status >= 200 && response.status < 300,
  responseTime: response.responseTime + 'ms',
  dataType: typeof response.data,
  isJSON: typeof response.data === 'object'
};

console.log('Validation Results:', validation);

// Check for required fields (example)
if (response.data && typeof response.data === 'object') {
  const requiredFields = ['id', 'name', 'email']; // customize as needed
  const missingFields = requiredFields.filter(field => !(field in response.data));
  
  if (missingFields.length > 0) {
    console.warn('Missing required fields:', missingFields);
  } else {
    console.log('All required fields present');
  }
}

return validation;`
  },
  {
    name: "Process Array Data",
    description: "Filter, map, and process array responses",
    code: `// Process array data from API response
if (Array.isArray(response.data)) {
  console.log('Processing array with', response.data.length, 'items');
  
  // Example processing
  const processed = response.data
    .filter(item => item && typeof item === 'object')
    .map((item, index) => ({
      index: index,
      ...item,
      processed_at: new Date().toISOString()
    }))
    .slice(0, 5); // Limit to first 5 items
  
  console.log('Processed items:', processed.length);
  return processed;
} else {
  console.log('Response is not an array');
  return response.data;
}`
  },
  {
    name: "Extract Headers Info",
    description: "Analyze response headers",
    code: `// Analyze response headers
const headerAnalysis = {
  contentType: response.headers['content-type'] || 'not set',
  contentLength: response.headers['content-length'] || 'not set',
  server: response.headers['server'] || 'not set',
  cacheControl: response.headers['cache-control'] || 'not set',
  cors: {
    allowOrigin: response.headers['access-control-allow-origin'] || 'not set',
    allowMethods: response.headers['access-control-allow-methods'] || 'not set'
  }
};

console.log('Header Analysis:', headerAnalysis);
console.log('All headers:', Object.keys(response.headers));

return headerAnalysis;`
  }
];

export function JavaScriptConsole({ response, request }: JavaScriptConsoleProps) {
  const [code, setCode] = useState("");
  const [consoleOutput, setConsoleOutput] = useState<ConsoleOutput[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const clearConsole = () => {
    setConsoleOutput([]);
    setExecutionResult(null);
  };

  const loadSample = (sample: typeof SAMPLE_SCRIPTS[0]) => {
    setCode(sample.code);
    clearConsole();
  };

  const executeCode = useCallback(async () => {
    if (!code.trim()) return;

    setIsExecuting(true);
    clearConsole();

    try {
      const context = {
        response: response || {},
        request: request || {}
      };

      const response_api = await fetch('/api/eval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          context
        })
      });

      const result = await response_api.json();

      // Add console output
      if (result.console && Array.isArray(result.console)) {
        setConsoleOutput(result.console.map((item: any) => ({
          ...item,
          timestamp: item.timestamp || Date.now()
        })));
      }

      // Set execution result
      setExecutionResult(result);

      // Add result to console output if there's a return value
      if (result.success && result.result !== undefined) {
        setConsoleOutput(prev => [...prev, {
          type: 'result',
          args: [result.result],
          timestamp: Date.now()
        }]);
      }

    } catch (error) {
      setConsoleOutput([{
        type: 'error',
        args: ['Execution failed:', error instanceof Error ? error.message : 'Unknown error'],
        timestamp: Date.now()
      }]);
      setExecutionResult({ success: false, error: 'Network error' });
    } finally {
      setIsExecuting(false);
    }
  }, [code, response, request]);

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '[Object]';
      }
    }
    return String(value);
  };

  const getConsoleItemColor = (type: string): string => {
    switch (type) {
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'warn': return 'text-yellow-600 dark:text-yellow-400';
      case 'info': return 'text-blue-600 dark:text-blue-400';
      case 'result': return 'text-green-600 dark:text-green-400';
      default: return 'text-foreground';
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        executeCode();
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('keydown', handleKeyDown);
      return () => textarea.removeEventListener('keydown', handleKeyDown);
    }
  }, [executeCode]);

  return (
    <div className="space-y-4">
      {!response && (
        <div className="bg-muted/50 border border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
          <p className="text-muted-foreground">
            Send an API request first to enable JavaScript evaluation with response data
          </p>
        </div>
      )}

      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor">Code Editor</TabsTrigger>
          <TabsTrigger value="samples">Sample Scripts</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">JavaScript Code Editor</CardTitle>
                  <CardDescription>
                    Write JavaScript to process API responses (Ctrl+Enter to execute)
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={clearConsole}>
                    Clear Output
                  </Button>
                  <Button 
                    onClick={executeCode} 
                    disabled={!code.trim() || isExecuting}
                    size="sm"
                  >
                    {isExecuting ? 'Executing...' : 'Run Code'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                ref={textareaRef}
                placeholder={`// Available variables:
// - response: { status, statusText, headers, data, responseTime, size }
// - request: { method, url, headers, body, timestamp }

console.log('Response status:', response.status);
console.log('Response data:', response.data);

// Return a value to see it in the output
return response.data;`}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="min-h-[200px] font-mono text-sm resize-none"
              />
              <div className="mt-2 text-xs text-muted-foreground">
                Use Ctrl+Enter to execute code. Available: console methods, JSON, Object, Array, Math, Date, String, Number utilities.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="samples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sample Scripts</CardTitle>
              <CardDescription>
                Pre-built scripts for common response processing tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SAMPLE_SCRIPTS.map((sample, index) => (
                  <Card key={index} className="cursor-pointer hover:bg-muted/50" onClick={() => loadSample(sample)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{sample.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {sample.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <pre className="text-xs text-muted-foreground overflow-hidden line-clamp-3">
                        {sample.code.substring(0, 100)}...
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Console Output */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Console Output</CardTitle>
              <CardDescription>
                Execution results and console logs
              </CardDescription>
            </div>
            {executionResult && (
              <Badge variant={executionResult.success ? "default" : "destructive"}>
                {executionResult.success ? 'Success' : 'Error'}
                {executionResult.executionTime && ` (${executionResult.executionTime}ms)`}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 w-full rounded-md border p-4">
            {consoleOutput.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                No output yet. Run some code to see results here.
              </div>
            ) : (
              <div className="space-y-2">
                {consoleOutput.map((item, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                    <div className="flex-1">
                      <pre className={`whitespace-pre-wrap ${getConsoleItemColor(item.type)}`}>
                        {item.args.map(arg => formatValue(arg)).join(' ')}
                      </pre>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Context Information */}
      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Available Context</CardTitle>
            <CardDescription>
              Variables and data available in your JavaScript code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium mb-2">Response Object:</div>
                <div className="bg-muted p-2 rounded text-xs">
                  <div>status: {response.status}</div>
                  <div>statusText: "{response.statusText}"</div>
                  <div>responseTime: {response.responseTime}ms</div>
                  <div>size: {response.size} bytes</div>
                  <div>headers: {Object.keys(response.headers).length} headers</div>
                  <div>data: {typeof response.data} ({Array.isArray(response.data) ? 'array' : 'object'})</div>
                </div>
              </div>
              
              {request && (
                <div>
                  <div className="font-medium mb-2">Request Object:</div>
                  <div className="bg-muted p-2 rounded text-xs">
                    <div>method: "{request.method}"</div>
                    <div>url: "{new URL(request.url).pathname}"</div>
                    <div>headers: {Object.keys(request.headers).length} headers</div>
                    <div>body: {request.body ? 'present' : 'none'}</div>
                    <div>timestamp: {new Date(request.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}