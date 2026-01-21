import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "user" | "doctor" | "admin" | "advisor";

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error) throw error;
        setRoles((data || []).map(r => r.role as AppRole));
      } catch (error) {
        console.error("Error fetching user roles:", error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user, authLoading]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isDoctor = hasRole("doctor");
  const isAdvisor = hasRole("advisor");
  const isAdmin = hasRole("admin");
  const isUser = hasRole("user");
  const isProfessional = isDoctor || isAdvisor || isAdmin;

  return {
    roles,
    loading: authLoading || loading,
    hasRole,
    isDoctor,
    isAdvisor,
    isAdmin,
    isUser,
    isProfessional,
  };
};
