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
      'baseImageUrl', // Optional: For i2i/i2v modes, can be HTTP/HTTPS URL or base64 image
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
      'baseImageUrl', // Optional: For i2i/i2v modes, can be HTTP/HTTPS URL or base64 image
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
   * Parse CSV/Excel file and return structured data
   */
  parseTemplateFile(fileBuffer: Buffer, _fileName: string): BatchTemplateRow[] {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

    return rows.map((row) => ({
      // Generation Fields
      prompt: String(row.prompt ?? '').trim(),
      generationMode: (String(row.generationMode ?? 't2i') || 't2i').toLowerCase() as
        | 't2i'
        | 'i2i'
        | 't2v'
        | 'i2v',
      baseImageUrl: String(row.baseImageUrl ?? '').trim() || undefined,
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
    }));
  }
}

export const templateGenerator = new TemplateGenerator();
