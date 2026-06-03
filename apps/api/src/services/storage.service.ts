import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner'
import fs from 'fs/promises'
import { logger } from '../lib/logger'

export class StorageService {
  private static s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'auto',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || '',
      secretAccessKey: process.env.S3_SECRET_KEY || '',
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  })

  private static bucket = process.env.S3_BUCKET || 'beritakarya-kyc'

  /**
   * Upload a file to S3
   */
  static async uploadFile(localPath: string, remoteKey: string, contentType: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(localPath)

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: remoteKey,
          Body: fileBuffer,
          ContentType: contentType,
          // For KYC documents, we keep them private by default
          ACL: 'private',
        })
      )
      logger.info(`File uploaded to S3: ${remoteKey}`)
      return remoteKey
    } catch (error) {
      logger.error(`Error uploading file to S3: ${error}`)
      throw error
    }
  }

  /**
   * Generate a signed URL for private file access
   */
  static async getSignedUrl(key: string, expiresSeconds: number = 3600): Promise<string> {
    try {
      return await getS3SignedUrl(
        this.s3,
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
        { expiresIn: expiresSeconds }
      )
    } catch (error) {
      logger.error(`Error generating signed URL: ${error}`)
      throw error
    }
  }

  /**
   * Delete a file from S3
   */
  static async deleteFile(key: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      )
      logger.info(`File deleted from S3: ${key}`)
    } catch (error) {
      logger.error(`Error deleting file from S3: ${error}`)
    }
  }
}
