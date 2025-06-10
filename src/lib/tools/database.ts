import { AxiosResponse } from 'axios';
import { requests } from './_internal';

export async function read(path: string): Promise<string> {
  const request = await requests.get(`/get/database/read`, {
    'bot': 'Discord',
    'path': path
  }, true) as AxiosResponse;
  
  switch (request.status) {
    case 200:
      break;
    case 403:
      throw new Error('Forbidden');
    case 404:
      throw new Error('File not found');
    case 500:
      throw new Error('Internal server error');
    default:
      throw new Error(`Unknown error: ${request.status}`);
  }
  
  const data = request.data;
  
  // Smart parsing: try to detect if it's JSON, but preserve large numbers as strings
  if (typeof data === 'string' && data.trim().length > 0) {
    // If it looks like JSON (starts with { or [), try to parse it
    const trimmed = data.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.parse(data);
      } catch {
        // If parsing fails, return as string
        return data;
      }
    }
    
    // If it's a pure number string that could lose precision, keep as string
    if (/^\d+$/.test(trimmed) && trimmed.length > 15) {
      return trimmed;
    }
    
    // For other strings, return as-is
    return data;
  }
  
  return String(data);
}

export async function readDir(path: string, readContents: boolean = false, skipDirectories: boolean = false): Promise<Array<{ name: string, value?: string }>> {
  const resp = await requests.get(`/get/database/readDir?skipread=${!readContents}`, {
    'bot': 'Discord',
    'path': path
  });
  
  // Parse the response if it's a string
  let parsedResp;
  if (typeof resp === 'string') {
    try {
      parsedResp = JSON.parse(resp);
    } catch {
      return [];
    }
  } else {
    parsedResp = resp;
  }
  
  if (!Array.isArray(parsedResp) || parsedResp.length === 0) {
    return [];
  }
  
  if (skipDirectories) {
    return parsedResp.filter(file => file.value !== '_Directory_');
  }
  
  return parsedResp;
}

export async function write(path: string, data: any, encrypt: boolean = false): Promise<string> {
    const response = await requests.post(`/post/database/create${encrypt ? '?encrypt=1' : ''}`, {
        data
    }, {
        'bot': 'Discord',
        path,
        'type': 'file'
    });
    return response;
}

export async function createDir(path: string): Promise<string> {
    return await requests.post(`/post/database/create?enc=1`, {}, {
        'bot': 'Discord',
        'path': path,
        'type': 'folder',
        'data': '.'
    });
}

export async function deleteFile(path: string): Promise<string> {
    return await requests.delete(`/delete/database/remove`, {
        'bot': 'Discord',
        'path': path,
        'type': 'file'
    });
}

export default {
    read,
    readDir,
    write,
    createDir,
    deleteFile
};