import { NextRequest, NextResponse } from 'next/server';

// In a real application, you would use a database
// For this demo, we'll use in-memory storage
let requestHistory: any[] = [];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const method = searchParams.get('method');
  const status = searchParams.get('status');

  let filteredHistory = [...requestHistory];

  // Apply filters
  if (method) {
    filteredHistory = filteredHistory.filter(item => 
      item.method?.toLowerCase() === method.toLowerCase()
    );
  }

  if (status) {
    filteredHistory = filteredHistory.filter(item => 
      item.response?.status?.toString() === status
    );
  }

  // Apply pagination
  const total = filteredHistory.length;
  const paginatedHistory = filteredHistory.slice(offset, offset + limit);

  return NextResponse.json({
    history: paginatedHistory,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    },
    filters: { method, status }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { request: apiRequest, response, action } = body;

    if (action === 'save' && apiRequest) {
      // Save request to history
      const historyItem = {
        id: apiRequest.id || generateId(),
        timestamp: Date.now(),
        method: apiRequest.method,
        url: apiRequest.url,
        headers: apiRequest.headers,
        body: apiRequest.body,
        response: response || null
      };

      // Add to beginning of history array
      requestHistory.unshift(historyItem);
      
      // Keep only last 1000 requests
      if (requestHistory.length > 1000) {
        requestHistory = requestHistory.slice(0, 1000);
      }

      return NextResponse.json({ 
        success: true, 
        id: historyItem.id,
        total: requestHistory.length
      });
    }

    if (action === 'clear') {
      requestHistory = [];
      return NextResponse.json({ 
        success: true, 
        message: 'History cleared',
        total: 0 
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "save" or "clear".' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('History operation failed:', error);
    return NextResponse.json(
      { error: 'Failed to process history request', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    const initialLength = requestHistory.length;
    requestHistory = requestHistory.filter(item => item.id !== id);

    if (requestHistory.length === initialLength) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Request deleted',
      total: requestHistory.length
    });

  } catch (error: any) {
    console.error('Delete history item failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete request', details: error.message },
      { status: 500 }
    );
  }
}

function generateId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}