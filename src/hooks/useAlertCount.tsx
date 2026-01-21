import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useAlertCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const { user } = useAuth();

  const fetchCounts = async () => {
    if (!user) {
      setUnreadCount(0);
      setTotalCount(0);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("alerts")
        .select("id, is_read");

      if (error) throw error;

      const alerts = data || [];
      setTotalCount(alerts.length);
      setUnreadCount(alerts.filter(a => !a.is_read).length);
    } catch (error) {
      console.error("Error fetching alert counts:", error);
    }
  };

  useEffect(() => {
    fetchCounts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('alerts-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { unreadCount, totalCount, refetch: fetchCounts };
};
