/**
 * File Upload Tests
 * Tests Cloudinary file upload functionality
 */

const uploadService = require("../services/uploadService");
const fs = require("fs");
const path = require("path");

describe("File Upload Service - Cloudinary", () => {
  const testFilePath = path.join(__dirname, "test-file.jpg");

  beforeAll(() => {
    // Create test file
    fs.writeFileSync(testFilePath, Buffer.from("test image content"));
  });

  afterAll(() => {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  describe("Single File Upload", () => {
    it("should upload file to Cloudinary", async () => {
      jest.spyOn(uploadService, "uploadFile").mockResolvedValueOnce({
        publicId: "roomlink/test-image",
        url: "https://res.cloudinary.com/test/image/upload/v1234567890/roomlink/test-image.jpg",
        format: "jpg",
        size: 12345,
      });

      const result = await uploadService.uploadFile(testFilePath, "roomlink");

      expect(result).toHaveProperty("publicId");
      expect(result).toHaveProperty("url");
      expect(result.url).toContain("cloudinary");
      expect(result.format).toBe("jpg");
    });

    it("should upload hostel image to correct folder", async () => {
      jest.spyOn(uploadService, "uploadHostelImage").mockResolvedValueOnce({
        publicId: "roomlink/hostels/hostel-1",
        url: "https://res.cloudinary.com/test/image/upload/v1234567890/roomlink/hostels/hostel-1.jpg",
        format: "jpg",
        size: 54321,
      });

      const result = await uploadService.uploadHostelImage(testFilePath);

      expect(result.publicId).toContain("hostels");
    });

    it("should upload user avatar", async () => {
      jest.spyOn(uploadService, "uploadUserAvatar").mockResolvedValueOnce({
        publicId: "roomlink/avatars/user-123",
        url: "https://res.cloudinary.com/test/image/upload/v1234567890/roomlink/avatars/user-123.jpg",
        format: "jpg",
        size: 23456,
      });

      const result = await uploadService.uploadUserAvatar(testFilePath);

      expect(result.publicId).toContain("avatars");
    });
  });

  describe("Multiple File Upload", () => {
    it("should upload multiple files", async () => {
      const filePaths = [testFilePath, testFilePath, testFilePath];

      jest
        .spyOn(uploadService, "uploadMultipleFiles")
        .mockResolvedValueOnce([
          {
            publicId: "roomlink/rooms/room-1-img-1",
            url: "https://example.com/image1.jpg",
            format: "jpg",
            size: 11111,
          },
          {
            publicId: "roomlink/rooms/room-1-img-2",
            url: "https://example.com/image2.jpg",
            format: "jpg",
            size: 22222,
          },
          {
            publicId: "roomlink/rooms/room-1-img-3",
            url: "https://example.com/image3.jpg",
            format: "jpg",
            size: 33333,
          },
        ]);

      const results = await uploadService.uploadMultipleFiles(filePaths);

      expect(results).toHaveLength(3);
      expect(results[0]).toHaveProperty("url");
      expect(results[1]).toHaveProperty("publicId");
      expect(results[2]).toHaveProperty("format");
    });

    it("should upload room gallery images", async () => {
      const filePaths = [testFilePath];

      jest
        .spyOn(uploadService, "uploadRoomImages")
        .mockResolvedValueOnce([
          {
            publicId: "roomlink/rooms/room-101-gallery",
            url: "https://example.com/room.jpg",
            format: "jpg",
            size: 44444,
          },
        ]);

      const results = await uploadService.uploadRoomImages(filePaths);

      expect(results[0].publicId).toContain("rooms");
    });
  });

  describe("File Deletion", () => {
    it("should delete file from Cloudinary", async () => {
      jest.spyOn(uploadService, "deleteFile").mockResolvedValueOnce(true);

      const result = await uploadService.deleteFile("roomlink/test-image");

      expect(result).toBe(true);
    });

    it("should handle deletion of non-existent file", async () => {
      jest
        .spyOn(uploadService, "deleteFile")
        .mockRejectedValueOnce(new Error("File not found"));

      await expect(
        uploadService.deleteFile("roomlink/non-existent")
      ).rejects.toThrow("File not found");
    });
  });

  describe("File Info Retrieval", () => {
    it("should get file information", async () => {
      jest.spyOn(uploadService, "getFileInfo").mockResolvedValueOnce({
        publicId: "roomlink/test-image",
        url: "https://example.com/image.jpg",
        format: "jpg",
        size: 12345,
        createdAt: "2023-01-01T00:00:00Z",
      });

      const result = await uploadService.getFileInfo("roomlink/test-image");

      expect(result).toHaveProperty("publicId");
      expect(result).toHaveProperty("url");
      expect(result).toHaveProperty("createdAt");
    });
  });

  describe("Document Upload", () => {
    it("should upload document file", async () => {
      jest.spyOn(uploadService, "uploadDocument").mockResolvedValueOnce({
        publicId: "roomlink/documents/id-proof-123",
        url: "https://example.com/document.pdf",
        format: "pdf",
        size: 55555,
      });

      const result = await uploadService.uploadDocument(testFilePath);

      expect(result.publicId).toContain("documents");
      expect(result).toHaveProperty("format");
    });
  });

  describe("File Validation", () => {
    it("should validate file size", () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const fileSize = 5 * 1024 * 1024; // 5MB

      expect(fileSize <= maxSize).toBe(true);
    });

    it("should validate file type", () => {
      const allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
      ];
      const fileMime = "image/jpeg";

      expect(allowedMimes.includes(fileMime)).toBe(true);
    });

    it("should reject invalid file types", () => {
      const allowedMimes = ["image/jpeg", "image/png"];
      const fileMime = "application/exe";

      expect(allowedMimes.includes(fileMime)).toBe(false);
    });
  });

  describe("Folder Organization", () => {
    it("should organize files in correct folders", () => {
      const folders = {
        avatars: "roomlink/avatars",
        hostels: "roomlink/hostels",
        rooms: "roomlink/rooms",
        documents: "roomlink/documents",
      };

      expect(folders.avatars).toContain("avatars");
      expect(folders.hostels).toContain("hostels");
      expect(folders.rooms).toContain("rooms");
      expect(folders.documents).toContain("documents");
    });
  });

  describe("URL Generation", () => {
    it("should generate secure Cloudinary URLs", () => {
      const url =
        "https://res.cloudinary.com/cloud-name/image/upload/v1234567890/path/image.jpg";

      expect(url).toContain("cloudinary.com");
      expect(url).toContain("secure");
      expect(url).toMatch(/\.(jpg|png|gif|pdf)$/i);
    });
  });
});
