"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface RequestHistoryProps {
  history: (ApiRequest & { response?: ApiResponse })[];
  onSelect: (item: ApiRequest & { response?: ApiResponse }) => void;
  activeRequestId?: string;
}

export function RequestHistory({ history, onSelect, activeRequestId }: RequestHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Get unique methods and status codes for filters
  const uniqueMethods = Array.from(new Set(history.map(item => item.method)));
  const uniqueStatuses = Array.from(new Set(
    history
      .filter(item => item.response)
      .map(item => Math.floor((item.response?.status || 0) / 100) * 100)
  ));

  // Filter history based on search and filters
  const filteredHistory = history.filter(item => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.method.toLowerCase().includes(searchTerm.toLowerCase());

    // Method filter
    const matchesMethod = methodFilter === "all" || item.method === methodFilter;

    // Status filter
    const matchesStatus = statusFilter === "all" || 
      (item.response && Math.floor(item.response.status / 100) * 100 === parseInt(statusFilter));

    return matchesSearch && matchesMethod && matchesStatus;
  });

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "default";
    if (status >= 300 && status < 400) return "secondary";
    if (status >= 400 && status < 500) return "destructive";
    if (status >= 500) return "destructive";
    return "secondary";
  };

  const clearHistory = () => {
    // In a real app, you'd call an API to clear history
    console.log("Clear history requested");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filters */}
      <div className="p-4 border-b space-y-3">
        <Input
          placeholder="Search requests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8"
        />
        
        <div className="flex space-x-2">
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {uniqueMethods.map(method => (
                <SelectItem key={method} value={method}>{method}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {uniqueStatuses.map(status => (
                <SelectItem key={status} value={status.toString()}>{status}xx</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {history.length > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {filteredHistory.length} of {history.length} requests
            </span>
            <Button variant="ghost" size="sm" onClick={clearHistory} className="h-6 text-xs">
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* History List */}
      <ScrollArea className="flex-1">
        {filteredHistory.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {history.length === 0 ? (
              <div>
                <p className="text-sm">No requests yet</p>
                <p className="text-xs mt-1">Send your first API request to see it here</p>
              </div>
            ) : (
              <div>
                <p className="text-sm">No matching requests</p>
                <p className="text-xs mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredHistory.map((item) => {
              const isActive = activeRequestId === item.id;
              const url = new URL(item.url);
              
              return (
                <div
                  key={item.id}
                  className={`p-2 rounded-md cursor-pointer transition-colors ${
                    isActive 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => onSelect(item)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">
                      {item.method}
                    </Badge>
                    {item.response && (
                      <Badge 
                        variant={getStatusColor(item.response.status)} 
                        className="text-xs h-4"
                      >
                        {item.response.status}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-xs font-medium truncate mb-1">
                    {url.pathname || '/'}
                  </div>
                  
                  <div className="text-xs text-muted-foreground truncate mb-1">
                    {url.hostname}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatTime(item.timestamp)}</span>
                    {item.response && (
                      <span>{item.response.responseTime}ms</span>
                    )}
                  </div>
                  
                  {/* Request details preview */}
                  {item.body && (
                    <div className="mt-1 text-xs text-muted-foreground bg-muted/30 rounded px-1 py-0.5 truncate">
                      {item.body.substring(0, 50)}...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Stats Footer */}
      {history.length > 0 && (
        <div className="p-3 border-t bg-muted/30">
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              Success: {history.filter(item => 
                item.response && item.response.status >= 200 && item.response.status < 400
              ).length}
            </div>
            <div>
              Errors: {history.filter(item => 
                item.response && item.response.status >= 400
              ).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}