// api/rfid-scan/route.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ONESIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID;
const ONESIGNAL_REST_KEY = process.env.ONE_SIGNAL_REST_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";

async function sendOneSignalNotification(playerId, title, body, data = {}, withConsentButtons = false) {
  if (!playerId) return;

  try {
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: [playerId],
      headings: { en: title },
      contents: { en: body },
      data,
    };

    if (withConsentButtons && data?.log_id && data?.parent_id) {
      const yesUrl = `${APP_URL}/api/consent-response?log_id=${encodeURIComponent(data.log_id)}&response=yes&parent_id=${encodeURIComponent(data.parent_id)}`;
      const noUrl = `${APP_URL}/api/consent-response?log_id=${encodeURIComponent(data.log_id)}&response=no&parent_id=${encodeURIComponent(data.parent_id)}`;

      payload.buttons = [
        { id: "yes", text: "Yes", url: yesUrl },
        { id: "no", text: "No", url: noUrl },
      ];
      payload.web_buttons = [
        { id: "yes", text: "Yes", url: yesUrl },
        { id: "no", text: "No", url: noUrl },
      ];
      payload.data = { ...payload.data, consent_urls: { yes: yesUrl, no: noUrl } };
    }

    await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${ONESIGNAL_REST_KEY}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("❌ OneSignal send error:", err);
  }
}

function manilaNowISO() {
  const now = new Date();
  const manila = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return manila.toISOString();
}

export async function POST(req) {
  try {
    const { card_number, consent = false } = await req.json();
    const cleanCard = String(card_number || "").trim();
    if (!cleanCard) {
      return new Response(JSON.stringify({ success: false, error: "card_number is required" }), { status: 400 });
    }

    console.log("🔹 Scanned card:", cleanCard);

    let { data: cardData, error: cardError } = await supabase
      .from("rfid_card")
      .select("id, student_id, card_number")
      .eq("card_number", cleanCard)
      .single();

    if (cardError && cardError.code !== "PGRST116") throw cardError;

    if (!cardData) {
      const { data: newCard } = await supabase
        .from("rfid_card")
        .insert([{ card_number: cleanCard }])
        .select("id, student_id, card_number")
        .single();
      cardData = newCard;
    }

    const { data: lastLog } = await supabase
      .from("log")
      .select("action, time_stamp")
      .eq("rfid_card_id", cardData.id)
      .order("time_stamp", { ascending: false })
      .limit(1)
      .single();

    let action = "time-in";
    if (lastLog?.action === "time-in") action = "time-out";

    const now = new Date();
    const manila = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const manilaHour = manila.getHours();
    const isLunchWindow = manilaHour === 12;

    // ✅ LUNCH CONSENT REQUEST
    if (isLunchWindow) {
      const isoTime = manila.toISOString();
      const { data: provisionalLog, error: insertErr } = await supabase
        .from("log")
        .insert([
          {
            rfid_card_id: cardData.id,
            action: "lunch-request",
            consent: null,
            time_stamp: isoTime,
            issue_at: isoTime,
            student_id: cardData.student_id,
            metadata: { via: "rfid-scan", reason: "lunch-consent-request" },
          },
        ])
        .select("*")
        .single();

      if (insertErr) throw insertErr;

      const { data: student } = await supabase
        .from("student")
        .select("id, first_name, last_name, users_id")
        .eq("id", cardData.student_id)
        .single();

      if (student?.users_id) {
        const { data: parent } = await supabase
          .from("users")
          .select("id, first_name, onesignal_player_id")
          .eq("id", student.users_id)
          .eq("role", "parent")
          .single();

        if (parent) {
          const title = `Lunch Permission: ${student.first_name} ${student.last_name}`;
          const body = `Allow ${student.first_name} to go out for lunch? Tap Yes or No.`;

          await supabase.from("notifications").insert([
            {
              user_id: parent.id,
              title,
              message: body,
              type: "lunch-consent",
              is_read: false,
              created_at: isoTime,
            },
          ]);

          await sendOneSignalNotification(
            parent.onesignal_player_id,
            title,
            body,
            { type: "lunch-consent", student_id: student.id, parent_id: parent.id, log_id: provisionalLog.id },
            true
          );

          console.log("✅ Lunch consent request sent for parent", parent.id);

          // 🕐 AUTO-NO fallback after 1 minute if parent doesn't respond
          setTimeout(async () => {
            try {
              const { data: currentLog } = await supabase
                .from("log")
                .select("id, consent, action")
                .eq("id", provisionalLog.id)
                .single();

              if (currentLog && currentLog.consent === null) {
                const nowISO = manilaNowISO();
                await supabase
                  .from("log")
                  .update({
                    action: "time-in",
                    consent: false,
                    updated_at: nowISO,
                  })
                  .eq("id", provisionalLog.id);

                await supabase.from("notifications").insert([
                  {
                    user_id: parent.id,
                    title: "Lunch Permission: Auto-Denied",
                    message:
                      "No response received within 1 minute. Your child remains marked as time-in.",
                    type: "info",
                    is_read: false,
                    created_at: nowISO,
                  },
                ]);

                console.log("⏱️ Auto-denied lunch request for log:", provisionalLog.id);
              }
            } catch (err) {
              console.error("⚠️ Auto-deny error:", err.message);
            }
          }, 60 * 1000); // 1 minute
        }
      }

      return new Response(JSON.stringify({ success: true, message: "Lunch consent requested", log: provisionalLog }), { status: 200 });
    }

    // ✅ Normal scan (time-in/time-out)
    const isoTime = manila.toISOString();
    const { data: newLog } = await supabase
      .from("log")
      .insert([
        {
          rfid_card_id: cardData.id,
          action,
          consent,
          time_stamp: isoTime,
          issue_at: isoTime,
          student_id: cardData.student_id,
        },
      ])
      .select("*")
      .single();

    const { data: student } = await supabase
      .from("student")
      .select("id, first_name, last_name, users_id")
      .eq("id", cardData.student_id)
      .single();

    if (student?.users_id) {
      const { data: parent } = await supabase
        .from("users")
        .select("id, first_name, onesignal_player_id")
        .eq("id", student.users_id)
        .eq("role", "parent")
        .single();

      if (parent) {
        const title = newLog.action === "time-in" ? `Time In: ${student.first_name}` : `Time Out: ${student.first_name}`;
        const body = newLog.action === "time-in" ? `${student.first_name} has entered the school.` : `${student.first_name} has left the school.`;

        await supabase.from("notifications").insert([
          {
            user_id: parent.id,
            title,
            message: body,
            type: "info",
            is_read: false,
            created_at: isoTime,
          },
        ]);

        if (parent.onesignal_player_id) {
          await sendOneSignalNotification(
            parent.onesignal_player_id,
            title,
            body,
            { student_id: student.id, action: newLog.action },
            false
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        log: newLog,
        student: student || null,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ RFID scan error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
