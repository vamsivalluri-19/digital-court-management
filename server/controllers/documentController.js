const Document = require('../models/Document');
const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const fs = require('fs');

// @desc    Upload document for a case
// @route   POST /api/documents
// @access  Private
exports.uploadDocument = async (req, res) => {
  try {
    const { caseId, name, type } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const singleCase = await Case.findById(caseId);
    if (!singleCase) {
      // Clean up file if case doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    let fileUrl = '';
    const localFilePath = req.file.path;

    if (isCloudinaryConfigured) {
      try {
        const result = await cloudinary.uploader.upload(localFilePath, {
          resource_type: 'auto',
          folder: 'courtconnect',
        });
        fileUrl = result.secure_url;
        // Delete local temp file
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.error('Cloudinary upload failure, falling back to local static serve:', err);
        // Fallback to local url if cloudinary upload failed
        fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      }
    } else {
      // Local static file URL representation
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    // Determine file type extension
    const fileType = req.file.originalname.split('.').pop();

    const document = await Document.create({
      caseId,
      name: name || req.file.originalname,
      type,
      fileUrl,
      fileType,
      uploadedBy: req.user.id,
    });

    // Create Audit Log
    await AuditLog.create({
      userId: req.user.id,
      action: 'DOCUMENT_UPLOADED',
      details: `Uploaded document '${document.name}' of type '${type}' for case ${singleCase.caseNumber}`,
      ipAddress: req.ip,
    });

    // Notify participants
    const recipients = [];
    if (req.user.role !== 'citizen') {
      recipients.push(singleCase.petitioner);
    }
    if (req.user.role !== 'judge' && singleCase.assignedJudge) {
      recipients.push(singleCase.assignedJudge);
    }
    if (req.user.role !== 'lawyer' && singleCase.assignedLawyer) {
      recipients.push(singleCase.assignedLawyer);
    }

    for (const recipientId of recipients) {
      await Notification.create({
        recipient: recipientId,
        title: 'New Document Uploaded',
        message: `A new ${type} document (${document.name}) has been uploaded to case ${singleCase.caseNumber}.`,
        type: 'case',
        link: `/cases/${singleCase._id}`,
      });
    }

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Apply digital signature to a document
// @route   POST /api/documents/:id/sign
// @access  Private (Judge, Lawyer, Citizen)
exports.signDocument = async (req, res) => {
  try {
    const { signatureDataUrl } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const singleCase = await Case.findById(document.caseId);

    // Verify if user already signed
    const alreadySigned = document.signatures.some(
      (sig) => sig.userId.toString() === req.user.id
    );

    if (alreadySigned) {
      return res.status(400).json({ success: false, message: 'You have already signed this document' });
    }

    // Push signature log
    document.signatures.push({
      userId: req.user.id,
      signedAt: Date.now(),
      signatureDataUrl: signatureDataUrl || req.user.signature, // Use req body drawing or user's profile registered signature
    });

    await document.save();

    // Create Audit Log
    await AuditLog.create({
      userId: req.user.id,
      action: 'DOCUMENT_SIGNED',
      details: `E-signed document ${document.name} for case ${singleCase ? singleCase.caseNumber : 'unknown'}`,
      ipAddress: req.ip,
    });

    // Notify other roles
    if (singleCase) {
      const notifyUsers = [singleCase.petitioner];
      if (singleCase.assignedJudge) notifyUsers.push(singleCase.assignedJudge);
      if (singleCase.assignedLawyer) notifyUsers.push(singleCase.assignedLawyer);

      const filteredUsers = notifyUsers.filter((id) => id.toString() !== req.user.id);

      for (const recipientId of filteredUsers) {
        await Notification.create({
          recipient: recipientId,
          title: 'Document Signed',
          message: `${req.user.name} has digitally signed the document: ${document.name}.`,
          type: 'case',
          link: `/cases/${singleCase._id}`,
        });
      }
    }

    res.status(200).json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
