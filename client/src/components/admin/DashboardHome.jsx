import React from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabaseClient";
import { useEffect, useState } from "react";
import StaffDashboard from "../../pages/admin/StaffDashboard";
import AdminDashboard from "../../pages/admin/AdminDashboard";
import { Loader2 } from "lucide-react";

const DashboardHome = () => {
  const { user } = useAuth();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setRole(data?.role);
      setLoading(false);
    };
    if (user) getRole();
  }, [user]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-uce-blue" />
      </div>
    );

  if (role === "ADMIN") {
    return <AdminDashboard />;
  }

  return <StaffDashboard />;
};

export default DashboardHome;
