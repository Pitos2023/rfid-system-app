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

// ✅ OneSignal Notification Function
async function sendOneSignalNotification(playerId, title, body, data = {}) {
  if (!playerId) {
    console.warn("⚠️ No OneSignal Player ID provided — skipping notification.");
    return;
  }

  console.log("📤 Sending OneSignal notification...");
  console.log("   ▶️ Player ID:", playerId);

  try {
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
        url: "https://mastoparietal-besottingly-dann.ngrok-free.dev/parents?view=dashboard",
        web_push_topic: "rfid-scan",
        chrome_web_icon: "https://cdn-icons-png.flaticon.com/512/1828/1828640.png",
        ttl: 30,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ OneSignal notification successfully sent!");
    } else {
      console.error("❌ OneSignal error response:", result.errors || result);
    }
  } catch (err) {
    console.error("❌ OneSignal fetch error:", err);
  }
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

// ✅ Vonage SMS Notification Function using REST API directly
async function sendVonageSMS(phoneNumber, message) {
  if (!phoneNumber) {
    console.warn("⚠️ No phone number provided — skipping SMS.");
    return { success: false, error: "No phone number" };
  }

  console.log("📱 Sending Vonage SMS...");
  console.log("   ▶️ Original phone number:", phoneNumber);
  
  // Format the phone number
  const formattedNumber = formatPhoneNumberForVonage(phoneNumber);
  
  if (!formattedNumber) {
    console.error("❌ Failed to format phone number:", phoneNumber);
    return { success: false, error: "Invalid phone number format" };
  }

  console.log("   ▶️ Formatted for Vonage:", formattedNumber);
  console.log("   ▶️ Message:", message);

  try {
    // Use Vonage REST API directly (more reliable than SDK)
    const params = new URLSearchParams();
    params.append('api_key', VONAGE_API_KEY);
    params.append('api_secret', VONAGE_API_SECRET);
    params.append('to', formattedNumber);
    params.append('from', 'Vonage'); // Try using 'Vonage' as sender ID
    params.append('text', message);
    params.append('type', 'unicode');

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
        return { 
          success: true, 
          messageId: messageStatus['message-id'],
          remainingBalance: messageStatus['remaining-balance'],
          cost: messageStatus['message-price']
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
      // Table doesn't exist, you might want to create it
      // For now, just log and continue
      return false;
    }
    return true;
  } catch (err) {
    console.error("❌ Error checking sms_logs table:", err.message);
    return false;
  }
}

export async function POST(req) {
  try {
    const { card_number } = await req.json();
    const cleanCard = String(card_number || "").trim();

    if (!cleanCard)
      return new Response(
        JSON.stringify({ success: false, error: "card_number required" }),
        { status: 400 }
      );

    console.log("🔹 Scanned card:", cleanCard);

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
          body = `Has entered the school at ${displayTime}`;
          type = "checkin";
        } else if (action === "time-out") {
          title = `${student.first_name} ${student.last_name} has checked out`;
          body = `Has exited the school at ${displayTime}`;
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
          await sendOneSignalNotification(parent.onesignal_player_id, title, body, {
            log_id: newLog.id,
            student_id: student.id,
            action,
          });
        }

        // ✅ Send SMS notification to contact_number
        if (parent.contact_number) {
          console.log("📞 Parent contact number from database:", parent.contact_number);
          
          const smsMessage = `${title}\n${body}`;
          const smsResult = await sendVonageSMS(parent.contact_number, smsMessage);
          
          // Check if table exists before logging
          const tableExists = await ensureSmsLogsTable();
          
          if (tableExists) {
            if (smsResult.success) {
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

        // ✅ Create consent request on time-out AND during 12-1 PM
        if (action === "time-out") {
          const isConsentTime = isWithinConsentHours();
          console.log(`⏰ Consent request allowed: ${isConsentTime}`);
          
          if (isConsentTime) {
            const consentTitle = `Consent Request: ${student.first_name} ${student.last_name}`;
            const consentMessage = `Do you allow pick-up for ${student.first_name}? Reply YES or NO.`;

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
              },
            ]);

            // Send consent SMS if phone exists
            if (parent.contact_number) {
              const consentSMS = `${consentTitle}\n${consentMessage}`;
              const consentSmsResult = await sendVonageSMS(parent.contact_number, consentSMS);
              
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

            console.log("✅ Consent request created during allowed hours");
          } else {
            console.log("❌ Consent request NOT created - outside allowed hours (12-1 PM only)");
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
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ RFID error:", err);
    console.error("❌ Error stack:", err.stack);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}