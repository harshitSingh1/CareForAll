import { supabase } from "@/integrations/supabase/client";

export const chatService = {
  async sendMessage(messages: Array<{ role: string; content: string }>, messageType: 'health' | 'wellness') {
    const { data, error } = await supabase.functions.invoke('chat', {
      body: { messages, messageType }
    });

    if (error) throw error;
    return data;
  },

  async getMessages(messageType: 'health' | 'wellness') {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('message_type', messageType)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};

export const checkInService = {
  async saveCheckIn(mood: string, journal: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('check_ins')
      .insert({
        user_id: user.id,
        mood,
        journal,
      });

    if (error) throw error;

    // Trigger pattern analysis
    await supabase.functions.invoke('analyze-patterns');
  },

  async getCheckIns(limit = 10) {
    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
};

export const doctorReviewService = {
  async submitForReview(problem: string, aiSuggestion: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('doctor_reviews')
      .insert({
        user_id: user.id,
        problem,
        ai_suggestion: aiSuggestion,
      });

    if (error) throw error;
  },

  async getReviews() {
    const { data, error } = await supabase
      .from('doctor_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

export const alertsService = {
  async getAlerts() {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async markAsRead(alertId: string) {
    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (error) throw error;
  }
};

export const consultationService = {
  async bookConsultation(specialty: string, scheduledAt: Date, purpose: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('consultations')
      .insert({
        user_id: user.id,
        specialty,
        scheduled_at: scheduledAt.toISOString(),
        purpose,
      });

    if (error) throw error;
  },

  async getConsultations() {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};
