"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiRequestBuilder } from "@/components/api-request-builder"
import { ResponseViewer } from "@/components/response-viewer"
import { NetworkMonitor } from "@/components/network-monitor"
import { JavaScriptConsole } from "@/components/javascript-console"
import { RequestHistory } from "@/components/request-history"

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

export default function Dashboard() {
  const [activeRequest, setActiveRequest] = useState<ApiRequest | null>(null);
  const [activeResponse, setActiveResponse] = useState<ApiResponse | null>(null);
  const [requestHistory, setRequestHistory] = useState<(ApiRequest & { response?: ApiResponse })[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestSend = async (request: ApiRequest) => {
    setIsLoading(true);
    setActiveRequest(request);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      const responseTime = Date.now() - startTime;
      const responseData = await response.json();
      
      const apiResponse: ApiResponse = {
        status: responseData.status,
        statusText: responseData.statusText,
        headers: responseData.headers,
        data: responseData.data,
        responseTime,
        size: JSON.stringify(responseData.data).length,
      };
      
      setActiveResponse(apiResponse);
      
      // Add to history
      setRequestHistory(prev => [
        { ...request, response: apiResponse },
        ...prev.slice(0, 49) // Keep only last 50 requests
      ]);
      
    } catch (error) {
      console.error('Request failed:', error);
      const apiResponse: ApiResponse = {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: { error: 'Request failed', details: error instanceof Error ? error.message : 'Unknown error' },
        responseTime: 0,
        size: 0,
      };
      setActiveResponse(apiResponse);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistorySelect = (historyItem: ApiRequest & { response?: ApiResponse }) => {
    setActiveRequest(historyItem);
    if (historyItem.response) {
      setActiveResponse(historyItem.response);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Monitor Pro</h1>
          <p className="text-muted-foreground">
            Professional API testing and network monitoring tool
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-muted-foreground">
            Total Requests: {requestHistory.length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-12rem)]">
        {/* Left Sidebar - Request History */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Request History</CardTitle>
              <CardDescription>
                Recent API requests and responses
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <RequestHistory 
                history={requestHistory}
                onSelect={handleHistorySelect}
                activeRequestId={activeRequest?.id}
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="builder" className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="builder">Request Builder</TabsTrigger>
              <TabsTrigger value="response">Response Viewer</TabsTrigger>
              <TabsTrigger value="monitor">Network Monitor</TabsTrigger>
              <TabsTrigger value="console">JS Console</TabsTrigger>
            </TabsList>
            
            <TabsContent value="builder" className="h-[calc(100%-3rem)]">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>API Request Builder</CardTitle>
                  <CardDescription>
                    Build and send HTTP requests with custom headers and body
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ApiRequestBuilder 
                    onSend={handleRequestSend}
                    isLoading={isLoading}
                    initialRequest={activeRequest}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="response" className="h-[calc(100%-3rem)]">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Response Viewer</CardTitle>
                  <CardDescription>
                    Analyze API responses with syntax highlighting and metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponseViewer 
                    response={activeResponse}
                    request={activeRequest}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="monitor" className="h-[calc(100%-3rem)]">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Network Monitor</CardTitle>
                  <CardDescription>
                    Real-time monitoring of API requests and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NetworkMonitor 
                    history={requestHistory}
                    activeRequest={activeRequest}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="console" className="h-[calc(100%-3rem)]">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>JavaScript Console</CardTitle>
                  <CardDescription>
                    Execute JavaScript code against API responses for data extraction and testing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <JavaScriptConsole 
                    response={activeResponse}
                    request={activeRequest}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}