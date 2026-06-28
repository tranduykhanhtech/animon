import { supabase } from '../lib/supabase';

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPushNotifications(userId: string) {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Trình duyệt của bạn không hỗ trợ Push Notifications.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Bạn đã từ chối nhận thông báo.');
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      const publicVapidKey = 'BFb3wo-HZHn1r8q_CeW54OxSYuGOEgtzRVjELViLiY8HSRY3HFfoWDLPSsbD-ZBVqRAsefIbZrUakvnq4YcSfe4';
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(publicVapidKey)
      });
    }

    const jsonSub = subscription.toJSON();
    if (!jsonSub.keys) throw new Error('Không lấy được keys của subscription.');

    // Save to Supabase
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: jsonSub.endpoint,
      p256dh: jsonSub.keys.p256dh,
      auth: jsonSub.keys.auth
    }, { onConflict: 'user_id,endpoint' });

    if (error) {
      console.error(error);
      throw new Error('Lỗi khi lưu thông báo vào CSDL.');
    }

    return { success: true, message: 'Đã bật thông báo thành công!' };

  } catch (err: any) {
    console.error(err);
    return { success: false, message: err.message || 'Có lỗi xảy ra.' };
  }
}
