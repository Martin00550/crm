import { S3Client, PutBucketPolicyCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function setupBucketPolicy() {
  const bucketName = process.env.B2_BUCKET_NAME;
  const region = process.env.B2_REGION || 'us-east-005';
  const endpoint = process.env.B2_ENDPOINT || `https://s3.${region}.backblazeb2.com`;
  const accessKeyId = process.env.B2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.B2_SECRET_ACCESS_KEY;

  if (!bucketName || !accessKeyId || !secretAccessKey) {
    console.error('❌ Error: Missing B2 credentials in .env file');
    process.exit(1);
  }

  const s3Client = new S3Client({
    region,
    endpoint: endpoint.startsWith('http') ? endpoint : `https://${endpoint}`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'AllowPublicReadOfPublicFolder',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${bucketName}/public/*`,
      },
    ],
  };

  try {
    console.log(`\n🚀 Setting up policy for bucket: ${bucketName}...`);
    
    await s3Client.send(new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(policy),
    }));

    console.log('✅ Success! Your /public/ folder is now accessible to the internet.');
    console.log('🔗 Logos uploaded to /public/logos/ will now load correctly in the browser.');
  } catch (error: any) {
    console.error('❌ Failed to set bucket policy:');
    console.error(error.message);
    if (error.message.includes('Access Denied')) {
      console.log('\n💡 Tip: Make sure your Application Key has "Allow List All Bucket Names" checked and "Read and Write" access.');
    }
  }
}

setupBucketPolicy();
