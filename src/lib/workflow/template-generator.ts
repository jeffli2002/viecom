import ExcelJS from 'exceljs';
// @ts-nocheck
import * as XLSX from 'xlsx';

export interface BatchTemplateRow {
  // Image/Video Generation Fields
  prompt: string; // Required: Generation prompt
  generationMode: 't2i' | 'i2i' | 't2v' | 'i2v'; // Required: Generation mode
  baseImageUrl?: string; // Optional: For i2i/i2v modes, URL or base64 of source image
  model?: string; // Optional: Model name (default: nano-banana)
  aspectRatio?: string; // Optional: Aspect ratio (default: 1:1)
  count?: number; // Optional: Number of variations (default: 1)

  // Brand Context (Optional)
  companyUrl?: string; // Optional: Company website URL for brand tone analysis
  productSellingPoints?: string; // Optional: Product selling points, comma-separated

  // Product Information (for publishing)
  productTitle?: string; // Product name/title
  productDescription?: string; // Product description
  productCategory?: string; // Product category
  productBrand?: string; // Brand name
  productModel?: string; // Model number
  productSku?: string; // SKU
  productUpc?: string; // UPC/EAN (required for Amazon)
  productCountryOfOrigin?: string; // Country of Origin (required for Amazon)

  // Pricing Information
  standardPrice?: number; // Standard price (required for product publishing)
  salePrice?: number; // Sale/promotional price (for TikTok)
  currency?: string; // Currency code (default: USD)

  // Inventory Information
  inventoryQuantity?: number; // Stock quantity
  minPurchaseQuantity?: number; // Minimum purchase quantity
  maxPurchaseQuantity?: number; // Maximum purchase quantity

  // Publishing Options
  publishMode?: 'media-only' | 'product'; // Publishing mode (default: media-only)
  publishPlatforms?: string; // Comma-separated platform list: tiktok,amazon,shopify,taobao,douyin,temu
  productTags?: string; // Comma-separated tags
}

export class TemplateGenerator {
  /**
   * Generate CSV template with minimal fields (productName, productDescription, prompt, baseImageUrl, productSellingPoints)
   * generationMode, aspectRatio, count, companyUrl, model are handled by the frontend/system
   */
  generateCSVTemplate(generationType: 'image' | 'video' = 'image'): string {
    const headers = [
      'productName', // Product name/title (first column)
      'productDescription', // Product description (second column)
      'prompt',
      'baseImageUrl', // Optional: For i2i/i2v modes, can be HTTP/HTTPS URL, base64 image, or embed image directly in Excel cell
      'productSellingPoints', // Optional: Product selling points
    ];

    // Create example rows based on generation type
    const exampleRows =
      generationType === 'image'
        ? [
            [
              'Modern Smartphone',
              'A high-performance smartphone with advanced features',
              'A beautiful product photo of a modern smartphone',
              '',
              'High quality, Fast charging, Long battery life',
            ],
            [
              'Watercolor Art Print',
              'Transform your product image into artistic watercolor style',
              'Transform this image into a watercolor painting style',
              'https://example.com/base-image.jpg',
              'Artistic, Creative',
            ],
          ]
        : [
            [
              'Product Showcase Video',
              'Professional video showcasing product features and benefits',
              'Professional product video showcasing the features',
              '',
              'Premium design, User-friendly',
            ],
            [
              'Dynamic Product Video',
              'Create engaging video from product image',
              'Create a dynamic video from this product image',
              'https://example.com/base-image.jpg',
              'Dynamic, Engaging',
            ],
          ];

    // Build CSV content
    let csv = `${headers.join(',')}\n`;
    exampleRows.forEach((row) => {
      csv += `${row.map((cell) => `"${cell}"`).join(',')}\n`;
    });

    return csv;
  }

  /**
   * Generate Excel template with minimal fields (productName, productDescription, prompt, baseImageUrl, productSellingPoints)
   * generationMode, aspectRatio, count, companyUrl, model are handled by the frontend/system
   */
  generateExcelTemplate(generationType: 'image' | 'video' = 'image'): Buffer {
    const headers = [
      'productName', // Product name/title (first column)
      'productDescription', // Product description (second column)
      'prompt',
      'baseImageUrl', // Optional: For i2i/i2v modes, can be HTTP/HTTPS URL, base64 image, or embed image directly in Excel cell
      'productSellingPoints', // Optional: Product selling points
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create data rows with headers and examples based on generation type
    const exampleRows =
      generationType === 'image'
        ? [
            [
              'Modern Smartphone',
              'A high-performance smartphone with advanced features',
              'A beautiful product photo of a modern smartphone',
              '',
              'High quality, Fast charging, Long battery life',
            ],
            [
              'Watercolor Art Print',
              'Transform your product image into artistic watercolor style',
              'Transform this image into a watercolor painting style',
              'https://example.com/base-image.jpg',
              'Artistic, Creative',
            ],
          ]
        : [
            [
              'Product Showcase Video',
              'Professional video showcasing product features and benefits',
              'Professional product video showcasing the features',
              '',
              'Premium design, User-friendly',
            ],
            [
              'Dynamic Product Video',
              'Create engaging video from product image',
              'Create a dynamic video from this product image',
              'https://example.com/base-image.jpg',
              'Dynamic, Engaging',
            ],
          ];

    const data = [headers, ...exampleRows];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    const colWidths = [
      { wch: 30 }, // productName
      { wch: 50 }, // productDescription
      { wch: 50 }, // prompt
      { wch: 50 }, // baseImageUrl (longer for URLs/base64)
      { wch: 40 }, // productSellingPoints
    ];
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    const sheetName =
      generationType === 'image' ? 'Batch Image Generation' : 'Batch Video Generation';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  /**
   * Extract embedded images from Excel file
   * Returns a map of cell addresses to base64 image data
   */
  private async extractExcelImages(
    fileBuffer: Buffer,
    sheetName: string
  ): Promise<Map<string, string>> {
    const imageMap = new Map<string, string>();

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);

      const worksheet = workbook.getWorksheet(sheetName);
      if (!worksheet) {
        return imageMap;
      }

      // ExcelJS uses getImages() method to get all images in the worksheet
      const images = worksheet.getImages();

      for (const image of images) {
        try {
          // Get image ID
          const imageId = image.imageId;

          if (!imageId) continue;

          // Find image data in workbook.model.media
          // biome-ignore lint/suspicious/noExplicitAny: ExcelJS internal model structure not fully typed
          const mediaArray = (workbook as any).model?.media || [];
          // biome-ignore lint/suspicious/noExplicitAny: ExcelJS media item structure not fully typed
          const imageData = mediaArray.find((m: any) => m.index === imageId);

          if (imageData?.buffer) {
            this.processImageData(imageData, image, imageMap);
          }
        } catch (error) {
          console.error('Error extracting image:', error);
        }
      }
    } catch (error) {
      console.error('Error extracting Excel images:', error);
      // Fallback to XLSX if ExcelJS fails
    }

    return imageMap;
  }

  /**
   * Process image data and add to map
   */
  private processImageData(
    imageData: { buffer: Buffer; extension?: string; name?: string },
    image: { range?: { tl: { row: number; col: number }; br?: { row: number; col: number } } },
    imageMap: Map<string, string>
  ): void {
    try {
      // Determine image type from extension
      let imageType = 'jpeg';
      const ext = imageData.extension || imageData.name?.split('.').pop()?.toLowerCase() || '';
      if (ext === 'png' || ext.includes('png')) {
        imageType = 'png';
      } else if (ext === 'gif' || ext.includes('gif')) {
        imageType = 'gif';
      } else if (ext === 'webp' || ext.includes('webp')) {
        imageType = 'webp';
      } else if (ext === 'jpeg' || ext === 'jpg' || ext.includes('jpeg') || ext.includes('jpg')) {
        imageType = 'jpeg';
      }

      // Convert buffer to base64
      const base64 = imageData.buffer.toString('base64');
      const dataUrl = `data:image/${imageType};base64,${base64}`;

      // Map image to cell address
      // ExcelJS image.range contains tl (top-left) and br (bottom-right) coordinates
      if (image.range?.tl) {
        const { row, col } = image.range.tl;
        // ExcelJS uses 1-based indexing for rows, 1-based for columns
        // Convert to A1 notation (e.g., A1, B2, etc.)
        const colLetter = String.fromCharCode(64 + col); // A=65, but ExcelJS col is 1-based
        const cellAddress = `${colLetter}${row}`;
        imageMap.set(cellAddress, dataUrl);

        // Also store with XLSX format (0-based, row-1 because header row)
        // Note: row-1 because first row is header, data starts at row 2
        const xlsxAddress = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
        imageMap.set(xlsxAddress, dataUrl);
      }
    } catch (error) {
      console.error('Error processing image data:', error);
    }
  }

  /**
   * Parse CSV/Excel file and return structured data
   * Now supports extracting embedded images from Excel cells
   */
  async parseTemplateFile(fileBuffer: Buffer, fileName: string): Promise<BatchTemplateRow[]> {
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    let imageMap = new Map<string, string>();

    // Extract images from Excel if it's an Excel file
    if (isExcel) {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer);
        const sheetName = workbook.worksheets[0]?.name || workbook.worksheets[0]?.name || 'Sheet1';
        imageMap = await this.extractExcelImages(fileBuffer, sheetName);
      } catch (error) {
        console.warn('Failed to extract images from Excel, falling back to XLSX parser:', error);
      }
    }

    // Parse data using XLSX (for CSV and Excel compatibility)
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Get column mapping to find baseImageUrl column
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const headers: string[] = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = worksheet[cellAddress];
      headers[col] = cell ? String(cell.v || '').trim() : '';
    }

    const baseImageUrlColIndex = headers.findIndex(
      (h) => h.toLowerCase() === 'baseimageurl' || h.toLowerCase() === 'base_image_url'
    );

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

    return rows.map((row, rowIndex) => {
      let baseImageUrl = String(row.baseImageUrl ?? '').trim() || undefined;

      // If baseImageUrl is empty and we have an image in the Excel cell, use it
      if (!baseImageUrl && isExcel && baseImageUrlColIndex >= 0) {
        // Try multiple cell address formats to match the image
        // XLSX format (0-based, rowIndex+1 because first row is header)
        const xlsxAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: baseImageUrlColIndex });
        const imageData = imageMap.get(xlsxAddress);

        if (imageData) {
          baseImageUrl = imageData;
        } else {
          // Try A1 notation (1-based, rowIndex+2 because row 1 is header, data starts at row 2)
          const colLetter = String.fromCharCode(65 + baseImageUrlColIndex);
          const a1Address = `${colLetter}${rowIndex + 2}`;
          const altImageData = imageMap.get(a1Address);
          if (altImageData) {
            baseImageUrl = altImageData;
          } else {
            // Try without header offset (in case image is in header row)
            const a1AddressNoOffset = `${colLetter}${rowIndex + 1}`;
            const altImageData2 = imageMap.get(a1AddressNoOffset);
            if (altImageData2) {
              baseImageUrl = altImageData2;
            }
          }
        }
      }

      return {
        // Generation Fields
        prompt: String(row.prompt ?? '').trim(),
        generationMode: (String(row.generationMode ?? 't2i') || 't2i').toLowerCase() as
          | 't2i'
          | 'i2i'
          | 't2v'
          | 'i2v',
        baseImageUrl,
        model: String(row.model ?? '').trim() || undefined,
        aspectRatio: String(row.aspectRatio ?? '').trim() || undefined,
        count: row.count ? Number.parseInt(String(row.count)) : undefined,

        // Brand Context
        companyUrl: String(row.companyUrl ?? '').trim() || undefined,
        productSellingPoints: String(row.productSellingPoints ?? '').trim() || undefined,

        // Product Information
        // Support both productName and productTitle for backward compatibility
        productTitle: String(row.productName ?? row.productTitle ?? '').trim() || undefined,
        productDescription: String(row.productDescription ?? '').trim() || undefined,
        productCategory: String(row.productCategory ?? '').trim() || undefined,
        productBrand: String(row.productBrand ?? '').trim() || undefined,
        productModel: String(row.productModel ?? '').trim() || undefined,
        productSku: String(row.productSku ?? '').trim() || undefined,
        productUpc: String(row.productUpc ?? '').trim() || undefined,
        productCountryOfOrigin: String(row.productCountryOfOrigin ?? '').trim() || undefined,

        // Pricing
        standardPrice: row.standardPrice ? Number.parseFloat(String(row.standardPrice)) : undefined,
        salePrice: row.salePrice ? Number.parseFloat(String(row.salePrice)) : undefined,
        currency: String(row.currency ?? 'USD').trim(),

        // Inventory
        inventoryQuantity: row.inventoryQuantity
          ? Number.parseInt(String(row.inventoryQuantity))
          : undefined,
        minPurchaseQuantity: row.minPurchaseQuantity
          ? Number.parseInt(String(row.minPurchaseQuantity))
          : undefined,
        maxPurchaseQuantity: row.maxPurchaseQuantity
          ? Number.parseInt(String(row.maxPurchaseQuantity))
          : undefined,

        // Publishing
        publishMode: (row.publishMode || 'media-only').toLowerCase() as 'media-only' | 'product',
        publishPlatforms: String(row.publishPlatforms || '').trim() || undefined,
        productTags: String(row.productTags || '').trim() || undefined,
      };
    });
  }
}

export const templateGenerator = new TemplateGenerator();
