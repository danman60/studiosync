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
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['families']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['studiosync']['Tables']['families']['Insert']>;
      };
      children: {
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
        Insert: Omit<Database['studiosync']['Tables']['children']['Row'], 'id' | 'created_at' | 'updated_at' | 'active'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          active?: boolean;
        };
        Update: Partial<Database['studiosync']['Tables']['children']['Insert']>;
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
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['seasons']['Row'], 'id' | 'created_at' | 'updated_at' | 'is_current'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          is_current?: boolean;
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
          child_id: string;
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
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          amount: number;
          interval: 'month' | 'year';
          status: 'active' | 'past_due' | 'cancelled' | 'paused';
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['studiosync']['Tables']['tuition_plans']['Row'], 'id' | 'created_at' | 'updated_at' | 'interval' | 'status'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          interval?: 'month' | 'year';
          status?: 'active' | 'past_due' | 'cancelled' | 'paused';
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
    };
  };
}

// Convenience type aliases
export type Studio = Database['studiosync']['Tables']['studios']['Row'];
export type Staff = Database['studiosync']['Tables']['staff']['Row'];
export type Family = Database['studiosync']['Tables']['families']['Row'];
export type Child = Database['studiosync']['Tables']['children']['Row'];
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
