export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  studiosync: {
    Tables: {
      studios: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          primary_color: string;
          secondary_color: string;
          phone: string | null;
          email: string | null;
          website: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          country: string;
          timezone: string;
          stripe_account_id: string | null;
          stripe_onboarding_complete: boolean;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['studios']['Row'], 'id' | 'created_at' | 'updated_at' | 'settings' | 'stripe_onboarding_complete' | 'country' | 'timezone' | 'primary_color' | 'secondary_color'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          settings?: Json;
          stripe_onboarding_complete?: boolean;
          country?: string;
          timezone?: string;
          primary_color?: string;
          secondary_color?: string;
        };
        Update: Partial<Database['studiosync']['Tables']['studios']['Insert']>;
      };
      staff: {
        Row: {
          id: string;
          studio_id: string;
          auth_user_id: string;
          role: 'owner' | 'admin' | 'instructor' | 'front_desk';
          display_name: string;
          email: string;
          phone: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['staff']['Row'], 'id' | 'created_at' | 'updated_at' | 'active'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          active?: boolean;
        };
        Update: Partial<Database['studiosync']['Tables']['staff']['Insert']>;
      };
      families: {
        Row: {
          id: string;
          studio_id: string;
          auth_user_id: string | null;
          parent_first_name: string;
          parent_last_name: string;
          email: string;
          phone: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          notes: string | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['families']['Row'], 'id' | 'created_at' | 'updated_at' | 'stripe_customer_id'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          stripe_customer_id?: string | null;
        };
        Update: Partial<Database['studiosync']['Tables']['families']['Insert']>;
      };
      students: {
        Row: {
          id: string;
          family_id: string;
          studio_id: string;
          first_name: string;
          last_name: string;
          date_of_birth: string | null;
          gender: string | null;
          medical_notes: string | null;
          notes: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['students']['Row'], 'id' | 'created_at' | 'updated_at' | 'active'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          active?: boolean;
        };
        Update: Partial<Database['studiosync']['Tables']['students']['Insert']>;
      };
      seasons: {
        Row: {
          id: string;
          studio_id: string;
          name: string;
          start_date: string;
          end_date: string;
          registration_opens_at: string | null;
          registration_closes_at: string | null;
          is_current: boolean;
          archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['seasons']['Row'], 'id' | 'created_at' | 'updated_at' | 'is_current' | 'archived'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          is_current?: boolean;
          archived?: boolean;
        };
        Update: Partial<Database['studiosync']['Tables']['seasons']['Insert']>;
      };
      class_types: {
        Row: {
          id: string;
          studio_id: string;
          name: string;
          description: string | null;
          color: string;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['class_types']['Row'], 'id' | 'created_at' | 'updated_at' | 'color' | 'sort_order' | 'active'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          color?: string;
          sort_order?: number;
          active?: boolean;
        };
        Update: Partial<Database['studiosync']['Tables']['class_types']['Insert']>;
      };
      levels: {
        Row: {
          id: string;
          studio_id: string;
          name: string;
          description: string | null;
          min_age: number | null;
          max_age: number | null;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['levels']['Row'], 'id' | 'created_at' | 'updated_at' | 'sort_order' | 'active'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          sort_order?: number;
          active?: boolean;
        };
        Update: Partial<Database['studiosync']['Tables']['levels']['Insert']>;
      };
      classes: {
        Row: {
          id: string;
          studio_id: string;
          season_id: string;
          class_type_id: string;
          level_id: string | null;
          instructor_id: string | null;
          name: string;
          description: string | null;
          day_of_week: number;
          start_time: string;
          end_time: string;
          room: string | null;
          capacity: number;
          enrolled_count: number;
          waitlist_count: number;
          monthly_price: number | null;
          drop_in_price: number | null;
          registration_fee: number | null;
          is_public: boolean;
          allow_drop_in: boolean;
          min_age: number | null;
          max_age: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['classes']['Row'], 'id' | 'created_at' | 'updated_at' | 'enrolled_count' | 'waitlist_count' | 'is_public' | 'allow_drop_in' | 'capacity'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          enrolled_count?: number;
          waitlist_count?: number;
          is_public?: boolean;
          allow_drop_in?: boolean;
          capacity?: number;
        };
        Update: Partial<Database['studiosync']['Tables']['classes']['Insert']>;
      };
      enrollments: {
        Row: {
          id: string;
          studio_id: string;
          class_id: string;
          student_id: string;
          family_id: string;
          status: 'pending' | 'active' | 'waitlisted' | 'dropped' | 'cancelled';
          waitlist_position: number | null;
          enrolled_at: string | null;
          dropped_at: string | null;
          drop_reason: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['enrollments']['Row'], 'id' | 'created_at' | 'updated_at' | 'status'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'pending' | 'active' | 'waitlisted' | 'dropped' | 'cancelled';
        };
        Update: Partial<Database['studiosync']['Tables']['enrollments']['Insert']>;
      };
      tuition_plans: {
        Row: {
          id: string;
          studio_id: string;
          family_id: string;
          name: string;
          description: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          amount: number;
          interval: 'month' | 'year';
          status: 'active' | 'past_due' | 'cancelled' | 'paused';
          cancel_at_period_end: boolean;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['tuition_plans']['Row'], 'id' | 'created_at' | 'updated_at' | 'interval' | 'status' | 'cancel_at_period_end' | 'name'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          interval?: 'month' | 'year';
          status?: 'active' | 'past_due' | 'cancelled' | 'paused';
          cancel_at_period_end?: boolean;
          name?: string;
        };
        Update: Partial<Database['studiosync']['Tables']['tuition_plans']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          studio_id: string;
          family_id: string;
          enrollment_id: string | null;
          tuition_plan_id: string | null;
          stripe_payment_intent_id: string | null;
          stripe_invoice_id: string | null;
          amount: number;
          currency: string;
          type: 'registration' | 'tuition' | 'drop_in' | 'refund' | 'other';
          status: 'pending' | 'succeeded' | 'failed' | 'refunded';
          description: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at' | 'currency' | 'status' | 'metadata'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          currency?: string;
          status?: 'pending' | 'succeeded' | 'failed' | 'refunded';
          metadata?: Json;
        };
        Update: Partial<Database['studiosync']['Tables']['payments']['Insert']>;
      };
      class_sessions: {
        Row: {
          id: string;
          studio_id: string;
          class_id: string;
          session_date: string;
          start_time: string;
          end_time: string;
          status: 'scheduled' | 'completed' | 'cancelled';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['class_sessions']['Row'], 'id' | 'created_at' | 'updated_at' | 'status'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'scheduled' | 'completed' | 'cancelled';
        };
        Update: Partial<Database['studiosync']['Tables']['class_sessions']['Insert']>;
      };
      attendance: {
        Row: {
          id: string;
          studio_id: string;
          class_session_id: string;
          student_id: string;
          status: 'present' | 'absent' | 'late' | 'excused';
          marked_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['attendance']['Row'], 'id' | 'created_at' | 'updated_at' | 'status'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'present' | 'absent' | 'late' | 'excused';
        };
        Update: Partial<Database['studiosync']['Tables']['attendance']['Insert']>;
      };
      invoices: {
        Row: {
          id: string;
          studio_id: string;
          family_id: string;
          invoice_number: string;
          status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'void' | 'cancelled';
          issue_date: string;
          due_date: string;
          subtotal: number;
          tax_rate: number;
          tax_amount: number;
          total: number;
          amount_paid: number;
          notes: string | null;
          stripe_invoice_id: string | null;
          stripe_payment_intent_id: string | null;
          sent_at: string | null;
          paid_at: string | null;
          late_fee_amount: number;
          late_fee_applied_at: string | null;
          discount_amount: number;
          promo_code_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at' | 'status' | 'subtotal' | 'tax_amount' | 'total' | 'amount_paid' | 'tax_rate' | 'late_fee_amount' | 'discount_amount'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'void' | 'cancelled';
          subtotal?: number;
          tax_rate?: number;
          tax_amount?: number;
          total?: number;
          amount_paid?: number;
        };
        Update: Partial<Database['studiosync']['Tables']['invoices']['Insert']>;
      };
      invoice_line_items: {
        Row: {
          id: string;
          invoice_id: string;
          studio_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          total: number;
          enrollment_id: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['invoice_line_items']['Row'], 'id' | 'created_at' | 'updated_at' | 'sort_order'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          sort_order?: number;
        };
        Update: Partial<Database['studiosync']['Tables']['invoice_line_items']['Insert']>;
      };
      media: {
        Row: {
          id: string;
          studio_id: string;
          class_id: string | null;
          uploaded_by: string | null;
          title: string | null;
          type: 'image' | 'video' | 'audio' | 'document';
          storage_path: string;
          file_name: string;
          file_size: number | null;
          mime_type: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['media']['Row'], 'id' | 'created_at' | 'updated_at' | 'is_public'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          is_public?: boolean;
        };
        Update: Partial<Database['studiosync']['Tables']['media']['Insert']>;
      };
      progress_marks: {
        Row: {
          id: string;
          studio_id: string;
          class_id: string;
          student_id: string;
          period: string;
          category: string;
          score: number | null;
          mark: string | null;
          comments: string | null;
          marked_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['progress_marks']['Row'], 'id' | 'created_at' | 'updated_at' | 'period' | 'category'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          period?: string;
          category?: string;
        };
        Update: Partial<Database['studiosync']['Tables']['progress_marks']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          studio_id: string;
          name: string;
          description: string | null;
          event_date: string;
          event_time: string | null;
          end_time: string | null;
          location: string | null;
          ticket_price: number;
          max_tickets: number | null;
          tickets_sold: number;
          status: 'draft' | 'published' | 'cancelled' | 'completed';
          is_public: boolean;
          image_url: string | null;
          stripe_product_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at' | 'tickets_sold' | 'status' | 'is_public' | 'ticket_price'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          tickets_sold?: number;
          status?: 'draft' | 'published' | 'cancelled' | 'completed';
          is_public?: boolean;
          ticket_price?: number;
        };
        Update: Partial<Database['studiosync']['Tables']['events']['Insert']>;
      };
      ticket_orders: {
        Row: {
          id: string;
          studio_id: string;
          event_id: string;
          family_id: string | null;
          buyer_name: string;
          buyer_email: string;
          quantity: number;
          total_amount: number;
          stripe_payment_intent_id: string | null;
          status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['ticket_orders']['Row'], 'id' | 'created_at' | 'updated_at' | 'status' | 'quantity' | 'total_amount'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
          quantity?: number;
          total_amount?: number;
        };
        Update: Partial<Database['studiosync']['Tables']['ticket_orders']['Insert']>;
      };
      announcements: {
        Row: {
          id: string;
          studio_id: string;
          author_id: string | null;
          title: string;
          body: string;
          target_type: 'all' | 'class' | 'level' | 'class_type' | 'tag';
          target_id: string | null;
          target_tag: string | null;
          published_at: string | null;
          is_draft: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['announcements']['Row'], 'id' | 'created_at' | 'updated_at' | 'target_type' | 'is_draft'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          target_type?: 'all' | 'class' | 'level' | 'class_type' | 'tag';
          target_tag?: string | null;
          is_draft?: boolean;
        };
        Update: Partial<Database['studiosync']['Tables']['announcements']['Insert']>;
      };
      waivers: {
        Row: {
          id: string;
          studio_id: string;
          season_id: string | null;
          title: string;
          content: string;
          is_required: boolean;
          is_active: boolean;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['waivers']['Row'], 'id' | 'created_at' | 'updated_at' | 'version' | 'is_required' | 'is_active'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          is_required?: boolean;
          is_active?: boolean;
        };
        Update: Partial<Database['studiosync']['Tables']['waivers']['Insert']>;
      };
      waiver_signatures: {
        Row: {
          id: string;
          studio_id: string;
          waiver_id: string;
          family_id: string | null;
          student_id: string | null;
          parent_name: string;
          parent_email: string;
          ip_address: string | null;
          user_agent: string | null;
          waiver_version: number;
          signed_at: string;
          created_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['waiver_signatures']['Row'], 'id' | 'created_at' | 'signed_at' | 'waiver_version'> & {
          id?: string;
          created_at?: string;
          signed_at?: string;
          waiver_version?: number;
        };
        Update: Partial<Database['studiosync']['Tables']['waiver_signatures']['Insert']>;
      };
      promo_codes: {
        Row: {
          id: string;
          studio_id: string;
          code: string;
          description: string | null;
          discount_type: 'flat' | 'percent';
          discount_value: number;
          max_uses: number | null;
          current_uses: number;
          min_purchase: number;
          starts_at: string | null;
          expires_at: string | null;
          applies_to: 'all' | 'registration' | 'invoice' | 'tuition';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['promo_codes']['Row'], 'id' | 'created_at' | 'updated_at' | 'current_uses' | 'is_active' | 'discount_type' | 'min_purchase'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          current_uses?: number;
          is_active?: boolean;
          discount_type?: 'flat' | 'percent';
          min_purchase?: number;
        };
        Update: Partial<Database['studiosync']['Tables']['promo_codes']['Insert']>;
      };
      discount_applications: {
        Row: {
          id: string;
          studio_id: string;
          promo_code_id: string;
          family_id: string | null;
          invoice_id: string | null;
          enrollment_id: string | null;
          discount_amount: number;
          applied_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['discount_applications']['Row'], 'id' | 'applied_at'> & {
          id?: string;
          applied_at?: string;
        };
        Update: Partial<Database['studiosync']['Tables']['discount_applications']['Insert']>;
      };
      notification_preferences: {
        Row: {
          id: string;
          studio_id: string;
          family_id: string;
          email_enabled: boolean;
          sms_enabled: boolean;
          push_enabled: boolean;
          invoice_notifications: boolean;
          enrollment_notifications: boolean;
          message_notifications: boolean;
          announcement_notifications: boolean;
          event_notifications: boolean;
          attendance_notifications: boolean;
          progress_notifications: boolean;
          phone_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['notification_preferences']['Row'], 'id' | 'created_at' | 'updated_at' | 'email_enabled' | 'sms_enabled' | 'push_enabled' | 'invoice_notifications' | 'enrollment_notifications' | 'message_notifications' | 'announcement_notifications' | 'event_notifications' | 'attendance_notifications' | 'progress_notifications'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email_enabled?: boolean;
          sms_enabled?: boolean;
          push_enabled?: boolean;
          invoice_notifications?: boolean;
          enrollment_notifications?: boolean;
          message_notifications?: boolean;
          announcement_notifications?: boolean;
          event_notifications?: boolean;
          attendance_notifications?: boolean;
          progress_notifications?: boolean;
        };
        Update: Partial<Database['studiosync']['Tables']['notification_preferences']['Insert']>;
      };
      notification_log: {
        Row: {
          id: string;
          studio_id: string;
          family_id: string | null;
          staff_id: string | null;
          type: string;
          channel: string;
          subject: string | null;
          body: string | null;
          recipient_email: string | null;
          recipient_phone: string | null;
          status: string;
          error_message: string | null;
          metadata: Json;
          sent_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['notification_log']['Row'], 'id' | 'created_at' | 'status'> & {
          id?: string;
          created_at?: string;
          status?: string;
        };
        Update: Partial<Database['studiosync']['Tables']['notification_log']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          studio_id: string;
          family_id: string;
          sender_type: 'parent' | 'admin';
          sender_id: string;
          body: string;
          is_read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['messages']['Row'], 'id' | 'created_at' | 'updated_at' | 'is_read'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          is_read?: boolean;
        };
        Update: Partial<Database['studiosync']['Tables']['messages']['Insert']>;
      };
      private_lessons: {
        Row: {
          id: string;
          studio_id: string;
          instructor_id: string;
          student_id: string;
          family_id: string;
          title: string;
          lesson_date: string;
          start_time: string;
          end_time: string;
          duration_minutes: number;
          price: number;
          status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
          location: string | null;
          notes: string | null;
          recurring: boolean;
          recurrence_rule: string | null;
          parent_recurrence_id: string | null;
          invoice_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['private_lessons']['Row'], 'id' | 'created_at' | 'updated_at' | 'status' | 'recurring' | 'duration_minutes' | 'price' | 'title'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
          recurring?: boolean;
          duration_minutes?: number;
          price?: number;
          title?: string;
        };
        Update: Partial<Database['studiosync']['Tables']['private_lessons']['Insert']>;
      };
      instructor_availability: {
        Row: {
          id: string;
          studio_id: string;
          instructor_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['instructor_availability']['Row'], 'id' | 'created_at' | 'updated_at' | 'is_active'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: Partial<Database['studiosync']['Tables']['instructor_availability']['Insert']>;
      };
      message_templates: {
        Row: {
          id: string;
          studio_id: string;
          name: string;
          subject: string | null;
          body: string;
          category: 'general' | 'billing' | 'enrollment' | 'attendance' | 'announcement' | 'reminder';
          merge_fields: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['message_templates']['Row'], 'id' | 'created_at' | 'updated_at' | 'category' | 'merge_fields' | 'is_active'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          category?: 'general' | 'billing' | 'enrollment' | 'attendance' | 'announcement' | 'reminder';
          merge_fields?: string[];
          is_active?: boolean;
        };
        Update: Partial<Database['studiosync']['Tables']['message_templates']['Insert']>;
      };
      time_clock_entries: {
        Row: {
          id: string;
          studio_id: string;
          staff_id: string;
          clock_in: string;
          clock_out: string | null;
          duration_minutes: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['time_clock_entries']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['studiosync']['Tables']['time_clock_entries']['Insert']>;
      };
      scheduled_messages: {
        Row: {
          id: string;
          studio_id: string;
          author_id: string;
          subject: string;
          body: string;
          channel: string;
          scheduled_at: string;
          sent_at: string | null;
          status: 'scheduled' | 'sent' | 'cancelled' | 'failed';
          target_type: string;
          target_id: string | null;
          target_tag: string | null;
          recipient_count: number | null;
          template_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['scheduled_messages']['Row'], 'id' | 'created_at' | 'updated_at' | 'status' | 'channel' | 'target_type' | 'recipient_count'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'scheduled' | 'sent' | 'cancelled' | 'failed';
          channel?: string;
          target_type?: string;
          recipient_count?: number | null;
        };
        Update: Partial<Database['studiosync']['Tables']['scheduled_messages']['Insert']>;
      };
      family_tags: {
        Row: {
          id: string;
          studio_id: string;
          family_id: string;
          tag: string;
          created_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['family_tags']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['studiosync']['Tables']['family_tags']['Insert']>;
      };
    };
  };
}

// Convenience type aliases
export type Studio = Database['studiosync']['Tables']['studios']['Row'];
export type Staff = Database['studiosync']['Tables']['staff']['Row'];
export type Family = Database['studiosync']['Tables']['families']['Row'];
export type Student = Database['studiosync']['Tables']['students']['Row'];
/** @deprecated Use Student instead */
export type Child = Student;
export type Season = Database['studiosync']['Tables']['seasons']['Row'];
export type ClassType = Database['studiosync']['Tables']['class_types']['Row'];
export type Level = Database['studiosync']['Tables']['levels']['Row'];
export type Class = Database['studiosync']['Tables']['classes']['Row'];
export type Enrollment = Database['studiosync']['Tables']['enrollments']['Row'];
export type TuitionPlan = Database['studiosync']['Tables']['tuition_plans']['Row'];
export type Payment = Database['studiosync']['Tables']['payments']['Row'];
export type StaffRole = Staff['role'];
export type EnrollmentStatus = Enrollment['status'];
export type PaymentType = Payment['type'];
export type PaymentStatus = Payment['status'];
export type ClassSession = Database['studiosync']['Tables']['class_sessions']['Row'];
export type Attendance = Database['studiosync']['Tables']['attendance']['Row'];
export type ClassSessionStatus = ClassSession['status'];
export type AttendanceStatus = Attendance['status'];
export type Invoice = Database['studiosync']['Tables']['invoices']['Row'];
export type InvoiceLineItem = Database['studiosync']['Tables']['invoice_line_items']['Row'];
export type InvoiceStatus = Invoice['status'];
export type Media = Database['studiosync']['Tables']['media']['Row'];
export type MediaType = Media['type'];
export type ProgressMark = Database['studiosync']['Tables']['progress_marks']['Row'];
export type Event = Database['studiosync']['Tables']['events']['Row'];
export type EventStatus = Event['status'];
export type TicketOrder = Database['studiosync']['Tables']['ticket_orders']['Row'];
export type TicketOrderStatus = TicketOrder['status'];
export type Announcement = Database['studiosync']['Tables']['announcements']['Row'];
export type AnnouncementTargetType = Announcement['target_type'];
export type Message = Database['studiosync']['Tables']['messages']['Row'];
export type Waiver = Database['studiosync']['Tables']['waivers']['Row'];
export type WaiverSignature = Database['studiosync']['Tables']['waiver_signatures']['Row'];
export type PromoCode = Database['studiosync']['Tables']['promo_codes']['Row'];
export type DiscountApplication = Database['studiosync']['Tables']['discount_applications']['Row'];
export type NotificationPreferences = Database['studiosync']['Tables']['notification_preferences']['Row'];
export type NotificationLog = Database['studiosync']['Tables']['notification_log']['Row'];
export type PrivateLesson = Database['studiosync']['Tables']['private_lessons']['Row'];
export type InstructorAvailability = Database['studiosync']['Tables']['instructor_availability']['Row'];
export type MessageTemplate = Database['studiosync']['Tables']['message_templates']['Row'];
export type TimeClockEntry = Database['studiosync']['Tables']['time_clock_entries']['Row'];
export type ScheduledMessage = Database['studiosync']['Tables']['scheduled_messages']['Row'];
export type FamilyTag = Database['studiosync']['Tables']['family_tags']['Row'];
