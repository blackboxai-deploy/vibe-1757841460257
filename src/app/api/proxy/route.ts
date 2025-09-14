import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, url, headers, body: requestBody, timeout = 10000 } = body;

    // Validate the request
    if (!url || !method) {
      return NextResponse.json(
        { error: 'Missing required fields: url and method' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        'User-Agent': 'API-Monitor-Pro/1.0',
        ...headers,
      },
      signal: AbortSignal.timeout(timeout),
    };

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && requestBody) {
      if (headers['Content-Type']?.includes('application/json')) {
        fetchOptions.body = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody);
      } else {
        fetchOptions.body = requestBody;
      }
    }

    const startTime = Date.now();
    
    // Make the actual request
    const response = await fetch(url, fetchOptions);
    const responseTime = Date.now() - startTime;

    // Extract response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Parse response data based on content type
    let responseData: any;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch (error) {
        responseData = await response.text();
      }
    } else if (contentType.includes('text/')) {
      responseData = await response.text();
    } else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      responseData = await response.text();
    } else {
      // For binary data, return as base64
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
      responseData = {
        type: 'binary',
        contentType,
        size: arrayBuffer.byteLength,
        data: btoa(binaryString),
      };
    }

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: responseData,
      responseTime,
      url: response.url,
      redirected: response.redirected,
    });

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'Request timeout',
          status: 408,
          statusText: 'Request Timeout',
          headers: {},
          data: { error: 'Request timed out' },
          responseTime: 0,
        },
        { status: 408 }
      );
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          error: 'Network error',
          status: 0,
          statusText: 'Network Error',
          headers: {},
          data: { error: 'Failed to connect to the server', details: error.message },
          responseTime: 0,
        },
        { status: 500 }
      );
    }

    console.error('Proxy request failed:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        data: { error: 'Proxy request failed', details: error.message },
        responseTime: 0,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API Proxy Service',
    version: '1.0.0',
    endpoints: {
      'POST /api/proxy': 'Proxy HTTP requests to external APIs',
    },
    usage: {
      method: 'POST',
      body: {
        method: 'GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS',
        url: 'https://api.example.com/endpoint',
        headers: { 'Authorization': 'Bearer token' },
        body: 'Request body (for POST/PUT/PATCH)',
        timeout: 10000
      }
    }
  });
}