package storage

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type S3Client struct {
	client *minio.Client
	bucket string
}

func NewS3Client(endpoint, accessKey, secretKey, bucket string, useSSL bool) (*S3Client, error) {
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create minio client: %w", err)
	}

	// Ensure bucket exists
	ctx := context.Background()
	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return nil, fmt.Errorf("failed to check bucket: %w", err)
	}

	if !exists {
		err = client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{})
		if err != nil {
			return nil, fmt.Errorf("failed to create bucket: %w", err)
		}

		// Set bucket policy to allow public read
		policy := fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [{
				"Effect": "Allow",
				"Principal": {"AWS": ["*"]},
				"Action": ["s3:GetObject"],
				"Resource": ["arn:aws:s3:::%s/*"]
			}]
		}`, bucket)

		err = client.SetBucketPolicy(ctx, bucket, policy)
		if err != nil {
			return nil, fmt.Errorf("failed to set bucket policy: %w", err)
		}
	}

	return &S3Client{
		client: client,
		bucket: bucket,
	}, nil
}

// UploadFile uploads a file and returns the public URL
func (s *S3Client) UploadFile(ctx context.Context, file multipart.File, fileHeader *multipart.FileHeader, folder string) (string, error) {
	// Generate unique filename
	ext := filepath.Ext(fileHeader.Filename)
	filename := fmt.Sprintf("%s/%s%s", folder, uuid.New().String(), ext)

	// Get file size
	fileSize := fileHeader.Size
	contentType := fileHeader.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// Upload file
	_, err := s.client.PutObject(ctx, s.bucket, filename, file, fileSize, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}

	// Generate presigned URL (valid for 7 days) or construct public URL
	// For MinIO with public bucket, we can construct the URL directly
	url := fmt.Sprintf("http://localhost:9000/%s/%s", s.bucket, filename)

	return url, nil
}

// DeleteFile deletes a file from storage
func (s *S3Client) DeleteFile(ctx context.Context, fileURL string) error {
	// Extract filename from URL
	// Format: http://localhost:9000/bucket/folder/filename.ext
	// We need to extract "folder/filename.ext"

	// Simple approach: remove the base URL
	bucket := s.bucket
	prefix := fmt.Sprintf("http://localhost:9000/%s/", bucket)

	if len(fileURL) <= len(prefix) {
		return fmt.Errorf("invalid file URL")
	}

	filename := fileURL[len(prefix):]

	err := s.client.RemoveObject(ctx, s.bucket, filename, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

// GetPresignedURL generates a presigned URL for private files
func (s *S3Client) GetPresignedURL(ctx context.Context, filename string, expiry time.Duration) (string, error) {
	url, err := s.client.PresignedGetObject(ctx, s.bucket, filename, expiry, nil)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return url.String(), nil
}

// CopyFile copies a file within the same bucket
func (s *S3Client) CopyFile(ctx context.Context, srcURL, destFolder string) (string, error) {
	// Extract source filename
	bucket := s.bucket
	prefix := fmt.Sprintf("http://localhost:9000/%s/", bucket)
	if len(srcURL) <= len(prefix) {
		return "", fmt.Errorf("invalid source URL")
	}
	srcFilename := srcURL[len(prefix):]

	// Generate new filename
	ext := filepath.Ext(srcFilename)
	destFilename := fmt.Sprintf("%s/%s%s", destFolder, uuid.New().String(), ext)

	// Copy object
	src := minio.CopySrcOptions{
		Bucket: s.bucket,
		Object: srcFilename,
	}
	dst := minio.CopyDestOptions{
		Bucket: s.bucket,
		Object: destFilename,
	}

	_, err := s.client.CopyObject(ctx, dst, src)
	if err != nil {
		return "", fmt.Errorf("failed to copy file: %w", err)
	}

	// Construct URL
	url := fmt.Sprintf("http://localhost:9000/%s/%s", s.bucket, destFilename)

	return url, nil
}

// StreamFile streams a file from storage
func (s *S3Client) StreamFile(ctx context.Context, filename string) (io.ReadCloser, error) {
	object, err := s.client.GetObject(ctx, s.bucket, filename, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get file: %w", err)
	}

	return object, nil
}
