import multer from 'multer';
import formidable from 'formidable';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({
    uploadDir: path.join(process.cwd(), 'public', 'uploads'),
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  try {
    const [fields, files] = await form.parse(req);

    // Required: Payment proof
    const paymentProof = Array.isArray(files.paymentProof) ? files.paymentProof[0] : files.paymentProof;
    if (!paymentProof) {
      return res.status(400).json({ error: 'Payment proof ($30/$25 receipt) is required' });
    }

    // Process other files
    const processedFiles = {};
    const fileFields = ['passport', 'cv', 'certificate'];
    
    for (const field of fileFields) {
      if (files[field]) {
        const file = Array.isArray(files[field]) ? files[field][0] : files[field];
        processedFiles[field] = file.newFilename;
      }
    }

    // Form data
    const formData = {
      type: fields.type?.[0] || 'job',
      name: fields.name?.[0],
      email: fields.email?.[0],
      phone: fields.phone?.[0],
      country: fields.country?.[0],
      experience: fields.experience?.[0],
      files: processedFiles,
      paymentProof: paymentProof.newFilename,
      timestamp: new Date().toISOString()
    };

    // Log for admin review (replace with DB save)
    console.log('✅ NEW APPLICATION:', formData);

    res.status(200).json({ 
      success: true, 
      message: 'Application submitted successfully! Admin will review within 24hrs.',
      data: formData 
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed. Max 10MB per file.' });
  }
}