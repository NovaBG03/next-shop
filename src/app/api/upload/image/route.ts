import { type NextRequest } from 'next/server';

import { getMultiplePresignedUrls } from '~/lib/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.files || !Array.isArray(body.files)) {
      return Response.json(
        { error: 'Invalid request. Must include files array.' },
        { status: 400 },
      );
    }

    const files = body.files as { name: string; type: string }[];

    if (files.length === 0) {
      return Response.json({ error: 'No files provided' }, { status: 400 });
    }

    // Get presigned URLs for all files
    const presignedUrls = await getMultiplePresignedUrls(files);

    // Check if any errors occurred
    const errors = presignedUrls.filter((result) => result.error);
    if (errors.length > 0) {
      return Response.json(
        {
          error: 'Error generating some presigned URLs',
          details: errors,
        },
        { status: 500 },
      );
    }

    return Response.json({ presignedUrls });
  } catch (error) {
    console.error('Error in upload route:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
