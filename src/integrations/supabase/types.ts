export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          agreed_days: number | null
          agreed_deposit: number
          agreed_rent_per_day: number | null
          amount_paid: number | null
          borrower_id: string
          borrower_notes: string | null
          consent_accepted_at: string | null
          created_at: string
          defect_notes: string | null
          has_defect: boolean
          id: string
          item_id: string
          owner_id: string
          owner_notes: string | null
          pickup_at: string | null
          pickup_person_name: string | null
          pickup_person_photo: string | null
          pickup_photo_url: string | null
          pickup_scheduled_at: string | null
          return_due: string | null
          return_person_name: string | null
          return_person_photo: string | null
          return_photo_url: string | null
          return_scheduled_at: string | null
          returned_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agreed_days?: number | null
          agreed_deposit?: number
          agreed_rent_per_day?: number | null
          amount_paid?: number | null
          borrower_id: string
          borrower_notes?: string | null
          consent_accepted_at?: string | null
          created_at?: string
          defect_notes?: string | null
          has_defect?: boolean
          id?: string
          item_id: string
          owner_id: string
          owner_notes?: string | null
          pickup_at?: string | null
          pickup_person_name?: string | null
          pickup_person_photo?: string | null
          pickup_photo_url?: string | null
          pickup_scheduled_at?: string | null
          return_due?: string | null
          return_person_name?: string | null
          return_person_photo?: string | null
          return_photo_url?: string | null
          return_scheduled_at?: string | null
          returned_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agreed_days?: number | null
          agreed_deposit?: number
          agreed_rent_per_day?: number | null
          amount_paid?: number | null
          borrower_id?: string
          borrower_notes?: string | null
          consent_accepted_at?: string | null
          created_at?: string
          defect_notes?: string | null
          has_defect?: boolean
          id?: string
          item_id?: string
          owner_id?: string
          owner_notes?: string | null
          pickup_at?: string | null
          pickup_person_name?: string | null
          pickup_person_photo?: string | null
          pickup_photo_url?: string | null
          pickup_scheduled_at?: string | null
          return_due?: string | null
          return_person_name?: string | null
          return_person_photo?: string | null
          return_photo_url?: string | null
          return_scheduled_at?: string | null
          returned_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          address: string | null
          building_name: string | null
          category: string
          created_at: string
          deposit_amount: number | null
          description: string | null
          distance_hint: string | null
          id: string
          image_url: string | null
          lat: number | null
          lng: number | null
          owner_id: string
          price_amount: number | null
          price_mode: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          building_name?: string | null
          category: string
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          distance_hint?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          owner_id: string
          price_amount?: number | null
          price_mode?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          building_name?: string | null
          category?: string
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          distance_hint?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          owner_id?: string
          price_amount?: number | null
          price_mode?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          booking_id: string | null
          created_at: string
          id: string
          peer_id: string | null
          request_id: string | null
          sender_id: string
        }
        Insert: {
          body: string
          booking_id?: string | null
          created_at?: string
          id?: string
          peer_id?: string | null
          request_id?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          booking_id?: string | null
          created_at?: string
          id?: string
          peer_id?: string | null
          request_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read_at: string | null
          recipient_id: string
          request_id: string | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          recipient_id: string
          request_id?: string | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          recipient_id?: string
          request_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          building_name: string | null
          created_at: string
          display_name: string | null
          email_enabled: boolean
          id: string
          lat: number | null
          lng: number | null
          neighborhood: string | null
          phone: string | null
          push_enabled: boolean
          radius_km: number
          require_handoff_person: boolean
          updated_at: string
          verification: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          building_name?: string | null
          created_at?: string
          display_name?: string | null
          email_enabled?: boolean
          id: string
          lat?: number | null
          lng?: number | null
          neighborhood?: string | null
          phone?: string | null
          push_enabled?: boolean
          radius_km?: number
          require_handoff_person?: boolean
          updated_at?: string
          verification?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          building_name?: string | null
          created_at?: string
          display_name?: string | null
          email_enabled?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          neighborhood?: string | null
          phone?: string | null
          push_enabled?: boolean
          radius_km?: number
          require_handoff_person?: boolean
          updated_at?: string
          verification?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      request_offers: {
        Row: {
          created_at: string
          helper_id: string
          id: string
          note: string | null
          request_id: string
        }
        Insert: {
          created_at?: string
          helper_id: string
          id?: string
          note?: string | null
          request_id: string
        }
        Update: {
          created_at?: string
          helper_id?: string
          id?: string
          note?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          lat: number | null
          lng: number | null
          needed_by: string | null
          owner_id: string
          radius_km: number
          status: string
          title: string
          updated_at: string
          urgency: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          needed_by?: string | null
          owner_id: string
          radius_km?: number
          status?: string
          title: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          needed_by?: string | null
          owner_id?: string
          radius_km?: number
          status?: string
          title?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_chat_on_booking: {
        Args: { _booking_id: string; _user_id: string }
        Returns: boolean
      }
      can_chat_on_request: {
        Args: { _peer_id: string; _request_id: string; _user_id: string }
        Returns: boolean
      }
      get_booking_contact: {
        Args: { _booking_id: string }
        Returns: {
          address: string
          avatar_url: string
          building_name: string
          display_name: string
          phone: string
          role: string
          user_id: string
        }[]
      }
      get_public_profile: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
        }[]
      }
      get_request_contact: {
        Args: { _peer_id: string; _request_id: string }
        Returns: {
          address: string
          avatar_url: string
          building_name: string
          display_name: string
          phone: string
          user_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
