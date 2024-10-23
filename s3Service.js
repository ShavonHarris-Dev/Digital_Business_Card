import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: 'us-east-1' });

export const uploadObject = async (params) => {
  try {
    const data = await s3Client.send(new PutObjectCommand(params));
    console.log('Upload Success:', data);
    return data;
  } catch (err) {
    console.error('Error uploading to S3:', err);
    throw err;
  }
};
