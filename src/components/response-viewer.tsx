"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

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

interface ResponseViewerProps {
  response: ApiResponse | null;
  request: ApiRequest | null;
}

export function ResponseViewer({ response, request }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState("body");

  if (!response) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No Response Data</p>
          <p className="text-sm">Send a request to see the response here</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500";
    if (status >= 300 && status < 400) return "bg-yellow-500";
    if (status >= 400 && status < 500) return "bg-orange-500";
    if (status >= 500) return "bg-red-500";
    return "bg-gray-500";
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return String(data);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    });
  };

  const downloadResponse = () => {
    const responseData = {
      request: {
        method: request?.method,
        url: request?.url,
        headers: request?.headers,
        body: request?.body,
        timestamp: request?.timestamp
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        responseTime: response.responseTime,
        size: response.size
      }
    };

    const blob = new Blob([JSON.stringify(responseData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-response-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateCurlCommand = () => {
    if (!request) return '';
    
    let curl = `curl -X ${request.method}`;
    
    // Add headers
    Object.entries(request.headers || {}).forEach(([key, value]) => {
      curl += ` -H "${key}: ${value}"`;
    });
    
    // Add body
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      curl += ` -d '${request.body}'`;
    }
    
    curl += ` "${request.url}"`;
    return curl;
  };

  return (
    <div className="space-y-4">
      {/* Response Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(response.status)}`} />
            <Badge variant={response.status >= 400 ? "destructive" : "default"}>
              {response.status} {response.statusText}
            </Badge>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>⏱️ {response.responseTime}ms</span>
            <span>📦 {formatBytes(response.size)}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={downloadResponse}>
            Download
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => copyToClipboard(generateCurlCommand())}
          >
            Copy cURL
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="body">Response Body</TabsTrigger>
          <TabsTrigger value="headers">Headers ({Object.keys(response.headers).length})</TabsTrigger>
          <TabsTrigger value="raw">Raw</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="body">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Response Body</CardTitle>
              <CardDescription>
                Formatted response content with syntax highlighting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2 z-10"
                  onClick={() => copyToClipboard(formatJson(response.data))}
                >
                  Copy
                </Button>
                <ScrollArea className="h-96 w-full rounded-md border">
                  <pre className="p-4 text-sm">
                    <code>{formatJson(response.data)}</code>
                  </pre>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="headers">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Response Headers</CardTitle>
              <CardDescription>
                HTTP headers returned by the server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(response.headers).length === 0 ? (
                  <p className="text-muted-foreground">No headers received</p>
                ) : (
                  Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="flex items-start space-x-2 py-2">
                      <Badge variant="outline" className="min-w-fit">
                        {key}
                      </Badge>
                      <span className="text-sm break-all">{value}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Raw Response</CardTitle>
                  <CardDescription>
                    Complete HTTP response as received
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(`HTTP/1.1 ${response.status} ${response.statusText}\n${Object.entries(response.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${formatJson(response.data)}`)}
                >
                  Copy Raw
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full rounded-md border">
                <pre className="p-4 text-sm">
                  <div className="text-blue-600 dark:text-blue-400">
                    HTTP/1.1 {response.status} {response.statusText}
                  </div>
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="text-green-600 dark:text-green-400">
                      {key}: {value}
                    </div>
                  ))}
                  <div className="mt-4 border-t pt-4">
                    {formatJson(response.data)}
                  </div>
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Response Preview</CardTitle>
              <CardDescription>
                Formatted preview based on content type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Request Summary */}
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-sm font-medium mb-2">Request Summary</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Method: <Badge variant="secondary">{request?.method}</Badge></div>
                    <div>Status: <Badge variant={response.status >= 400 ? "destructive" : "default"}>{response.status}</Badge></div>
                    <div>Time: {response.responseTime}ms</div>
                    <div>Size: {formatBytes(response.size)}</div>
                  </div>
                </div>

                {/* Content Preview */}
                <div>
                  <div className="text-sm font-medium mb-2">Content Preview</div>
                  <ScrollArea className="h-64 w-full rounded-md border p-4">
                    {response.data && typeof response.data === 'object' ? (
                      <div className="space-y-2">
                        {Object.entries(response.data).slice(0, 10).map(([key, value]) => (
                          <div key={key} className="flex items-start space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {key}
                            </Badge>
                            <span className="text-sm break-all">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                        {Object.keys(response.data).length > 10 && (
                          <p className="text-muted-foreground text-sm">
                            ... and {Object.keys(response.data).length - 10} more fields
                          </p>
                        )}
                      </div>
                    ) : (
                      <pre className="text-sm">{String(response.data)}</pre>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}