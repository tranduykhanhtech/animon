import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VAPID keys for Web Push
const publicVapidKey = Deno.env.get('VAPID_PUBLIC_KEY') || 'BFb3wo-HZHn1r8q_CeW54OxSYuGOEgtzRVjELViLiY8HSRY3HFfoWDLPSsbD-ZBVqRAsefIbZrUakvnq4YcSfe4';
const privateVapidKey = Deno.env.get('VAPID_PRIVATE_KEY') || 'kcYK4XuVR8u97gi7ea98MNdkjrGt1qkVWYf9Ybwj3ho';

webpush.setVapidDetails(
  'mailto:admin@animon.com',
  publicVapidKey,
  privateVapidKey
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { user_id, title, body: pushBody, icon, data } = body;

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      });
    }

    // Lấy danh sách subscriptions của user này
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id);

    if (error || !subs || subs.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No subscriptions found for user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({
      title: title || 'Thông báo mới',
      body: pushBody || 'Bạn có một thông báo mới từ Animon!',
      icon: icon || '/icon-192x192.png',
      data: data || { url: '/' }
    });

    const sendPromises = subs.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };
        await webpush.sendNotification(pushSubscription, payload);
        return { success: true, endpoint: sub.endpoint };
      } catch (err: any) {
        console.error('Error sending to endpoint', sub.endpoint, err);
        // Nếu subscription đã hết hạn, xóa khỏi DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
        return { success: false, endpoint: sub.endpoint, error: err.message };
      }
    });

    const results = await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
