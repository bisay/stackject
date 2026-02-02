import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-backend-prod.stackject.cloud';

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyRequest(request, params.path, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyRequest(request, params.path, 'POST');
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyRequest(request, params.path, 'PUT');
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyRequest(request, params.path, 'PATCH');
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyRequest(request, params.path, 'DELETE');
}

async function proxyRequest(request: NextRequest, pathSegments: string[], method: string) {
    const path = pathSegments.join('/');
    const url = `${API_URL}/${path}`;
    
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    
    // Forward cookies
    const cookie = request.headers.get('cookie');
    if (cookie) {
        headers['Cookie'] = cookie;
    }
    
    // Forward authorization header if present
    const auth = request.headers.get('authorization');
    if (auth) {
        headers['Authorization'] = auth;
    }

    // Forward x-setup-secret if present
    const setupSecret = request.headers.get('x-setup-secret');
    if (setupSecret) {
        headers['x-setup-secret'] = setupSecret;
    }
    
    let body: string | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
        try {
            const text = await request.text();
            if (text) {
                body = text;
            }
        } catch (e) {
            // No body
        }
    }
    
    try {
        const response = await fetch(url, {
            method,
            headers,
            body,
        });
        
        const data = await response.text();
        
        const responseHeaders = new Headers();
        
        // Forward Set-Cookie headers
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
            responseHeaders.set('Set-Cookie', setCookie);
        }
        
        responseHeaders.set('Content-Type', response.headers.get('content-type') || 'application/json');
        
        return new NextResponse(data, {
            status: response.status,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
    }
}
