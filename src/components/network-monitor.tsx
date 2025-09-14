"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"

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

interface NetworkMonitorProps {
  history: (ApiRequest & { response?: ApiResponse })[];
  activeRequest: ApiRequest | null;
}

export function NetworkMonitor({ history, activeRequest }: NetworkMonitorProps) {
  const analytics = useMemo(() => {
    if (history.length === 0) return null;

    const responses = history.filter(item => item.response);
    const totalRequests = responses.length;
    
    if (totalRequests === 0) return null;

    const successCount = responses.filter(item => 
      item.response && item.response.status >= 200 && item.response.status < 400
    ).length;

    const errorCount = totalRequests - successCount;
    
    const avgResponseTime = responses.reduce((sum, item) => 
      sum + (item.response?.responseTime || 0), 0
    ) / totalRequests;

    const totalSize = responses.reduce((sum, item) => 
      sum + (item.response?.size || 0), 0
    );

    const methodCounts = responses.reduce((acc, item) => {
      acc[item.method] = (acc[item.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusCounts = responses.reduce((acc, item) => {
      if (item.response) {
        const statusRange = Math.floor(item.response.status / 100) * 100;
        const key = `${statusRange}xx`;
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const responseTimes = responses
      .map(item => item.response?.responseTime || 0)
      .sort((a, b) => a - b);
    
    const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)] || 0;
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;

    return {
      totalRequests,
      successCount,
      errorCount,
      successRate: (successCount / totalRequests) * 100,
      avgResponseTime,
      totalSize,
      methodCounts,
      statusCounts,
      percentiles: { p50, p95, p99 }
    };
  }, [history]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };



  const recentRequests = history.slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalRequests}</div>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="default" className="text-xs">
                  {analytics.successCount} Success
                </Badge>
                <Badge variant="destructive" className="text-xs">
                  {analytics.errorCount} Errors
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.successRate.toFixed(1)}%</div>
              <Progress 
                value={analytics.successRate} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(analytics.avgResponseTime)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                P95: {formatTime(analytics.percentiles.p95)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(analytics.totalSize)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Avg: {formatBytes(analytics.totalSize / analytics.totalRequests)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method Distribution */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Method Distribution</CardTitle>
              <CardDescription>HTTP methods used in requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analytics.methodCounts).map(([method, count]) => (
                  <div key={method} className="flex items-center justify-between">
                    <Badge variant="outline">{method}</Badge>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium">{count as number}</div>
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${((count as number) / analytics.totalRequests) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Code Distribution */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status Code Distribution</CardTitle>
              <CardDescription>Response status code ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analytics.statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <Badge 
                      variant={status.startsWith('2') ? 'default' : status.startsWith('4') || status.startsWith('5') ? 'destructive' : 'secondary'}
                    >
                      {status}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium">{count as number}</div>
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${((count as number) / analytics.totalRequests) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Network Activity</CardTitle>
          <CardDescription>
            Latest {recentRequests.length} requests with response details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No network activity yet</p>
              <p className="text-sm mt-1">Send some requests to see network monitoring data</p>
            </div>
          ) : (
            <ScrollArea className="h-64 w-full">
              <div className="space-y-2">
                {recentRequests.map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      activeRequest?.id === item.id ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-xs">
                        {item.method}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {new URL(item.url).pathname}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {item.response ? (
                        <>
                          <Badge 
                            variant={item.response.status >= 400 ? "destructive" : "default"}
                            className="text-xs"
                          >
                            {item.response.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(item.response.responseTime)}
                          </div>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Performance Metrics</CardTitle>
            <CardDescription>Response time percentiles and distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold">{formatTime(analytics.percentiles.p50)}</div>
                <div className="text-xs text-muted-foreground">50th Percentile</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{formatTime(analytics.percentiles.p95)}</div>
                <div className="text-xs text-muted-foreground">95th Percentile</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{formatTime(analytics.percentiles.p99)}</div>
                <div className="text-xs text-muted-foreground">99th Percentile</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}