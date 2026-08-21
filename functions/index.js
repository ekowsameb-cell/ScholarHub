const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendSystemNotification = functions.firestore
  .document('lessonPlans/{planId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Trigger when lesson plan status changes to Approved
    if (before.status !== 'Approved' && after.status === 'Approved') {
      const message = {
        senderId: 'system',
        receiverId: after.teacherId || 'unknown',
        content: `System Notification: Your lesson plan "${after.title || 'Unnamed'}" has been officially approved.`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type: 'notification'
      };
      
      await admin.firestore().collection('messages').add(message);
    }
  });
