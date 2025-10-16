import fetch from "node-fetch"; // ✅ required for HTTP requests

// 🔑 Firebase Cloud Messaging Server Key
const FIREBASE_SERVER_KEY = process.env.FIREBASE_SERVER_KEY;

export async function POST(req) {
  try {
    const { token, title, message } = await req.json();

    // ✅ Validation
    if (!token || !title || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // ✅ Send notification to Firebase
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Authorization": `key=${FIREBASE_SERVER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title,
          body: message,
          icon: "/icon.png", // optional app icon
        },
        priority: "high",
      }),
    });

    // ✅ Parse Firebase response
    const resultText = await response.text();
    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { raw: resultText };
    }

    if (!response.ok) {
      console.error("❌ FCM error:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send FCM", details: result }),
        { status: 500 }
      );
    }

    console.log("📱 Push notification sent successfully:", result);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
    });
  } catch (err) {
    console.error("❌ Notification send error:", err);
    return new Response(
      JSON.stringify({ error: "Server error", details: err.message }),
      { status: 500 }
    );
  }
}
