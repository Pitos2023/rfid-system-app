// ✅ FILE: src/app/api/rfid-scan/route.js
// ✅ PURPOSE: Handles RFID scans and sends notifications (push & SMS) for time-in/out events.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ✅ OneSignal Environment Variables
const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_KEY = process.env.ONE_SIGNAL_REST_KEY;

// ✅ Vonage API Credentials
const VONAGE_API_KEY = process.env.VONAGE_API_KEY;
const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET;

// ✅ OneSignal Notification Function with retry logic
async function sendOneSignalNotification(playerId, title, body, data = {}) {
  if (!playerId) {
    console.warn("⚠️ No OneSignal Player ID provided — skipping notification.");
    return { success: false, error: "No player ID" };
  }

  console.log("📤 Sending OneSignal notification...");
  console.log("   ▶️ Player ID:", playerId);

  let lastError = null;
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`   ▶️ Attempt ${attempt} of ${maxRetries}`);
      
      // Add AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Basic ${ONESIGNAL_REST_KEY}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_player_ids: [playerId],
          headings: { en: title },
          contents: { en: body },
          data,
          url: "https://sarahi-recriminatory-liane.ngrok-free.dev/parents?view=dashboard",
          web_push_topic: "rfid-scan",
          chrome_web_icon: "https://cdn-icons-png.flaticon.com/512/1828/1828640.png",
          ttl: 30,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      const result = await response.json();

      if (response.ok) {
        console.log("✅ OneSignal notification successfully sent!");
        return { success: true, result };
      } else {
        lastError = result;
        console.error(`❌ OneSignal error (attempt ${attempt}):`, result.errors || result);
        
        // If it's a client error (4xx), don't retry
        if (response.status >= 400 && response.status < 500) {
          break;
        }
      }
    } catch (err) {
      lastError = err;
      console.error(`❌ OneSignal fetch error (attempt ${attempt}):`, err.message);
      
      // Don't retry on abort (timeout)
      if (err.name === 'AbortError') {
        console.error("❌ Request timed out after 10 seconds");
        break;
      }
    }
    
    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      console.log(`   ⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error(`❌ Failed to send OneSignal notification after ${maxRetries} attempts`);
  return { success: false, error: lastError };
}

// ✅ Function to format phone number for Vonage (E.164 format)
function formatPhoneNumberForVonage(phoneNumber) {
  if (!phoneNumber) return null;
  
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle different Philippine phone number formats
  if (cleaned.length === 10 && cleaned.startsWith('9')) {
    // 9XXXXXXXXX format -> +639XXXXXXXXX
    return '+63' + cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith('09')) {
    // 09XXXXXXXXX format -> +639XXXXXXXXX
    return '+63' + cleaned.substring(1);
  } else if (cleaned.length === 12 && cleaned.startsWith('639')) {
    // 639XXXXXXXXX format -> +639XXXXXXXXX
    return '+' + cleaned;
  } else if (cleaned.startsWith('+')) {
    // Already in E.164 format
    return phoneNumber;
  }
  
  console.error("❌ Unrecognized phone number format:", phoneNumber);
  return null;
}

// ✅ Vonage SMS Notification Function with duplicate prevention
async function sendVonageSMS(phoneNumber, message, messageType = "scan") {
  if (!phoneNumber) {
    console.warn("⚠️ No phone number provided — skipping SMS.");
    return { success: false, error: "No phone number" };
  }

  console.log("📱 Sending Vonage SMS...");
  console.log("   ▶️ Original phone number:", phoneNumber);
  console.log("   ▶️ Message type:", messageType);
  
  // Format the phone number
  const formattedNumber = formatPhoneNumberForVonage(phoneNumber);
  
  if (!formattedNumber) {
    console.error("❌ Failed to format phone number:", phoneNumber);
    return { success: false, error: "Invalid phone number format" };
  }

  console.log("   ▶️ Formatted for Vonage:", formattedNumber);
  console.log("   ▶️ Message:", message.substring(0, 100) + (message.length > 100 ? "..." : ""));

  try {
    // Check if we recently sent the same message to avoid duplicates
    const duplicateCheckKey = `${formattedNumber}:${messageType}:${message.substring(0, 50)}`;
    const duplicateCheckTime = Date.now() - 60000; // 1 minute window
    
    // Simple in-memory cache for duplicate prevention
    if (global.recentSMSMessages && global.recentSMSMessages[duplicateCheckKey]) {
      const lastSent = global.recentSMSMessages[duplicateCheckKey];
      if (Date.now() - lastSent < 30000) { // 30 second cooldown
        console.log("⚠️ Skipping duplicate SMS send (within 30 seconds)");
        return { success: true, skipped: true, reason: "duplicate" };
      }
    }
    
    // Initialize if not exists
    if (!global.recentSMSMessages) {
      global.recentSMSMessages = {};
    }
    
    // Track this message
    global.recentSMSMessages[duplicateCheckKey] = Date.now();
    
    // Clean old entries (older than 5 minutes)
    for (const key in global.recentSMSMessages) {
      if (Date.now() - global.recentSMSMessages[key] > 300000) {
        delete global.recentSMSMessages[key];
      }
    }

    // Use Vonage REST API directly
    const params = new URLSearchParams();
    params.append('api_key', VONAGE_API_KEY);
    params.append('api_secret', VONAGE_API_SECRET);
    params.append('to', formattedNumber);
    params.append('from', 'Vonage');
    params.append('text', message);
    
    console.log("   ▶️ Sending to Vonage API...");
    
    const response = await fetch('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString()
    });

    const result = await response.json();
    console.log("📡 Vonage API Response:", JSON.stringify(result, null, 2));

    if (result.messages && result.messages.length > 0) {
      const messageStatus = result.messages[0];
      
      if (messageStatus.status === '0') {
        console.log("✅ SMS sent successfully!");
        console.log("   ▶️ Message ID:", messageStatus['message-id']);
        console.log("   ▶️ Remaining balance:", messageStatus['remaining-balance']);
        console.log("   ▶️ Message count:", result['message-count']);
        
        // Check for duplicate messages in response
        if (result['message-count'] > 1) {
          console.warn(`⚠️ Vonage sent ${result['message-count']} messages. Possible duplicate.`);
          result.messages.forEach((msg, index) => {
            console.log(`   ▶️ Message ${index + 1} ID: ${msg['message-id']}`);
          });
        }
        
        return { 
          success: true, 
          messageId: messageStatus['message-id'],
          remainingBalance: messageStatus['remaining-balance'],
          cost: messageStatus['message-price'],
          messageCount: result['message-count']
        };
      } else {
        console.error("❌ SMS failed:");
        console.error("   ▶️ Status code:", messageStatus.status);
        console.error("   ▶️ Error text:", messageStatus['error-text']);
        return { 
          success: false, 
          error: messageStatus['error-text'] || `Status: ${messageStatus.status}`,
          status: messageStatus.status
        };
      }
    } else {
      console.error("❌ No messages in response:", result);
      return { 
        success: false, 
        error: "No messages in response" 
      };
    }
  } catch (err) {
    console.error("❌ Vonage SMS error:", err.message);
    console.error("❌ Error stack:", err.stack);
    
    return { 
      success: false, 
      error: err.message || "Unknown Vonage error"
    };
  }
}

// ✅ Function to check if current time is within consent hours (12-1 PM Manila Time)
function isWithinConsentHours() {
  const now = new Date();
  const manilaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const manilaHour = manilaTime.getUTCHours();
  
  console.log(`🕒 Current Manila Time: ${manilaTime.toISOString()}`);
  console.log(`🕒 Current Manila Hour: ${manilaHour}`);
  
  return manilaHour === 12;
}

// ✅ Function to format Manila time for display
function formatManilaTimeForDisplay(manilaISODate) {
  const date = new Date(manilaISODate);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

// ✅ Create sms_logs table if it doesn't exist
async function ensureSmsLogsTable() {
  try {
    // Check if table exists by trying to select from it
    const { error } = await supabase
      .from('sms_logs')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log("⚠️ sms_logs table doesn't exist, creating...");
      return false;
    }
    return true;
  } catch (err) {
    console.error("❌ Error checking sms_logs table:", err.message);
    return false;
  }
}

// ✅ UPDATED: Function to check if student has special notification types that require consent
async function checkSpecialNotificationTypes(studentId, parentId) {
  try {
    // Define the special notification types that require consent
    const specialTypes = ["disaster", "emergency", "sick_leave", "parental_leave", "medical_leave"];
    
    // UPDATED: Check for notifications that require consent (including urgent from metadata)
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("id, type, title, message, created_at, metadata")
      .eq("user_id", parentId)
      .eq("is_read", false)
      .or(`type.in.(${specialTypes.join(',')}),metadata->>requires_consent.eq.true`)
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (error) {
      console.error("❌ Error checking special notifications:", error);
      return null;
    }
    
    if (notifications && notifications.length > 0) {
      // First, try to find a notification specifically for this student (check metadata)
      const studentSpecificNotification = notifications.find(notif => {
        // For leave notifications, check if metadata has student_id matching
        if (["sick_leave", "parental_leave", "medical_leave"].includes(notif.type)) {
          return notif.metadata?.student_id === studentId;
        }
        // For disaster/emergency or urgent from metadata, it applies to all students
        return true;
      });
      
      if (studentSpecificNotification) {
        console.log(`🔍 Found special notification type: ${studentSpecificNotification.type} for student ${studentId}`);
        console.log(`🔍 Notification metadata:`, studentSpecificNotification.metadata);
        return studentSpecificNotification;
      }
      
      // If no student-specific notification found, return the first one (likely disaster/emergency/urgent)
      console.log(`🔍 Found special notification type: ${notifications[0].type} (school-wide)`);
      console.log(`🔍 Notification metadata:`, notifications[0].metadata);
      return notifications[0];
    }
    
    return null;
  } catch (err) {
    console.error("❌ Error in checkSpecialNotificationTypes:", err);
    return null;
  }
}

export async function POST(req) {
  let startTime = Date.now();
  
  try {
    const requestBody = await req.json();
    console.log("🔹 Received request body:", JSON.stringify(requestBody));
    const { card_number } = requestBody;
    const cleanCard = String(card_number || "").trim();

    if (!cleanCard) {
      console.error("❌ No card number provided");
      return new Response(
        JSON.stringify({ success: false, error: "card_number required" }),
        { status: 400 }
      );
    }

    console.log(`🔹 Processing scan for card: ${cleanCard}`);
    console.log(`⏱️ Request started at: ${new Date(startTime).toISOString()}`);

    // ✅ Find RFID card
    let { data: cardData, error: cardError } = await supabase
      .from("rfid_card")
      .select("id, student_id, card_number")
      .eq("card_number", cleanCard)
      .single();

    if (cardError && cardError.code !== "PGRST116") throw cardError;
    if (!cardData)
      return new Response(
        JSON.stringify({ success: false, error: "RFID not found" }),
        { status: 404 }
      );

    if (!cardData.student_id)
      return new Response(
        JSON.stringify({ success: false, error: "Card not linked to student" }),
        { status: 404 }
      );

    // ✅ Determine action
    const { data: lastLog } = await supabase
      .from("log")
      .select("action")
      .eq("rfid_card_id", cardData.id)
      .order("time_stamp", { ascending: false })
      .limit(1)
      .single();

    let action = "time-in";
    if (lastLog?.action === "time-in") action = "time-out";

    const now = new Date();
    const manilaISO = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString();

    // ✅ Insert log entry
    const { data: newLog, error: logErr } = await supabase
      .from("log")
      .insert([
        {
          rfid_card_id: cardData.id,
          student_id: cardData.student_id,
          action,
          consent: false,
          time_stamp: manilaISO,
          issue_at: manilaISO,
          metadata: { via: "rfid-scan" },
        },
      ])
      .select("*")
      .single();

    if (logErr) throw logErr;

    // ✅ Fetch student + parent info
    const { data: student } = await supabase
      .from("student")
      .select("id, first_name, last_name, users_id")
      .eq("id", cardData.student_id)
      .single();

    if (student?.users_id) {
      const { data: parent } = await supabase
        .from("users")
        .select("id, onesignal_player_id, contact_number")
        .eq("id", student.users_id)
        .eq("role", "parent")
        .single();

      if (parent) {
        let title, body, type = "info";
        const displayTime = formatManilaTimeForDisplay(manilaISO);

        if (action === "time-in") {
          title = `${student.first_name} ${student.last_name} has checked in`;
          body = `Has entered the school at`;
          type = "checkin";
        } else if (action === "time-out") {
          title = `${student.first_name} ${student.last_name} has checked out`;
          body = `Has exited the school at`;
          type = "checkout";
        }

        // ✅ Store notification in database with Manila time
        await supabase.from("notifications").insert([
          {
            user_id: parent.id,
            title,
            message: body,
            type,
            is_read: false,
            created_at: manilaISO,
            status: "pending",
            log_id: newLog.id,
          },
        ]);

        // ✅ Send push notification
        if (parent.onesignal_player_id) {
          const pushResult = await sendOneSignalNotification(parent.onesignal_player_id, title, body, {
            log_id: newLog.id,
            student_id: student.id,
            action,
          });
          
          if (!pushResult.success) {
            console.error("❌ Failed to send push notification:", pushResult.error);
          }
        }

        // ✅ Send SMS notification to contact_number
        if (parent.contact_number) {
          console.log("📞 Parent contact number from database:", parent.contact_number);
          
          const smsMessage = `${title}\n${body}`;
          const smsResult = await sendVonageSMS(parent.contact_number, smsMessage, "scan_notification");
          
          // Check if table exists before logging
          const tableExists = await ensureSmsLogsTable();
          
          if (tableExists) {
            if (smsResult.success && !smsResult.skipped) {
              await supabase.from("sms_logs").insert([
                {
                  user_id: parent.id,
                  student_id: student.id,
                  log_id: newLog.id,
                  phone_number: parent.contact_number,
                  formatted_number: formatPhoneNumberForVonage(parent.contact_number),
                  message: smsMessage,
                  status: 'sent',
                  message_id: smsResult.messageId,
                  cost: smsResult.cost,
                  remaining_balance: smsResult.remainingBalance,
                  sent_at: manilaISO,
                },
              ]);
              console.log("✅ SMS logged to database");
            } else if (smsResult.skipped) {
              console.log("✅ SMS skipped (duplicate)");
            } else {
              await supabase.from("sms_logs").insert([
                {
                  user_id: parent.id,
                  student_id: student.id,
                  log_id: newLog.id,
                  phone_number: parent.contact_number,
                  formatted_number: formatPhoneNumberForVonage(parent.contact_number),
                  message: smsMessage,
                  status: 'failed',
                  error: smsResult.error,
                  error_status: smsResult.status,
                  sent_at: manilaISO,
                },
              ]);
              console.error("❌ SMS failed and logged to database");
            }
          } else {
            console.log("⚠️ sms_logs table doesn't exist, skipping database logging");
          }
        } else {
          console.log("⚠️ No contact number for parent, skipping SMS");
        }

        // ✅ UPDATED: Check for special notification types that require consent on time-out
        if (action === "time-out") {
          // Check if parent has any special notification types
          const specialNotification = await checkSpecialNotificationTypes(student.id, parent.id);
          
          if (specialNotification) {
            console.log(`🔍 Found special notification: ${specialNotification.type} for student check-out`);
            console.log(`🔍 Notification metadata:`, specialNotification.metadata);
            
            // Create consent request for special notification type
            const notificationType = specialNotification.type;
            let typeDisplay = "";
            
            // Determine display type based on notification
            if (specialNotification.metadata?.original_type === "urgent") {
              // This is an urgent notification from Assistant Principal
              typeDisplay = specialNotification.metadata?.notification_subtype || "Urgent Alert";
            } else {
              typeDisplay = notificationType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
            
            const consentTitle = `Consent Request: ${typeDisplay}`;
            let consentMessage = "";
            
            // UPDATED: Customize message based on notification type
            if (["sick_leave", "parental_leave", "medical_leave"].includes(notificationType)) {
              const studentName = specialNotification.metadata?.student_name || student.first_name;
              consentMessage = `There is a ${typeDisplay} for ${studentName}. Do you allow ${studentName} to leave the school? Please reply YES or NO.`;
            } else if (notificationType === "disaster" || notificationType === "emergency" || specialNotification.metadata?.original_type === "urgent") {
              // For urgent notifications, use the stored title and message
              consentMessage = `URGENT: ${specialNotification.title}\n\nDo you allow ${student.first_name} to leave the school? Please reply YES or NO.`;
            } else {
              consentMessage = `There is a ${typeDisplay} situation. Do you allow ${student.first_name} to leave the school? Please reply YES or NO.`;
            }

            // Store consent notification
            await supabase.from("notifications").insert([
              {
                user_id: parent.id,
                title: consentTitle,
                message: consentMessage,
                type: "consent_request",
                is_read: false,
                created_at: manilaISO,
                status: "pending",
                log_id: newLog.id,
                metadata: {
                  notification_type: notificationType,
                  original_notification_id: specialNotification.id,
                  requires_consent: true,
                  student_name: student.first_name,
                  student_id: student.id,
                  is_urgent: specialNotification.metadata?.original_type === "urgent",
                  original_notification_title: specialNotification.title,
                  ...(specialNotification.metadata?.original_type === "urgent" && {
                    urgent_subtype: specialNotification.metadata?.notification_subtype
                  })
                },
              },
            ]);

            // Send consent push notification
            if (parent.onesignal_player_id) {
              await sendOneSignalNotification(parent.onesignal_player_id, consentTitle, consentMessage, {
                log_id: newLog.id,
                student_id: student.id,
                action: "consent_request",
                notification_type: notificationType,
                is_urgent: specialNotification.metadata?.original_type === "urgent",
              });
            }

            // ✅ Send consent SMS if phone exists
            if (parent.contact_number) {
              const consentSMS = `${consentTitle}\n${consentMessage}`;
              const consentSmsResult = await sendVonageSMS(parent.contact_number, consentSMS, "consent_request");
              
              // Log consent SMS if table exists
              const tableExists = await ensureSmsLogsTable();
              if (tableExists) {
                await supabase.from("sms_logs").insert([
                  {
                    user_id: parent.id,
                    student_id: student.id,
                    log_id: newLog.id,
                    phone_number: parent.contact_number,
                    formatted_number: formatPhoneNumberForVonage(parent.contact_number),
                    message: consentSMS,
                    status: consentSmsResult.success ? 'sent' : 'failed',
                    type: 'consent_request',
                    notification_type: notificationType,
                    sent_at: manilaISO,
                  },
                ]);
              }
            }

            console.log(`✅ Consent request created for ${notificationType}`);
          } else {
            // Original lunch consent request (only during 12-1 PM)
            const isConsentTime = isWithinConsentHours();
            console.log(`⏰ Lunch consent request allowed: ${isConsentTime}`);
            
            if (isConsentTime) {
              const consentTitle = `Consent Request: ${student.first_name} ${student.last_name}`;
              const consentMessage = `Do you allow ${student.first_name} to go out or pick-up? Please go online and open the app to Reply YES or NO.`;

              // Store consent notification
              await supabase.from("notifications").insert([
                {
                  user_id: parent.id,
                  title: consentTitle,
                  message: consentMessage,
                  type: "consent_request",
                  is_read: false,
                  created_at: manilaISO,
                  status: "pending",
                  log_id: newLog.id,
                  metadata: {
                    notification_type: "lunch",
                    requires_consent: true,
                  },
                },
              ]);

              // Send consent push notification
              if (parent.onesignal_player_id) {
                await sendOneSignalNotification(parent.onesignal_player_id, consentTitle, consentMessage, {
                  log_id: newLog.id,
                  student_id: student.id,
                  action: "consent_request",
                  notification_type: "lunch",
                });
              }

              // ✅ Send consent SMS if phone exists
              if (parent.contact_number) {
                const consentSMS = `${consentTitle}\n${consentMessage}`;
                const consentSmsResult = await sendVonageSMS(parent.contact_number, consentSMS, "lunch_consent");
                
                // Log consent SMS if table exists
                const tableExists = await ensureSmsLogsTable();
                if (tableExists) {
                  await supabase.from("sms_logs").insert([
                    {
                      user_id: parent.id,
                      student_id: student.id,
                      log_id: newLog.id,
                      phone_number: parent.contact_number,
                      formatted_number: formatPhoneNumberForVonage(parent.contact_number),
                      message: consentSMS,
                      status: consentSmsResult.success ? 'sent' : 'failed',
                      type: 'consent_request',
                      sent_at: manilaISO,
                    },
                  ]);
                }
              }

              console.log("✅ Lunch consent request created during allowed hours");
            } else {
              console.log("❌ Lunch consent request NOT created - outside allowed hours (12-1 PM only)");
            }
          }
        }
      }
    }

    console.log(`✅ RFID scan processed successfully for ${cleanCard} (${action})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        action, 
        log: newLog,
        student: student ? {
          name: `${student.first_name} ${student.last_name}`,
          parent_id: student.users_id
        } : null
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (err) {
    console.error("❌ RFID API error:", err.message);
    console.error("❌ Error stack:", err.stack);
    console.error("❌ Error occurred at:", new Date().toISOString());
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } finally {
    const endTime = Date.now();
    console.log(`⏱️ Request completed in: ${endTime - startTime}ms`);
  }
}