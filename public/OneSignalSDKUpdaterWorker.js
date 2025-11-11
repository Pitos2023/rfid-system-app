importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

(async () => {
  console.log('Notification.permission =', Notification.permission);
  const OneSignalGlobal = window.OneSignal || window.OneSignalDeferred || null;
  console.log('OneSignal global present?', !!OneSignalGlobal);
  try { console.log('Player ID:', OneSignalGlobal?.User?.PushSubscription?.id); } catch(e){console.warn(e)}
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    console.log('SW scope:', reg?.scope);
    console.log('SW scriptURL:', reg?.active?.scriptURL || reg?.installing?.scriptURL);
    console.log('push subscription:', reg ? await reg.pushManager.getSubscription() : null);
  }
})();
