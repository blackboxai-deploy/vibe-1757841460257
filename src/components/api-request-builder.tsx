"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ApiRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

interface ApiRequestBuilderProps {
  onSend: (request: ApiRequest) => void;
  isLoading: boolean;
  initialRequest?: ApiRequest | null;
}

const HTTP_METHODS = [
  'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'
];

const COMMON_HEADERS = [
  { key: 'Content-Type', value: 'application/json' },
  { key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
  { key: 'Content-Type', value: 'text/plain' },
  { key: 'Authorization', value: 'Bearer ' },
  { key: 'Authorization', value: 'Basic ' },
  { key: 'User-Agent', value: 'API-Monitor-Pro/1.0' },
  { key: 'Accept', value: 'application/json' },
  { key: 'Accept', value: '*/*' },
];

const SAMPLE_REQUESTS: Array<{
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}> = [
  {
    name: 'JSONPlaceholder - Get Posts',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: { 'Accept': 'application/json' }
  },
  {
    name: 'HTTPBin - POST JSON',
    method: 'POST',
    url: 'https://httpbin.org/post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Hello API Monitor!', timestamp: new Date().toISOString() }, null, 2)
  },
  {
    name: 'HTTPBin - Get Headers',
    method: 'GET',
    url: 'https://httpbin.org/headers',
    headers: { 'User-Agent': 'API-Monitor-Pro/1.0', 'X-Custom-Header': 'test-value' }
  }
];

export function ApiRequestBuilder({ onSend, isLoading, initialRequest }: ApiRequestBuilderProps) {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [body, setBody] = useState('');
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');
  const [authType, setAuthType] = useState('none');
  const [authValue, setAuthValue] = useState('');

  // Update form when initialRequest changes
  useEffect(() => {
    if (initialRequest) {
      setMethod(initialRequest.method);
      setUrl(initialRequest.url);
      setHeaders(initialRequest.headers || {});
      setBody(initialRequest.body || '');
      
      // Extract auth from headers if present
      const authHeader = initialRequest.headers?.['Authorization'];
      if (authHeader?.startsWith('Bearer ')) {
        setAuthType('bearer');
        setAuthValue(authHeader.substring(7));
      } else if (authHeader?.startsWith('Basic ')) {
        setAuthType('basic');
        setAuthValue(authHeader.substring(6));
      }
    }
  }, [initialRequest]);

  const handleAddHeader = () => {
    if (headerKey && headerValue) {
      setHeaders(prev => ({ ...prev, [headerKey]: headerValue }));
      setHeaderKey('');
      setHeaderValue('');
    }
  };

  const handleRemoveHeader = (key: string) => {
    setHeaders(prev => {
      const newHeaders = { ...prev };
      delete newHeaders[key];
      return newHeaders;
    });
  };

  const handleAuthChange = (type: string) => {
    setAuthType(type);
    if (type === 'none') {
      setAuthValue('');
      setHeaders(prev => {
        const newHeaders = { ...prev };
        delete newHeaders['Authorization'];
        return newHeaders;
      });
    }
  };

  const handleAuthValueChange = (value: string) => {
    setAuthValue(value);
    if (authType === 'bearer') {
      setHeaders(prev => ({ ...prev, Authorization: `Bearer ${value}` }));
    } else if (authType === 'basic') {
      setHeaders(prev => ({ ...prev, Authorization: `Basic ${value}` }));
    } else if (authType === 'apikey') {
      setHeaders(prev => ({ ...prev, 'X-API-Key': value }));
    }
  };

  const handleSampleLoad = (sample: typeof SAMPLE_REQUESTS[0]) => {
    setMethod(sample.method);
    setUrl(sample.url);
    setHeaders(sample.headers || {});
    setBody(sample.body || '');
    setAuthType('none');
    setAuthValue('');
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(body);
      setBody(JSON.stringify(parsed, null, 2));
    } catch (error) {
      // Invalid JSON, do nothing
    }
  };

  const handleSend = () => {
    if (!url) return;

    const request: ApiRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      method,
      url,
      headers,
      body: body || undefined,
      timestamp: Date.now(),
    };

    onSend(request);
  };

  return (
    <div className="space-y-6">
      {/* Quick Sample Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Start</CardTitle>
          <CardDescription>Load sample requests for testing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_REQUESTS.map((sample, index) => (
              <Button 
                key={index}
                variant="outline" 
                size="sm"
                onClick={() => handleSampleLoad(sample)}
                disabled={isLoading}
              >
                {sample.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Request Builder */}
      <div className="grid grid-cols-12 gap-4 items-end">
        <div className="col-span-2">
          <Label htmlFor="method">Method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HTTP_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-8">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            type="url"
            placeholder="https://api.example.com/endpoint"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <Button 
            onClick={handleSend} 
            disabled={!url || isLoading}
            className="w-full"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="headers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
        </TabsList>

        <TabsContent value="headers" className="space-y-4">
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-5">
              <Label htmlFor="header-key">Header Key</Label>
              <Input
                id="header-key"
                placeholder="Content-Type"
                value={headerKey}
                onChange={(e) => setHeaderKey(e.target.value)}
              />
            </div>
            <div className="col-span-5">
              <Label htmlFor="header-value">Header Value</Label>
              <Input
                id="header-value"
                placeholder="application/json"
                value={headerValue}
                onChange={(e) => setHeaderValue(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Button onClick={handleAddHeader} disabled={!headerKey || !headerValue}>
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Current Headers</Label>
            <div className="border rounded-md p-3 min-h-[100px]">
              {Object.keys(headers).length === 0 ? (
                <p className="text-muted-foreground text-sm">No headers added</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(headers).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between bg-muted p-2 rounded">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{key}</Badge>
                        <span className="text-sm">{value}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveHeader(key)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Common Headers</Label>
            <div className="flex flex-wrap gap-1">
              {COMMON_HEADERS.map((header, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs"
                  onClick={() => {
                    setHeaderKey(header.key);
                    setHeaderValue(header.value);
                  }}
                >
                  {header.key}: {header.value}
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="body" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Request Body</Label>
              <Button variant="ghost" size="sm" onClick={formatJson}>
                Format JSON
              </Button>
            </div>
            <Textarea
              id="body"
              placeholder='{"key": "value"}'
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="auth-type">Authentication Type</Label>
              <Select value={authType} onValueChange={handleAuthChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Auth</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="apikey">API Key</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {authType === 'bearer' && (
              <div>
                <Label htmlFor="token">Bearer Token</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="your-jwt-token-here"
                  value={authValue}
                  onChange={(e) => handleAuthValueChange(e.target.value)}
                />
              </div>
            )}

            {authType === 'basic' && (
              <div>
                <Label htmlFor="basic">Basic Auth (base64 encoded)</Label>
                <Input
                  id="basic"
                  type="password"
                  placeholder="dXNlcm5hbWU6cGFzc3dvcmQ="
                  value={authValue}
                  onChange={(e) => handleAuthValueChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Encode "username:password" in base64
                </p>
              </div>
            )}

            {authType === 'apikey' && (
              <div>
                <Label htmlFor="apikey">API Key</Label>
                <Input
                  id="apikey"
                  type="password"
                  placeholder="your-api-key-here"
                  value={authValue}
                  onChange={(e) => handleAuthValueChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Will be sent as X-API-Key header
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}